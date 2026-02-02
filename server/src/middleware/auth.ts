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
  // #region agent log
  console.log('🔒 Middleware: Received Token:', req.headers.authorization ? 'Yes' : 'No');
  // #endregion

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const supabase = getSupabaseClient();
  if (!supabase) {
    // No Supabase configured: allow through with dev user (local development)
    req.user = { id: 'dev-user', email: 'dev@localhost' };
    next();
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
