/**
 * Steward AI Gateway — central orchestrator. All OpenAI calls flow through here.
 */

import { brandContextToPromptBlock, gatherBrandContext } from './brand-context.js';
import {
  compileAIContextForOperation,
  getStewardBrandContext,
  saveAiContextSnapshot,
} from '../services/brand-intelligence.js';
import type { StewardBrandContext } from '../types/brand-intelligence.js';
import { callOpenAiStructured, resolveModelKey } from './client.js';
import { AiConfigError, requireAiGatewayConfig as loadRequiredConfig } from './config.js';
import { AiGatewayError } from './errors.js';
import { enforceOrgBudget, estimateCostCents } from './cost.js';
import { sanitizeRecord, assertNoAutoPublishInstruction } from './guardrails.js';
import { logAiEvent } from './logging.js';
import { buildRepairPrompt, buildSystemPrompt, getPrompt } from './prompts.js';
import { enforceRateLimits } from './rate-limit.js';
import { parseStructuredOutput } from './schemas.js';
import {
  OPERATION_MODEL_MAP,
  OPERATION_SCHEMA_MAP,
  OPERATION_TO_JOB_TYPE,
  type AiGatewayRunInput,
  type AiGatewayRunResult,
} from './types.js';
import {
  buildContentScoreUserPrompt,
  buildMediaAnalysisUserPrompt,
  buildModerationUserPrompt,
  buildPlatformVariantUserPrompt,
  buildPostDraftUserPrompt,
  buildScheduleUserPrompt,
} from './operations/prompt-builders.js';
import {
  getAssetById,
  getOrganizationSubscriptionTier,
  getPostById,
  insertAiJobRecord,
  markAiJobFailed,
  markAiJobRunning,
  markAiJobSucceeded,
  updateAiJobRecord,
  updateAssetAiMetadata,
  verifyOrgMembership,
} from '../services/ai-jobs-db.js';
import {
  createPostDraft,
  createPostVariant,
} from '../services/steward-db.js';

function canRunAi(role: string): boolean {
  return ['owner', 'admin', 'strategist', 'editor', 'manager', 'publisher'].includes(role);
}

async function buildUserPrompt(
  operation: AiGatewayRunInput['operation'],
  ctx: AiGatewayRunInput['ctx'],
  input: Record<string, unknown>,
  brandCtx: StewardBrandContext
): Promise<string> {
  switch (operation) {
    case 'media_analysis': {
      const assetId = input.assetId as string | undefined;
      let assetDescription = (input.description as string) || '';
      if (assetId) {
        const asset = await getAssetById(assetId, ctx.organizationId);
        assetDescription = [
          assetDescription,
          asset.alt_text,
          asset.transcription,
          asset.file_name,
          asset.mime_type,
          JSON.stringify(asset.visual_analysis ?? {}),
        ]
          .filter(Boolean)
          .join('\n');
      }
      return buildMediaAnalysisUserPrompt({
        assetDescription: assetDescription || 'No media description available.',
        mimeType: (input.mimeType as string) || undefined,
        fileName: (input.fileName as string) || undefined,
        userNotes: (input.userNotes as string) || undefined,
      });
    }
    case 'post_draft_generation':
      return buildPostDraftUserPrompt({
        ctx: brandCtx,
        assetSummaries: (input.assetSummaries as string[]) || undefined,
        userPrompt: (input.userPrompt as string) || undefined,
        platforms: (input.platforms as string[]) || undefined,
      });
    case 'platform_variant_generation': {
      const postId = input.postId as string;
      const post = await getPostById(postId, ctx.organizationId);
      return buildPlatformVariantUserPrompt({
        postContent: (post.main_caption as string) || (post.content as string),
        platforms: (input.platforms as string[]) || [post.platform as string],
        hook: (post.hook as string) || undefined,
        hashtags: (post.hashtags as string[]) || undefined,
      });
    }
    case 'schedule_recommendation':
      return buildScheduleUserPrompt({
        platform: (input.platform as string) || 'instagram',
        timezone:
          (input.timezone as string) ||
          (brandCtx.brandProfile?.timezone as string) ||
          (brandCtx.organization.timezone as string) ||
          'America/Chicago',
        contentPillar: (input.contentPillar as string) || undefined,
        draftCaption: (input.draftCaption as string) || undefined,
        existingScheduled: brandCtx.schedules.map(
          (p) => `${p.title ?? p.name} — day ${p.day_of_week} ${p.start_time}`
        ),
      });
    case 'content_score':
      return buildContentScoreUserPrompt({
        caption: (input.caption as string) || '',
        platform: (input.platform as string) || 'instagram',
        hook: (input.hook as string) || undefined,
      });
    case 'moderation_check':
      return buildModerationUserPrompt({
        caption: (input.caption as string) || '',
        platform: (input.platform as string) || 'instagram',
        isKidsContent: Boolean(input.isKidsContent),
      });
    default:
      return JSON.stringify(sanitizeRecord(input));
  }
}

