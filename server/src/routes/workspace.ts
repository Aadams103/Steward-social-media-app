/**
 * GET/PUT /api/workspace — resolve authenticated user's org/brand context.
 */

import type { Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { resolveWorkspace } from '../services/workspace.js';

const selectSchema = z.object({
  organizationId: z.string().uuid(),
  brandId: z.string().uuid().optional(),
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
