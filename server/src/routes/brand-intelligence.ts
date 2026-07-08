/**
 * Brand Intelligence API routes.
 */

import type { Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { getStewardBrandContext } from '../services/brand-intelligence.js';
import { isSupabaseServiceConfigured } from '../services/steward-db.js';
import { AiGatewayError } from '../ai/errors.js';

const contextQuerySchema = z.object({
  organizationId: z.string().uuid(),
  brandId: z.string().uuid(),
  operation: z.string().default('brand_context_preview'),
  platform: z.string().optional(),
});

export async function getBrandContextHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!isSupabaseServiceConfigured()) {
    res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Supabase not configured' });
    return;
  }
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return;
  }

  try {
    const body = contextQuerySchema.parse({
      organizationId: req.query.organizationId ?? req.body?.organizationId,
      brandId: req.query.brandId ?? req.body?.brandId ?? req.headers['x-brand-id'],
      operation: req.query.operation ?? req.body?.operation ?? 'brand_context_preview',
      platform: req.query.platform ?? req.body?.platform,
    });

    const context = await getStewardBrandContext({
      organizationId: body.organizationId,
      brandId: body.brandId,
      userId,
      operation: body.operation,
      platform: body.platform,
    });

    res.json({
      context: {
        meta: context.meta,
        missingContext: context.missingContext,
        brandProfile: context.brandProfile,
        userPreferences: context.userPreferences,
        contentPillars: context.contentPillars,
        audienceSegments: context.audienceSegments,
        hashtags: context.hashtags,
        ctas: context.ctas,
        schedules: context.schedules,
        brandRules: context.brandRules,
        platformStrategy: context.platformStrategy,
        approvedMemoryFacts: context.approvedMemoryFacts,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ code: 'VALIDATION_ERROR', message: err.message });
      return;
    }
    if (err instanceof AiGatewayError) {
      res.status(err.status).json(err.toJSON());
      return;
    }
    if (err instanceof Error && err.message === 'ORG_ACCESS_DENIED') {
      res.status(403).json({ code: 'FORBIDDEN', message: 'Organization access denied' });
      return;
    }
    res.status(500).json({ code: 'BRAND_CONTEXT_ERROR', message: 'Failed to load brand context' });
  }
}

const feedbackSchema = z.object({
  organizationId: z.string().uuid(),
  brandId: z.string().uuid(),
  postId: z.string().uuid().optional(),
  aiJobId: z.string().uuid().optional(),
  feedbackType: z.enum([
    'liked', 'disliked', 'too_generic', 'wrong_tone', 'wrong_fact', 'too_long',
    'too_short', 'good_hook', 'bad_hook', 'wrong_audience', 'unsafe', 'off_brand',
  ]),
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(2000).optional(),
  selectedReason: z.string().max(500).optional(),
});

export async function submitContentFeedbackHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!isSupabaseServiceConfigured()) {
    res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Supabase not configured' });
    return;
  }
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return;
  }

  try {
    const body = feedbackSchema.parse(req.body);
    const { getSupabaseClient } = await import('../supabase.js');
    const client = getSupabaseClient();
    if (!client) throw new Error('SUPABASE_NOT_CONFIGURED');

    await getStewardBrandContext({
      organizationId: body.organizationId,
      brandId: body.brandId,
      userId,
      operation: 'content_feedback',
    });

    const { data, error } = await client
      .from('content_feedback')
      .insert({
        organization_id: body.organizationId,
        brand_id: body.brandId,
        user_id: userId,
        post_id: body.postId ?? null,
        ai_job_id: body.aiJobId ?? null,
        feedback_type: body.feedbackType,
        rating: body.rating ?? null,
        comment: body.comment ?? null,
        selected_reason: body.selectedReason ?? null,
      })
      .select('id')
      .single();
    if (error) throw error;

    res.status(201).json({ id: data.id, ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ code: 'VALIDATION_ERROR', message: err.message });
      return;
    }
    res.status(500).json({ code: 'FEEDBACK_ERROR', message: 'Failed to save feedback' });
  }
}
