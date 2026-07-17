/**
 * Auth middleware: verify Authorization Bearer token using Supabase.
 * Protects API routes that require authentication.
 */

import type { Request, Response, NextFunction } from 'express';
import { getSupabaseClient } from '../supabase.js';

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email?: string };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const supabase = getSupabaseClient();
  if (!supabase) {
    const explicitDevelopmentMode =
      process.env.NODE_ENV !== 'production' && process.env.STEWARD_ENABLE_DEMO_DATA === 'true';
    if (explicitDevelopmentMode) {
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
      req.user = { id: user.id, email: user.email ?? undefined };
      next();
    })
    .catch((err) => {
      console.error('Auth middleware error:', err);
      res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Token verification failed' });
    });
}
