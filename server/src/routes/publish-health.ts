/**
 * GET /api/publish-jobs/health — Command Center publish health panel.
 */

import type { Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { getSupabaseClient } from '../supabase.js';
import { assertWorkspaceAccess } from '../services/workspace.js';
import { isSupabaseServiceConfigured } from '../services/steward-db.js';

const querySchema = z.object({
  organizationId: z.string().uuid(),
  brandId: z.string().uuid().optional(),
  platform: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export async function getPublishHealthHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
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
    const query = querySchema.parse(req.query);
    await assertWorkspaceAccess(userId, query.organizationId, query.brandId);

    const client = getSupabaseClient();
    if (!client) {
      res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Supabase not configured' });
      return;
    }

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const baseFilter = (status: string) => {
      let q = client.from('publish_jobs').select('id', { count: 'exact', head: true }).eq('organization_id', query.organizationId).eq('status', status);
      if (query.brandId) q = q.eq('brand_id', query.brandId);
      if (query.platform) q = q.eq('platform', query.platform);
      return q;
    };

    const [queued, publishing, succeeded, failed, retrying, canceled, accountsRes, nextScheduled, recentFailures] =
      await Promise.all([
        baseFilter('queued'),
        baseFilter('processing'),
        (() => {
          let q = client
            .from('publish_jobs')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', query.organizationId)
            .eq('status', 'succeeded')
            .gte('completed_at', since24h);
          if (query.brandId) q = q.eq('brand_id', query.brandId);
          return q;
        })(),
        (() => {
          let q = client
            .from('publish_jobs')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', query.organizationId)
            .eq('status', 'failed')
            .gte('updated_at', since24h);
          if (query.brandId) q = q.eq('brand_id', query.brandId);
          return q;
        })(),
        baseFilter('retrying'),
        baseFilter('canceled'),
        (() => {
          let q = client
            .from('social_accounts')
            .select('id, platform, status, brand_id')
            .eq('organization_id', query.organizationId);
          if (query.brandId) q = q.eq('brand_id', query.brandId);
          return q;
        })(),
        (() => {
          let q = client
            .from('publish_jobs')
            .select('id, platform, scheduled_at, status')
            .eq('organization_id', query.organizationId)
            .in('status', ['queued', 'scheduled'])
            .order('scheduled_at', { ascending: true })
            .limit(1);
          if (query.brandId) q = q.eq('brand_id', query.brandId);
          return q;
        })(),
        (() => {
          let q = client
            .from('publish_jobs')
            .select('id, platform, status, error_message, updated_at, brand_id')
            .eq('organization_id', query.organizationId)
            .eq('status', 'failed')
            .order('updated_at', { ascending: false })
            .limit(5);
          if (query.brandId) q = q.eq('brand_id', query.brandId);
          return q;
        })(),
      ]);

    const accounts = accountsRes.data ?? [];
    const disconnectedBlockers = accounts
      .filter((a) => a.status !== 'connected' && a.status !== 'active')
      .map((a) => ({ platform: a.platform, brandId: a.brand_id, status: a.status }));

    const hasConnected = accounts.some((a) => a.status === 'connected' || a.status === 'active');

    res.json({
      health: {
        queued_count: queued.count ?? 0,
        publishing_count: publishing.count ?? 0,
        succeeded_24h: succeeded.count ?? 0,
        failed_24h: failed.count ?? 0,
        retrying_count: retrying.count ?? 0,
        canceled_count: canceled.count ?? 0,
        next_scheduled_publish: nextScheduled.data?.[0] ?? null,
        recent_failures: (recentFailures.data ?? []).map((j) => ({
          id: j.id,
          platform: j.platform,
          error_message: j.error_message ? String(j.error_message).slice(0, 200) : null,
          updated_at: j.updated_at,
        })),
        disconnected_account_blockers: disconnectedBlockers,
        stale_locked_jobs: [],
        setup_required: !hasConnected,
        message: hasConnected
          ? null
          : 'Connect at least one social account before publishing.',
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ code: 'VALIDATION_ERROR', message: err.message });
      return;
    }
    if (err instanceof Error && (err as Error & { code?: string }).code === 'ORG_ACCESS_DENIED') {
      res.status(403).json({ code: 'FORBIDDEN', message: err.message });
      return;
    }
    res.status(500).json({ code: 'PUBLISH_HEALTH_ERROR', message: String(err) });
  }
}
