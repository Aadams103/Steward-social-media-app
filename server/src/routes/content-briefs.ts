import type { Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { assertPermission } from '../services/permissions.js';
import { assertWorkspaceAccess, logAuditEvent } from '../services/workspace.js';
import { getSupabaseClient } from '../supabase.js';

const briefSchema = z.object({
  organizationId: z.string().uuid(),
  brandId: z.string().uuid(),
  goal: z.string().trim().max(500).optional(),
  targetAudience: z.string().trim().max(500).optional(),
  contentPillar: z.string().trim().max(300).optional(),
  contentFormat: z.enum(['post', 'carousel', 'story', 'reel', 'video']).default('post'),
  platforms: z.array(z.enum(['facebook', 'instagram'])).min(1).max(2),
  assetIds: z.array(z.string().uuid()).max(10).default([]),
  notes: z.string().trim().max(10_000).optional(),
});

const completeSchema = z.object({
  organizationId: z.string().uuid(),
  aiJobId: z.string().uuid(),
});

function handleError(res: Response, error: unknown): void {
  if (error instanceof z.ZodError) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Check the content brief and try again.' });
    return;
  }
  if (error instanceof Error && (error as Error & { code?: string }).code === 'FORBIDDEN') {
    res.status(403).json({ code: 'FORBIDDEN', message: error.message });
    return;
  }
  res.status(500).json({ code: 'CONTENT_BRIEF_ERROR', message: 'The content brief could not be saved.' });
}

export async function createContentBriefHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  const client = getSupabaseClient();
  if (!userId) return void res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
  if (!client) return void res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Content storage is unavailable' });

  try {
    const body = briefSchema.parse(req.body);
    const role = await assertWorkspaceAccess(userId, body.organizationId, body.brandId);
    assertPermission(role, 'canEditPosts');
    const { data, error } = await client
      .from('content_briefs')
      .insert({
        organization_id: body.organizationId,
        brand_id: body.brandId,
        created_by: userId,
        goal: body.goal ?? null,
        target_audience: body.targetAudience ?? null,
        content_pillar: body.contentPillar ?? null,
        content_format: body.contentFormat,
        platforms: body.platforms,
        asset_ids: body.assetIds,
        notes: body.notes ?? null,
        status: 'active',
      })
      .select('*')
      .single();
    if (error) throw error;
    await logAuditEvent({
      organizationId: body.organizationId,
      brandId: body.brandId,
      actorUserId: userId,
      action: 'content_brief.create',
      entityType: 'content_brief',
      entityId: data.id as string,
    });
    res.status(201).json({ brief: data });
  } catch (error) {
    handleError(res, error);
  }
}

export async function completeContentBriefHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  const client = getSupabaseClient();
  if (!userId) return void res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
  if (!client) return void res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Content storage is unavailable' });

  try {
    const body = completeSchema.parse(req.body);
    const role = await assertWorkspaceAccess(userId, body.organizationId);
    assertPermission(role, 'canEditPosts');
    const { data, error } = await client
      .from('content_briefs')
      .update({ latest_ai_job_id: body.aiJobId, status: 'generated' })
      .eq('id', req.params.id)
      .eq('organization_id', body.organizationId)
      .select('*')
      .single();
    if (error) throw error;
    res.json({ brief: data });
  } catch (error) {
    handleError(res, error);
  }
}
