/**
 * GET/PUT /api/workspace — resolve authenticated user's org/brand context.
 */

import type { Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { getSupabaseClient } from '../supabase.js';
import { resolveWorkspace } from '../services/workspace.js';

const selectSchema = z.object({
  organizationId: z.string().uuid(),
  brandId: z.string().uuid().optional(),
});

export const workspaceBootstrapSchema = z.object({
  organizationName: z.string().trim().min(2).max(100),
  brandName: z.string().trim().min(2).max(100),
  timezone: z.string().trim().min(1).max(100).refine((timezone) => {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
      return true;
    } catch {
      return false;
    }
  }, 'Invalid IANA timezone'),
});

function handleWorkspaceError(res: Response, err: unknown): void {
  if (err instanceof z.ZodError) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: err.message });
    return;
  }
  if (err instanceof Error) {
    const code = (err as Error & { code?: string }).code;
    if (code === 'ORG_ACCESS_DENIED' || code === 'BRAND_ACCESS_DENIED') {
      res.status(403).json({ code: 'FORBIDDEN', message: err.message });
      return;
    }
    if (code === 'INVALID_ORG' || code === 'INVALID_BRAND') {
      res.status(400).json({ code, message: err.message });
      return;
    }
  }
  res.status(500).json({ code: 'WORKSPACE_ERROR', message: 'Failed to resolve workspace' });
}

export async function getWorkspaceHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return;
  }

  try {
    const organizationId =
      (req.query.organizationId as string) || (req.headers['x-organization-id'] as string) || undefined;
    const brandId = (req.query.brandId as string) || (req.headers['x-brand-id'] as string) || undefined;

    const workspace = await resolveWorkspace(
      { id: userId, email: req.user?.email },
      { organizationId, brandId: brandId === 'all' ? undefined : brandId }
    );

    res.json({ workspace });
  } catch (err) {
    handleWorkspaceError(res, err);
  }
}

export async function putWorkspaceHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return;
  }

  try {
    const body = selectSchema.parse(req.body);
    const workspace = await resolveWorkspace(
      { id: userId, email: req.user?.email },
      { organizationId: body.organizationId, brandId: body.brandId }
    );
    res.json({ workspace });
  } catch (err) {
    handleWorkspaceError(res, err);
  }
}

export async function bootstrapWorkspaceHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return;
  }

  const client = getSupabaseClient();
  if (!client) {
    res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Workspace storage is unavailable' });
    return;
  }

  try {
    const body = workspaceBootstrapSchema.parse(req.body);
    const { data, error } = await client.rpc('bootstrap_steward_workspace', {
      p_user_id: userId,
      p_organization_name: body.organizationName,
      p_brand_name: body.brandName,
      p_timezone: body.timezone,
    });
    if (error) throw error;

    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.organization_id || !result?.brand_id) throw new Error('WORKSPACE_BOOTSTRAP_EMPTY');

    const workspace = await resolveWorkspace(
      { id: userId, email: req.user?.email },
      { organizationId: result.organization_id as string, brandId: result.brand_id as string }
    );

    res.status(result.created ? 201 : 200).json({ workspace, created: Boolean(result.created) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Check the workspace details and try again.',
        details: err.flatten(),
      });
      return;
    }
    console.error('Workspace bootstrap failed', err instanceof Error ? err.message : 'unknown error');
    res.status(500).json({ code: 'WORKSPACE_BOOTSTRAP_ERROR', message: 'Failed to create the workspace' });
  }
}
