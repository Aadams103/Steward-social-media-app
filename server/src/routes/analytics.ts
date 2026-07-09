/**
 * GET /api/analytics/summary — honest analytics from real tables only.
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
  campaignId: z.string().uuid().optional(),
  contentPillarId: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export async function getAnalyticsSummaryHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!isSupabaseServiceConfigured()) {
    res.json({
      has_data: false,
      missing_sources: ['supabase'],
      setup_required: ['connect_supabase'],
      message: 'Analytics will appear after posts are published and synced.',
    });
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
      res.json({
        has_data: false,
        missing_sources: ['supabase'],
        setup_required: ['connect_supabase'],
        message: 'Analytics will appear after posts are published and synced.',
      });
      return;
    }

    const missingSources: string[] = [];
    const setupRequired: string[] = [];

    let insightsQuery = client
      .from('content_insights')
      .select('id, insight_type, insight_key, insight_value, sample_size, period_start, period_end')
      .eq('organization_id', query.organizationId)
      .limit(20);
    if (query.brandId) {
      insightsQuery = insightsQuery.eq('brand_id', query.brandId);
    }

    const metricsQuery = client
      .from('post_metrics_snapshots')
      .select('id, impressions, reach, engagement, collected_at')
      .eq('organization_id', query.organizationId)
      .order('collected_at', { ascending: false })
      .limit(20);
    if (query.brandId) {
      // post_metrics may not have brand_id directly — filter via publications if needed
    }

    const platformMetricsQuery = client
      .from('platform_account_metrics')
      .select('id, platform, followers, engagement_rate, collected_at')
      .eq('organization_id', query.organizationId)
      .order('collected_at', { ascending: false })
      .limit(10);

    const publicationsQuery = client
      .from('social_post_publications')
      .select('id, platform, published_at, status')
      .eq('organization_id', query.organizationId)
      .limit(10);

    const publishedPostsQuery = client
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', query.organizationId)
      .eq('status', 'published');
    if (query.brandId) publishedPostsQuery.eq('brand_id', query.brandId);

    const [insights, metrics, platformMetrics, publications, publishedCount, accountsRes] = await Promise.all([
      insightsQuery,
      metricsQuery,
      platformMetricsQuery,
      publicationsQuery,
      publishedPostsQuery,
      (() => {
        let q = client.from('social_accounts').select('id', { count: 'exact', head: true }).eq('organization_id', query.organizationId);
        if (query.brandId) q = q.eq('brand_id', query.brandId);
        return q;
      })(),
    ]);

    const insightRows = insights.data ?? [];
    const metricRows = metrics.data ?? [];
    const platformRows = platformMetrics.data ?? [];
    const publicationRows = publications.data ?? [];
    const connectedAccounts = accountsRes.count ?? 0;
    const publishedPosts = publishedCount.count ?? 0;

    if (insightRows.length === 0) missingSources.push('content_insights');
    if (metricRows.length === 0) missingSources.push('post_metrics_snapshots');
    if (platformRows.length === 0) missingSources.push('platform_account_metrics');
    if (publicationRows.length === 0) missingSources.push('social_post_publications');
    if (connectedAccounts === 0) setupRequired.push('connected_accounts');
    if (publishedPosts === 0) setupRequired.push('published_posts');

    const hasData =
      insightRows.length > 0 ||
      metricRows.length > 0 ||
      platformRows.length > 0 ||
      publicationRows.length > 0;

    if (!hasData) {
      res.json({
        has_data: false,
        missing_sources: missingSources,
        setup_required: setupRequired,
        message: 'Analytics will appear after posts are published and synced.',
        partial: {
          connected_accounts: connectedAccounts,
          published_posts: publishedPosts,
        },
      });
      return;
    }

    res.json({
      has_data: true,
      missing_sources: missingSources.filter(Boolean),
      setup_required: setupRequired,
      summary: {
        content_insights: insightRows,
        post_metrics: metricRows,
        platform_metrics: platformRows,
        publications: publicationRows,
        connected_accounts: connectedAccounts,
        published_posts: publishedPosts,
      },
      message: missingSources.length > 0 ? 'Partial analytics data available.' : null,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ code: 'VALIDATION_ERROR', message: err.message });
      return;
    }
    res.status(500).json({ code: 'ANALYTICS_ERROR', message: String(err) });
  }
}
