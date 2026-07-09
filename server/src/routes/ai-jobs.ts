/**
 * AI jobs list + enhanced detail with context snapshot summary.
 */

import type { Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { getSupabaseClient } from '../supabase.js';
import { verifyOrgMembership } from '../services/ai-jobs-db.js';
import { getPermissions } from '../services/permissions.js';
import { isSupabaseServiceConfigured } from '../services/steward-db.js';

const listQuerySchema = z.object({
  organizationId: z.string().uuid(),
  brandId: z.string().uuid().optional(),
  operation: z.string().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

function redactErrorMessage(msg: string | null | undefined): string | null {
  if (!msg) return null;
  return msg
    .replace(/sk-[a-zA-Z0-9_-]+/g, '[REDACTED]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]')
    .slice(0, 500);
}

function mapJobSummary(row: Record<string, unknown>) {
  return {
    id: row.id,
    organization_id: row.organization_id,
    brand_id: row.brand_id,
    user_id: row.user_id,
    operation: row.operation ?? row.job_type,
    status: row.status,
    model: row.model ?? row.model_name,
    prompt_name: row.operation ?? row.job_type,
    prompt_version: row.prompt_version,
    validation_status: (row.metadata as Record<string, unknown> | null)?.validation_status ?? null,
    error_code: row.error_code,
    error_message: redactErrorMessage(row.error_message as string | null),
    token_input: row.input_tokens ?? 0,
    token_output: row.output_tokens ?? 0,
    token_total: row.total_tokens ?? 0,
    estimated_cost_cents: row.estimated_cost_cents ?? 0,
    started_at: row.started_at,
    completed_at: row.completed_at,
    created_at: row.created_at,
    related_post_id: row.related_post_id,
    related_asset_id: row.related_asset_id,
    context_snapshot_available: false,
    safety_review_status: (row.metadata as Record<string, unknown> | null)?.safety_review_status ?? null,
  };
}

function buildContextSnapshotSummary(contextJson: Record<string, unknown> | null, promptVersion: string | null) {
  if (!contextJson) return null;
  const ctx = contextJson as {
    brandProfile?: Record<string, unknown>;
    approvedMemoryFacts?: unknown[];
    userPreferences?: Record<string, unknown>;
    contentPillars?: { name?: string }[];
    hashtags?: { hashtag?: string }[];
    ctas?: { cta_text?: string }[];
    platformStrategy?: Record<string, unknown>;
    brandRules?: { rule_name?: string; severity?: string }[];
    missingContext?: string[];
    meta?: { operation?: string };
  };

  return {
    brand_facts_used: (ctx.approvedMemoryFacts ?? []).slice(0, 20),
    user_preferences_used: ctx.userPreferences ?? null,
    content_pillars_used: (ctx.contentPillars ?? []).map((p) => p.name).filter(Boolean),
    cta_hashtags_used: {
      ctas: (ctx.ctas ?? []).map((c) => c.cta_text).filter(Boolean).slice(0, 10),
      hashtags: (ctx.hashtags ?? []).map((h) => h.hashtag).filter(Boolean).slice(0, 20),
    },
    platform_strategy_used: ctx.platformStrategy ?? null,
    missing_context: ctx.missingContext ?? [],
    safety_rules_applied: (ctx.brandRules ?? []).map((r) => ({
      name: r.rule_name,
      severity: r.severity,
    })),
    context_hash: null,
    prompt_version: promptVersion,
    business_name: ctx.brandProfile?.business_name ?? null,
  };
}

export async function listAiJobsHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!isSupabaseServiceConfigured()) {
    res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Supabase service role is not configured.' });
    return;
  }
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return;
  }

  try {
    const query = listQuerySchema.parse(req.query);
    const role = await verifyOrgMembership(userId, query.organizationId);
    const perms = getPermissions(role);
    if (!perms.canReadAiJobs) {
      res.status(403).json({ code: 'FORBIDDEN', message: 'Cannot read AI jobs' });
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Supabase not configured' });
      return;
    }

    let dbQuery = client
      .from('ai_jobs_safe')
      .select('*')
      .eq('organization_id', query.organizationId)
      .order('created_at', { ascending: false })
      .limit(query.limit + 1);

    if (query.brandId) dbQuery = dbQuery.eq('brand_id', query.brandId);
    if (query.operation) dbQuery = dbQuery.eq('operation', query.operation);
    if (query.status) dbQuery = dbQuery.eq('status', query.status);
    if (query.from) dbQuery = dbQuery.gte('created_at', query.from);
    if (query.to) dbQuery = dbQuery.lte('created_at', query.to);
    if (query.cursor) dbQuery = dbQuery.lt('created_at', query.cursor);

    const { data, error } = await dbQuery;
    if (error) {
      res.status(500).json({ code: 'AI_JOBS_LIST_ERROR', message: error.message });
      return;
    }

    const rows = data ?? [];
    const hasMore = rows.length > query.limit;
    const page = hasMore ? rows.slice(0, query.limit) : rows;

    const jobIds = page.map((r) => r.id as string);
    let snapshotJobIds = new Set<string>();
    if (jobIds.length > 0) {
      const { data: snapshots } = await client
        .from('ai_context_snapshots')
        .select('ai_job_id')
        .in('ai_job_id', jobIds);
      snapshotJobIds = new Set((snapshots ?? []).map((s) => s.ai_job_id as string).filter(Boolean));
    }

    const jobs = page.map((row) => ({
      ...mapJobSummary(row as Record<string, unknown>),
      context_snapshot_available: snapshotJobIds.has(row.id as string),
    }));

    res.json({
      jobs,
      pagination: {
        limit: query.limit,
        hasMore,
        nextCursor: hasMore ? (page[page.length - 1]?.created_at as string) : null,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ code: 'VALIDATION_ERROR', message: err.message });
      return;
    }
    if (err instanceof Error && err.message === 'ORG_ACCESS_DENIED') {
      res.status(403).json({ code: 'FORBIDDEN', message: 'Organization access denied' });
      return;
    }
    res.status(500).json({ code: 'AI_JOBS_LIST_ERROR', message: 'Failed to list AI jobs' });
  }
}

