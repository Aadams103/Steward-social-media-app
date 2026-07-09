/**
 * Steward AI Social Media Agent — orchestrator.
 *
 * A deterministic planner drives bounded AI operations through the existing
 * AI Gateway. Safety invariants:
 *   - Never publishes. Generated drafts land in the approval workflow.
 *   - All AI calls flow through runAiGatewayOperation (budget, rate limits,
 *     moderation, context snapshots, ai_jobs records).
 *   - Every planned and executed action is recorded in ai_decision_logs
 *     and audit_logs.
 *   - No fabricated analytics: ingestion writes insights only from real rows.
 */

import { getSupabaseClient } from '../supabase.js';
import { runAiGatewayOperation } from '../ai/gateway.js';
import { getStewardBrandContext } from '../services/brand-intelligence.js';
import { verifyOrgMembership } from '../services/ai-jobs-db.js';
import { logAuditEvent } from '../services/workspace.js';
import { ingestBrandAnalytics } from './analytics-ingest.js';
import {
  DEFAULT_AGENT_CONFIG,
  type AgentAction,
  type AgentActionResult,
  type AgentPipelineSnapshot,
  type AgentRunConfig,
  type AgentRunReport,
} from './types.js';

const REVIEW_STATUSES = ['pending', 'pending_approval', 'needs_review', 'in_review'];

// ---------------------------------------------------------------------------
// Assessment
// ---------------------------------------------------------------------------

export async function assessPipeline(
  organizationId: string,
  brandId: string,
  missingBrandContext: string[],
  weeklyPostingTarget: number
): Promise<AgentPipelineSnapshot> {
  const client = getSupabaseClient();
  if (!client) throw new Error('SUPABASE_NOT_CONFIGURED');

  const now = Date.now();
  const in7DaysMs = now + 7 * 24 * 60 * 60 * 1000;

  const [postsRes, accountsRes, ingestedRes, variantsRes] = await Promise.all([
    client
      .from('posts')
      .select('id, status, approval_state, platform, scheduled_time')
      .eq('brand_id', brandId)
      .is('archived_at', null)
      .order('updated_at', { ascending: false })
      .limit(200),
    client
      .from('social_accounts')
      .select('platform, status')
      .eq('brand_id', brandId)
      .is('archived_at', null),
    client
      .from('ingested_posts')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', brandId),
    client
      .from('post_variants')
      .select('post_id')
      .eq('brand_id', brandId),
  ]);

  const posts = postsRes.data ?? [];
  const accounts = accountsRes.data ?? [];
  const variantPostIds = new Set((variantsRes.data ?? []).map((v) => v.post_id as string));

  const drafts = posts.filter((p) => p.status === 'draft');
  const needsReview = posts.filter((p) => REVIEW_STATUSES.includes(String(p.status)));
  const approved = posts.filter(
    (p) => p.status === 'approved' || p.approval_state === 'approved'
  );
  const scheduledNext7Days = posts.filter((p) => {
    if (!p.scheduled_time || !['approved', 'scheduled'].includes(String(p.status))) return false;
    const t = new Date(p.scheduled_time as string).getTime();
    return Number.isFinite(t) && t >= now && t <= in7DaysMs;
  }).length;

  return {
    draftCount: drafts.length,
    needsReviewCount: needsReview.length,
    approvedUnscheduledIds: approved.filter((p) => !p.scheduled_time).map((p) => p.id as string),
    scheduledNext7Days,
    postsMissingVariants: approved
      .filter((p) => !variantPostIds.has(p.id as string))
      .map((p) => ({ id: p.id as string, platform: p.platform as string })),
    unscheduledDraftIds: drafts.filter((p) => !p.scheduled_time).map((p) => p.id as string),
    connectedAccountPlatforms: accounts
      .filter((a) => ['connected', 'active'].includes(String(a.status)))
      .map((a) => a.platform as string),
    hasAnalyticsSource: (ingestedRes.count ?? 0) > 0,
    ingestedPostCount: ingestedRes.count ?? 0,
    missingBrandContext,
    weeklyPostingTarget,
  };
}

// ---------------------------------------------------------------------------
// Planning (pure — unit-testable)
// ---------------------------------------------------------------------------

