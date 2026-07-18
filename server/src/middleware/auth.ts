/**
 * Auth middleware: verify Authorization Bearer token using Supabase.
 * Protects API routes that require authentication.
 */

import type { Request, Response, NextFunction } from 'express';
import { checkUserAccess, isDevelopmentIdentityEnabled } from '../config.js';
import { getSupabaseClient } from '../supabase.js';

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email?: string };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const supabase = getSupabaseClient();
  if (!supabase) {
    if (isDevelopmentIdentityEnabled()) {
      req.user = { id: '00000000-0000-0000-0000-000000000001', email: 'dev@localhost' };
      next();
      return;
    }
    res.status(503).json({
      code: 'SUPABASE_NOT_CONFIGURED',
      message: 'Authentication service is unavailable.',
    });
    return;
  }

  if (!token) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Missing Authorization header' });
    return;
  }

  supabase.auth
    .getUser(token)
    .then(({ data: { user }, error }) => {
      if (error || !user) {
        res.status(401).json({
          code: 'UNAUTHENTICATED',
          message: error?.message || 'Invalid or expired token',
        });
        return;
      }
      const access = checkUserAccess(user.id);
      if (!access.configured) {
        res.status(503).json({
          code: 'OWNER_ACCESS_NOT_CONFIGURED',
          message: 'Owner access is not configured on this server.',
        });
        return;
      }
      if (!access.allowed) {
        res.status(403).json({
          code: 'ACCESS_NOT_ALLOWED',
          message: 'Steward is currently a private owner-only build.',
        });
        return;
      }
      req.user = { id: user.id, email: user.email ?? undefined };
      next();
    })
    .catch((err) => {
      console.error('Auth middleware error:', err);
      res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Token verification failed' });
    });
}