export async function getAiJobDetailHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!isSupabaseServiceConfigured()) {
    res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Supabase service role is not configured.' });
    return;
  }
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return;
  }

  const client = getSupabaseClient();
  if (!client) {
    res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Supabase not configured' });
    return;
  }

  const { data, error } = await client
    .from('ai_jobs_safe')
    .select('*')
    .eq('id', req.params.jobId)
    .maybeSingle();

  if (error) {
    res.status(500).json({ code: 'AI_JOB_ERROR', message: error.message });
    return;
  }
  if (!data) {
    res.status(404).json({ code: 'JOB_NOT_FOUND', message: 'AI job not found' });
    return;
  }

  try {
    const role = await verifyOrgMembership(userId, data.organization_id as string);
    const perms = getPermissions(role);

    const { data: snapshot } = await client
      .from('ai_context_snapshots')
      .select('id, context_json, context_hash, prompt_version, created_at')
      .eq('ai_job_id', data.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const structured = data.structured_output_json as Record<string, unknown> | null;
    const safeOutput = structured && typeof structured === 'object' ? structured : null;

    const summary = mapJobSummary(data as Record<string, unknown>);
    summary.context_snapshot_available = Boolean(snapshot);

    const contextSummary = snapshot
      ? {
          ...buildContextSnapshotSummary(snapshot.context_json as Record<string, unknown>, snapshot.prompt_version as string),
          context_hash: snapshot.context_hash,
          snapshot_id: snapshot.id,
          created_at: snapshot.created_at,
        }
      : null;

    res.json({
      job: summary,
      input_summary: {
        operation: data.operation ?? data.job_type,
        related_post_id: data.related_post_id,
        related_asset_id: data.related_asset_id,
      },
      output: perms.canReadAiJobDetails ? safeOutput : null,
      validation_errors: (data.metadata as Record<string, unknown> | null)?.validation_errors ?? null,
      error_message: redactErrorMessage(data.error_message as string | null),
      related: {
        post_id: data.related_post_id,
        asset_id: data.related_asset_id,
        brand_id: data.brand_id,
      },
      context_snapshot_summary: contextSummary,
      can_retry: data.status === 'failed' && perms.canEditPosts,
    });
  } catch {
    res.status(403).json({ code: 'FORBIDDEN', message: 'You cannot access this AI job.' });
  }
}