export function planAgentActions(
  snapshot: AgentPipelineSnapshot,
  config: AgentRunConfig
): AgentAction[] {
  const actions: AgentAction[] = [];

  if (snapshot.hasAnalyticsSource) {
    actions.push({
      type: 'ingest_analytics',
      reason: `${snapshot.ingestedPostCount} ingested posts available for insight aggregation.`,
    });
  }

  // Critical setup gaps block content generation — flag instead of generating
  // content from incomplete brand context.
  const criticalGaps = snapshot.missingBrandContext.filter((g) =>
    ['business_name', 'brand_voice'].includes(g)
  );
  if (criticalGaps.length > 0) {
    actions.push({
      type: 'flag_setup_gap',
      reason: `Brand context missing: ${criticalGaps.join(', ')}. Drafting paused until brand setup is complete.`,
      params: { gaps: criticalGaps },
    });
    return actions;
  }

  // Content pipeline: keep the week's queue fed, but never flood the backlog.
  const pipelineDepth = snapshot.draftCount + snapshot.needsReviewCount;
  const scheduleShortfall = Math.max(0, snapshot.weeklyPostingTarget - snapshot.scheduledNext7Days);
  const backlogCapacity = Math.max(0, snapshot.weeklyPostingTarget * 2 - pipelineDepth);
  const draftsToGenerate = Math.min(scheduleShortfall, backlogCapacity, config.maxDraftsPerCycle);

  for (let i = 0; i < draftsToGenerate; i++) {
    actions.push({
      type: 'generate_draft',
      reason: `Scheduled queue has ${snapshot.scheduledNext7Days}/${snapshot.weeklyPostingTarget} posts for the next 7 days.`,
    });
  }

  for (const post of snapshot.postsMissingVariants.slice(0, config.maxVariantOpsPerCycle)) {
    actions.push({
      type: 'generate_variants',
      reason: 'Approved post lacks platform variants.',
      targetId: post.id,
      params: { platforms: [post.platform] },
    });
  }

  for (const postId of snapshot.unscheduledDraftIds.slice(0, config.maxScheduleRecsPerCycle)) {
    actions.push({
      type: 'recommend_schedule',
      reason: 'Draft has no scheduled time; recommending a window for human review.',
      targetId: postId,
    });
  }

  if (snapshot.connectedAccountPlatforms.length === 0) {
    actions.push({
      type: 'flag_setup_gap',
      reason: 'No connected social accounts — publishing is blocked until one is connected.',
      params: { gaps: ['connected_accounts'] },
    });
  }

  return actions;
}

// ---------------------------------------------------------------------------
// Execution
// ---------------------------------------------------------------------------

async function executeAction(
  action: AgentAction,
  ctx: { organizationId: string; brandId: string; userId: string }
): Promise<AgentActionResult> {
  try {
    switch (action.type) {
      case 'ingest_analytics': {
        const result = await ingestBrandAnalytics(ctx.organizationId, ctx.brandId);
        return {
          action,
          status: result.skippedReason ? 'skipped' : 'succeeded',
          resultSummary: result.skippedReason
            ? `Skipped: ${result.skippedReason}`
            : `Aggregated ${result.ingestedPostCount} posts into ${result.insightsWritten} insights.`,
        };
      }
      case 'generate_draft': {
        const run = await runAiGatewayOperation({
          operation: 'post_draft_generation',
          ctx,
          input: {
            organizationId: ctx.organizationId,
            brandId: ctx.brandId,
            userPrompt:
              'Autonomous agent cycle: create one on-brand post draft to fill the upcoming content queue. Use only approved brand context.',
          },
          persistDraft: true,
        });
        return {
          action,
          status: 'succeeded',
          aiJobId: run.aiJobId,
          resultSummary: `Draft generated (job ${run.aiJobId}); queued for human review.`,
        };
      }
      case 'generate_variants': {
        if (!action.targetId) return { action, status: 'skipped', resultSummary: 'No target post.' };
        const platforms = (action.params?.platforms as string[]) ?? ['instagram'];
        const run = await runAiGatewayOperation({
          operation: 'platform_variant_generation',
          ctx,
          input: {
            organizationId: ctx.organizationId,
            brandId: ctx.brandId,
            postId: action.targetId,
            platforms,
          },
          relatedPostId: action.targetId,
          persistVariants: true,
        });
        return {
          action,
          status: 'succeeded',
          aiJobId: run.aiJobId,
          resultSummary: `Variants generated for post ${action.targetId} (${platforms.join(', ')}).`,
        };
      }
      case 'recommend_schedule': {
        if (!action.targetId) return { action, status: 'skipped', resultSummary: 'No target post.' };
        const run = await runAiGatewayOperation({
          operation: 'schedule_recommendation',
          ctx,
          input: {
            organizationId: ctx.organizationId,
            brandId: ctx.brandId,
            postId: action.targetId,
            platform: (action.params?.platform as string) ?? 'instagram',
          },
          relatedPostId: action.targetId,
        });
        return {
          action,
          status: 'succeeded',
          aiJobId: run.aiJobId,
          resultSummary: 'Schedule recommendation recorded — human applies it from the calendar.',
        };
      }
      case 'flag_setup_gap':
      case 'moderate_backlog':
        return { action, status: 'succeeded', resultSummary: action.reason };
      default:
        return { action, status: 'skipped', resultSummary: 'Unknown action type.' };
    }
  } catch (err) {
    return {
      action,
      status: 'failed',
      error: err instanceof Error ? err.message.slice(0, 500) : String(err).slice(0, 500),
    };
  }
}

// ---------------------------------------------------------------------------
// Decision logging + notifications
// ---------------------------------------------------------------------------