export async function runAiGatewayOperation<T = unknown>(
  run: AiGatewayRunInput
): Promise<AiGatewayRunResult<T>> {
  let cfg;
  try {
    cfg = loadRequiredConfig();
  } catch (err) {
    if (err instanceof AiConfigError) {
      throw new AiGatewayError('AI_NOT_CONFIGURED', err.message, 503);
    }
    throw err;
  }
  const safeInput = sanitizeRecord(run.input);
  if (typeof safeInput.userPrompt === 'string') {
    assertNoAutoPublishInstruction(safeInput.userPrompt);
  }

  const role = await verifyOrgMembership(run.ctx.userId, run.ctx.organizationId);
  if (!canRunAi(role)) {
    throw new AiGatewayError('FORBIDDEN', 'You do not have permission to run AI operations.', 403);
  }

  const subscriptionTier =
    run.ctx.subscriptionTier ?? (await getOrganizationSubscriptionTier(run.ctx.organizationId));

  enforceRateLimits({
    userId: run.ctx.userId,
    organizationId: run.ctx.organizationId,
    operation: run.operation,
    subscriptionTier,
  });
  await enforceOrgBudget(run.ctx.organizationId, cfg);

  const mapping = OPERATION_SCHEMA_MAP[run.operation];
  if (!mapping) {
    throw new AiGatewayError('VALIDATION_ERROR', `Unsupported structured operation: ${run.operation}`, 400);
  }

  const promptDef = getPrompt(mapping.promptName);
  const stewardCtx = await getStewardBrandContext({
    organizationId: run.ctx.organizationId,
    brandId: run.ctx.brandId,
    userId: run.ctx.userId,
    operation: run.operation,
    platform: safeInput.platform as string | undefined,
    contentPillarId: safeInput.contentPillarId as string | undefined,
    postId: run.relatedPostId,
    assetIds: safeInput.assetIds as string[] | undefined,
  });

  const compiled = compileAIContextForOperation({
    operation: run.operation,
    stewardBrandContext: stewardCtx,
    userRequest: safeInput,
    platform: safeInput.platform as string | undefined,
    outputSchemaName: mapping.schemaName,
  });

  const systemPrompt = [
    compiled.systemContext,
    buildSystemPrompt(mapping.promptName, compiled.brandContextBlock),
    `Safety context:\n${compiled.safetyContext}`,
    compiled.outputSchemaRequirement,
    compiled.missingContextWarnings.length
      ? `Missing brand context warnings: ${compiled.missingContextWarnings.join(', ')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const operationUserPrompt = await buildUserPrompt(run.operation, run.ctx, safeInput, stewardCtx);
  const userPrompt = [compiled.userRequestContext, operationUserPrompt].filter(Boolean).join('\n\n');

  const aiJobId = await insertAiJobRecord({
    organizationId: run.ctx.organizationId,
    brandId: run.ctx.brandId,
    userId: run.ctx.userId,
    operation: run.operation,
    jobType: OPERATION_TO_JOB_TYPE[run.operation],
    requestInput: safeInput,
    promptVersion: promptDef.version,
    relatedPostId: run.relatedPostId,
    relatedAssetId: run.relatedAssetId,
  });

  const snapshotId = await saveAiContextSnapshot({
    context: stewardCtx,
    aiJobId,
    promptVersion: promptDef.version,
  });
  await updateAiJobRecord(aiJobId, {
    context_snapshot_id: snapshotId,
    prompt_name: mapping.promptName,
    validation_status: 'pending',
  });

  const modelKey = OPERATION_MODEL_MAP[run.operation];
  const model = resolveModelKey(cfg, modelKey);
  await markAiJobRunning(aiJobId, model);

  const started = Date.now();
  logAiEvent('info', 'AI operation started', {
    operation: run.operation,
    organizationId: run.ctx.organizationId,
    userId: run.ctx.userId,
    aiJobId,
    model,
    status: 'running',
  });

  try {
    let result = await callOpenAiStructured({
      cfg,
      model,
      systemPrompt,
      userPrompt,
      schema: mapping.schema,
      schemaName: mapping.schemaName,
      operation: run.operation,
      aiJobId,
    });

    try {
      parseStructuredOutput(mapping.schema, result.parsed, mapping.schemaName);
    } catch (validationErr) {
      const repairPrompt = `${userPrompt}\n\n${buildRepairPrompt(
        validationErr instanceof Error ? validationErr.message : 'invalid schema'
      )}`;
      result = await callOpenAiStructured({
        cfg,
        model,
        systemPrompt,
        userPrompt: repairPrompt,
        schema: mapping.schema,
        schemaName: mapping.schemaName,
        operation: run.operation,
        aiJobId,
        isRepair: true,
      });
      parseStructuredOutput(mapping.schema, result.parsed, mapping.schemaName);
    }

    const structured = result.parsed as Record<string, unknown>;
    const estimatedCostCents = estimateCostCents(model, result.inputTokens, result.outputTokens);

    await markAiJobSucceeded(aiJobId, {
      structuredOutput: structured,
      rawOutput: result.rawText,
      model,
      promptVersion: promptDef.version,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      totalTokens: result.totalTokens,
      estimatedCostCents,
    });
    await updateAiJobRecord(aiJobId, { validation_status: 'valid' });

    const warnings: string[] = [];
    let needsHumanReview = false;

    if (Array.isArray(structured.missing_brand_context) && structured.missing_brand_context.length) {
      warnings.push(`Missing brand context: ${(structured.missing_brand_context as string[]).join(', ')}`);
    }
    if (Array.isArray(structured.missing_context) && structured.missing_context.length) {
      warnings.push(`Missing context: ${(structured.missing_context as string[]).join(', ')}`);
    }
    if (stewardCtx.missingContext.length) {
      warnings.push(`Context gaps: ${stewardCtx.missingContext.join(', ')}`);
    }
    if (structured.needs_human_review === true) {
      needsHumanReview = true;
      warnings.push('Human review recommended.');
    }
    if (structured.human_review_required === true || structured.approved === false) {
      needsHumanReview = true;
      if (run.operation === 'moderation_check' && structured.recommended_action === 'block') {
        warnings.push('Moderation blocked this content from scheduling.');
      }
    }

    // Optional persistence hooks
    if (run.operation === 'media_analysis' && run.relatedAssetId) {
      await updateAssetAiMetadata(run.relatedAssetId, {
        visual_analysis: structured,
        content_category: structured.content_category as string,
      });
    }

    if (run.persistDraft && run.operation === 'post_draft_generation') {
      const draft = structured as {
        internal_title: string;
        hook: string;
        caption: string;
        cta: string;
        hashtags: string[];
        suggested_platforms: string[];
        needs_human_review: boolean;
      };
      await createPostDraft({
        organizationId: run.ctx.organizationId,
        brandId: run.ctx.brandId,
        authorId: run.ctx.userId,
        content: draft.caption,
        platform: draft.suggested_platforms[0] || 'instagram',
        status: draft.needs_human_review ? 'needs_review' : 'draft',
        title: draft.internal_title,
        hook: draft.hook,
        cta: draft.cta,
        hashtags: draft.hashtags,
        metadata: { aiJobId, source: 'ai-gateway' },
      });
    }

    if (run.persistVariants && run.operation === 'platform_variant_generation') {
      const postId = safeInput.postId as string;
      const variants = (structured as { variants: Array<Record<string, unknown>> }).variants ?? [];
      for (const v of variants) {
        await createPostVariant({
          postId,
          organizationId: run.ctx.organizationId,
          brandId: run.ctx.brandId,
          platform: v.platform as never,
          caption: v.caption as string,
          hook: undefined,
          hashtags: v.hashtags as string[],
          title: v.title as string,
          description: v.description as string,
          firstComment: v.first_comment as string,
          metadata: {
            aiJobId,
            platform_warnings: v.platform_warnings,
            ready_to_schedule: v.ready_to_schedule,
          },
        });
      }
    }

    logAiEvent('info', 'AI operation succeeded', {
      operation: run.operation,
      organizationId: run.ctx.organizationId,
      userId: run.ctx.userId,
      aiJobId,
      model,
      status: 'succeeded',
      durationMs: Date.now() - started,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCostCents,
    });

    return {
      aiJobId,
      operation: run.operation,
      status: 'succeeded',
      result: result.parsed as T,
      needsHumanReview,
      warnings,
      model,
      promptVersion: promptDef.version,
      estimatedCostCents,
      totalTokens: result.totalTokens,
    };
  } catch (err) {
    const code = err instanceof AiGatewayError ? err.code : 'OPENAI_ERROR';
    const message = err instanceof Error ? err.message : 'AI operation failed';
    await markAiJobFailed(aiJobId, code, message);
    logAiEvent('error', 'AI operation failed', {
      operation: run.operation,
      organizationId: run.ctx.organizationId,
      userId: run.ctx.userId,
      aiJobId,
      model,
      status: 'failed',
      durationMs: Date.now() - started,
      errorCode: code,
    });
    throw err instanceof AiGatewayError
      ? err
      : new AiGatewayError('OPENAI_ERROR', message, 502);
  }
}

export { logAiGatewayStartupStatus } from './config.js';
