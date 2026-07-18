/**
 * Steward AI Gateway — HTTP routes.
 * All OpenAI traffic must flow through runAiGatewayOperation.
 */

import type { Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { runAiGatewayOperation, logAiGatewayStartupStatus } from '../ai/gateway.js';
import { AiGatewayError, isAiGatewayError } from '../ai/errors.js';
import { isSupabaseServiceConfigured } from '../services/steward-db.js';
import type { AiOperation } from '../ai/types.js';

const baseBodySchema = z.object({
  organizationId: z.string().uuid(),
  brandId: z.string().uuid(),
});

const capabilityOperationSchema = z.enum([
  'media_analysis',
  'brand_context',
  'brand_summary',
  'content_strategy',
  'content_calendar',
  'hook_generation',
  'caption_generation',
  'post_draft_generation',
  'platform_variant_generation',
  'carousel_generation',
  'hashtag_generation',
  'schedule_recommendation',
  'content_score',
  'content_repurpose',
  'performance_analysis',
  'pattern_detection',
  'growth_tracking',
  'optimization_advice',
  'moderation_check',
]);

const genericRunSchema = baseBodySchema.extend({
  operation: capabilityOperationSchema,
  input: z.record(z.string(), z.unknown()).refine(
    (value) => JSON.stringify(value).length <= 100_000,
    'AI input is too large'
  ),
  relatedPostId: z.string().uuid().optional(),
  relatedAssetId: z.string().uuid().optional(),
  persistDraft: z.boolean().optional(),
  persistVariants: z.boolean().optional(),
});

const analyzeMediaSchema = baseBodySchema.extend({
  assetId: z.string().uuid().optional(),
  description: z.string().max(8000).optional(),
  mimeType: z.string().max(200).optional(),
  fileName: z.string().max(500).optional(),
  userNotes: z.string().max(4000).optional(),
});

const generatePostDraftSchema = baseBodySchema.extend({
  userPrompt: z.string().max(4000).optional(),
  assetSummaries: z.array(z.string().max(2000)).max(10).optional(),
  platforms: z.array(z.string().max(50)).max(10).optional(),
  assetIds: z.array(z.string().uuid()).max(10).optional(),
  persistDraft: z.boolean().optional(),
});

const generateVariantsSchema = baseBodySchema.extend({
  postId: z.string().uuid(),
  platforms: z.array(z.string().max(50)).min(1).max(10),
  persistVariants: z.boolean().optional(),
});

const recommendScheduleSchema = baseBodySchema.extend({
  postId: z.string().uuid().optional(),
  platform: z.string().max(50),
  timezone: z.string().max(100).optional(),
  contentPillar: z.string().max(200).optional(),
  draftCaption: z.string().max(8000).optional(),
});

const scoreContentSchema = baseBodySchema.extend({
  caption: z.string().min(1).max(8000),
  platform: z.string().max(50),
  hook: z.string().max(500).optional(),
  postId: z.string().uuid().optional(),
});

const moderateContentSchema = baseBodySchema.extend({
  caption: z.string().min(1).max(8000),
  platform: z.string().max(50),
  isKidsContent: z.boolean().optional(),
  postId: z.string().uuid().optional(),
});

function getBrandId(req: AuthenticatedRequest, bodyBrandId?: string): string {
  return (req.headers['x-brand-id'] as string | undefined) ?? bodyBrandId ?? '';
}

function handleError(res: Response, err: unknown): void {
  if (isAiGatewayError(err)) {
    res.status(err.status).json(err.toJSON());
    return;
  }
  if (err instanceof z.ZodError) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: err.issues.map((e: { message: string }) => e.message).join('; '),
    });
    return;
  }
  if (err instanceof Error && err.message === 'SUPABASE_NOT_CONFIGURED') {
    res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Supabase service role is not configured.' });
    return;
  }
  if (err instanceof Error && err.message === 'ORG_ACCESS_DENIED') {
    res.status(403).json({ code: 'FORBIDDEN', message: 'You are not a member of this organization.' });
    return;
  }
  res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Unexpected server error.' });
}

async function runOp(
  req: AuthenticatedRequest,
  res: Response,
  operation: AiOperation,
  body: Record<string, unknown>,
  extras?: Partial<Parameters<typeof runAiGatewayOperation>[0]>
): Promise<void> {
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
    const result = await runAiGatewayOperation({
      operation,
      ctx: {
        organizationId: body.organizationId as string,
        brandId: getBrandId(req, body.brandId as string),
        userId,
      },
      input: body,
      relatedPostId: body.postId as string | undefined,
      relatedAssetId: body.assetId as string | undefined,
      ...extras,
    });

    res.status(200).json({
      aiJobId: result.aiJobId,
      operation: result.operation,
      status: result.status,
      result: result.result,
      needsHumanReview: result.needsHumanReview,
      warnings: result.warnings,
      model: result.model,
      promptVersion: result.promptVersion,
      estimatedCostCents: result.estimatedCostCents,
      totalTokens: result.totalTokens,
      relatedPostId: result.relatedPostId,
    });
  } catch (err) {
    handleError(res, err);
  }
}

export function initAiGatewayRoutes(): void {
  logAiGatewayStartupStatus();
}

export async function analyzeMediaHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const body = analyzeMediaSchema.parse(req.body);
  await runOp(req, res, 'media_analysis', body, { relatedAssetId: body.assetId });
}

export async function runAiCapabilityHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const body = genericRunSchema.parse(req.body);
  await runOp(
    req,
    res,
    body.operation,
    {
      organizationId: body.organizationId,
      brandId: body.brandId,
      ...body.input,
    },
    {
      relatedPostId: body.relatedPostId,
      relatedAssetId: body.relatedAssetId,
      persistDraft: body.persistDraft ?? body.operation === 'post_draft_generation',
      persistVariants: body.persistVariants ?? body.operation === 'platform_variant_generation',
    }
  );
}

export async function generatePostDraftHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const body = generatePostDraftSchema.parse(req.body);
  await runOp(req, res, 'post_draft_generation', body, { persistDraft: body.persistDraft ?? true });
}

export async function generatePlatformVariantsHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const body = generateVariantsSchema.parse(req.body);
  await runOp(req, res, 'platform_variant_generation', body, {
    relatedPostId: body.postId,
    persistVariants: body.persistVariants ?? true,
  });
}

export async function recommendScheduleHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const body = recommendScheduleSchema.parse(req.body);
  await runOp(req, res, 'schedule_recommendation', body, { relatedPostId: body.postId });
}

export async function scoreContentHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const body = scoreContentSchema.parse(req.body);
  await runOp(req, res, 'content_score', body, { relatedPostId: body.postId });
}

export async function moderateContentHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const body = moderateContentSchema.parse(req.body);
  await runOp(req, res, 'moderation_check', body, { relatedPostId: body.postId });
}

export async function getAiJobHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!isSupabaseServiceConfigured()) {
    res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Supabase service role is not configured.' });
    return;
  }
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return;
  }
  const { getSupabaseClient } = await import('../supabase.js');
  const client = getSupabaseClient();
  if (!client) {
    res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Supabase service role is not configured.' });
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
  const { verifyOrgMembership } = await import('../services/ai-jobs-db.js');
  try {
    await verifyOrgMembership(userId, data.organization_id as string);
  } catch {
    res.status(403).json({ code: 'FORBIDDEN', message: 'You cannot access this AI job.' });
    return;
  }
  res.json({ job: data });
}