async function recordAgentDecision(
  ctx: { organizationId: string; brandId: string; userId: string },
  report: Omit<AgentRunReport, 'decisionLogId'>
): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('ai_decision_logs')
    .insert({
      organization_id: ctx.organizationId,
      brand_id: ctx.brandId,
      user_id: ctx.userId,
      decision_type: 'agent_cycle',
      recommendation: {
        planned_actions: report.plannedActions,
        results: report.results.map((r) => ({
          type: r.action.type,
          status: r.status,
          ai_job_id: r.aiJobId ?? null,
          summary: r.resultSummary ?? r.error ?? null,
        })),
        snapshot: {
          drafts: report.snapshot.draftCount,
          needs_review: report.snapshot.needsReviewCount,
          scheduled_next_7_days: report.snapshot.scheduledNext7Days,
          weekly_target: report.snapshot.weeklyPostingTarget,
          connected_platforms: report.snapshot.connectedAccountPlatforms,
        },
        dry_run: report.dryRun,
      },
      reasoning_summary: report.plannedActions.map((a) => `${a.type}: ${a.reason}`).join(' | ').slice(0, 2000),
    })
    .select('id')
    .single();

  if (error) {
    console.error('[agent] Failed to record decision log:', error.message);
    return null;
  }
  return data.id as string;
}

async function notifyDraftsReady(
  ctx: { organizationId: string; brandId: string; userId: string },
  succeededDrafts: number
): Promise<void> {
  if (succeededDrafts === 0) return;
  const client = getSupabaseClient();
  if (!client) return;
  await client.from('notifications').insert({
    organization_id: ctx.organizationId,
    brand_id: ctx.brandId,
    user_id: ctx.userId,
    notification_type: 'ai_draft_ready',
    title: `Steward drafted ${succeededDrafts} post${succeededDrafts > 1 ? 's' : ''} for review`,
    body: 'Open the Approval Queue to review, edit, or reject the new drafts.',
    entity_type: 'agent_cycle',
  });
}

// ---------------------------------------------------------------------------
// Public entrypoint
// ---------------------------------------------------------------------------

export async function runAgentCycle(input: {
  organizationId: string;
  brandId: string;
  userId: string;
  config?: Partial<AgentRunConfig>;
}): Promise<AgentRunReport> {
  const config: AgentRunConfig = { ...DEFAULT_AGENT_CONFIG, ...input.config };
  const startedAt = new Date().toISOString();
  const warnings: string[] = [];

  // Membership + role check happens here and again inside every gateway call.
  await verifyOrgMembership(input.userId, input.organizationId);

  const brandCtx = await getStewardBrandContext({
    organizationId: input.organizationId,
    brandId: input.brandId,
    userId: input.userId,
    operation: 'agent_cycle',
  });

  const postingGoals = (brandCtx.brand.posting_goals ?? {}) as Record<string, unknown>;
  const weeklyTarget =
    Number(postingGoals.posts_per_week ?? postingGoals.weekly_target) > 0
      ? Number(postingGoals.posts_per_week ?? postingGoals.weekly_target)
      : 3;

  const snapshot = await assessPipeline(
    input.organizationId,
    input.brandId,
    brandCtx.missingContext,
    weeklyTarget
  );

  const plannedActions = planAgentActions(snapshot, config);

  const ctx = {
    organizationId: input.organizationId,
    brandId: input.brandId,
    userId: input.userId,
  };

  let results: AgentActionResult[];
  if (config.dryRun) {
    results = plannedActions.map((action) => ({ action, status: 'planned' as const }));
  } else {
    results = [];
    for (const action of plannedActions) {
      // Sequential on purpose: respects gateway rate limits and keeps costs bounded.
      results.push(await executeAction(action, ctx));
    }
  }

  const failedCount = results.filter((r) => r.status === 'failed').length;
  if (failedCount > 0) warnings.push(`${failedCount} action(s) failed — see results.`);
  if (snapshot.missingBrandContext.length > 0) {
    warnings.push(`Brand context gaps: ${snapshot.missingBrandContext.join(', ')}`);
  }

  const partialReport: Omit<AgentRunReport, 'decisionLogId'> = {
    organizationId: input.organizationId,
    brandId: input.brandId,
    startedAt,
    completedAt: new Date().toISOString(),
    dryRun: config.dryRun,
    snapshot,
    plannedActions,
    results,
    warnings,
  };

  const decisionLogId = config.dryRun ? null : await recordAgentDecision(ctx, partialReport);

  if (!config.dryRun) {
    await logAuditEvent({
      organizationId: input.organizationId,
      brandId: input.brandId,
      actorUserId: input.userId,
      action: 'agent.cycle_completed',
      entityType: 'agent_cycle',
      entityId: decisionLogId ?? undefined,
      metadata: {
        planned: plannedActions.length,
        succeeded: results.filter((r) => r.status === 'succeeded').length,
        failed: failedCount,
      },
    });

    const succeededDrafts = results.filter(
      (r) => r.action.type === 'generate_draft' && r.status === 'succeeded'
    ).length;
    await notifyDraftsReady(ctx, succeededDrafts);
  }

  return { ...partialReport, decisionLogId };
}
