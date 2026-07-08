/**
 * Dashboard summary aggregation for Command Center.
 */

import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { getSupabaseClient } from '../supabase.js';
import { isSupabaseServiceConfigured } from './steward-db.js';

export interface DashboardSummary {
  brandName: string | null;
  brandId: string | null;
  organizationId: string | null;
  connectedAccounts: number;
  scheduledThisWeek: number;
  draftsReady: number;
  needsReview: number;
  aiJobsRunning: number;
  publishFailures: number;
  recentAssets: { id: string; fileName?: string; mimeType?: string; createdAt?: string }[];
  todaysQueue: { id: string; title?: string; platform?: string; scheduledTime?: string; status?: string }[];
  brandCompleteness: number;
  missingBrandContext: string[];
  suggestions: { id: string; title: string; description: string; action: string }[];
  analyticsAvailable: boolean;
  supabaseConfigured: boolean;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function getDashboardSummaryHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return;
  }

  const organizationId = (req.query.organizationId as string) || (req.headers['x-organization-id'] as string);
  const brandId = (req.query.brandId as string) || (req.headers['x-brand-id'] as string);

  const empty: DashboardSummary = {
    brandName: null,
    brandId: brandId ?? null,
    organizationId: organizationId ?? null,
    connectedAccounts: 0,
    scheduledThisWeek: 0,
    draftsReady: 0,
    needsReview: 0,
    aiJobsRunning: 0,
    publishFailures: 0,
    recentAssets: [],
    todaysQueue: [],
    brandCompleteness: 0,
    missingBrandContext: ['organization', 'brand_profile'],
    suggestions: [
      {
        id: 'connect-accounts',
        title: 'Connect social accounts',
        description: 'Link platforms so Steward can publish and sync analytics.',
        action: 'accounts',
      },
      {
        id: 'upload-media',
        title: 'Upload your first media',
        description: 'Add photos or videos to your content library.',
        action: 'assets',
      },
    ],
    analyticsAvailable: false,
    supabaseConfigured: isSupabaseServiceConfigured(),
  };

  if (!isSupabaseServiceConfigured() || !organizationId || !brandId || !isUuid(organizationId) || !isUuid(brandId)) {
    res.json({ summary: empty, mode: 'setup_required' });
    return;
  }

  const client = getSupabaseClient();
  if (!client) {
    res.json({ summary: empty, mode: 'setup_required' });
    return;
  }

  try {
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      brandRes,
      accountsRes,
      postsRes,
      assetsRes,
      jobsRes,
      publishRes,
      profileRes,
      pillarsRes,
      rulesRes,
    ] = await Promise.all([
      client.from('brands').select('id, name, business_name').eq('id', brandId).maybeSingle(),
      client.from('social_accounts').select('id', { count: 'exact', head: true }).eq('brand_id', brandId),
      client.from('posts').select('id, title, content, platform, status, scheduled_time, published_time').eq('brand_id', brandId),
      client.from('assets').select('id, file_name, mime_type, created_at').eq('brand_id', brandId).order('created_at', { ascending: false }).limit(6),
      client.from('ai_jobs').select('id', { count: 'exact', head: true }).eq('brand_id', brandId).eq('status', 'running'),
      client.from('publish_jobs').select('id', { count: 'exact', head: true }).eq('brand_id', brandId).eq('status', 'failed'),
      client.from('brand_profiles').select('business_name, brand_voice_summary, city').eq('brand_id', brandId).maybeSingle(),
      client.from('content_pillars').select('id', { count: 'exact', head: true }).eq('brand_id', brandId).eq('is_active', true),
      client.from('brand_rules').select('id', { count: 'exact', head: true }).eq('brand_id', brandId).eq('active', true),
    ]);

    const posts = postsRes.data ?? [];
    const draftsReady = posts.filter((p) => p.status === 'draft').length;
    const needsReview = posts.filter((p) =>
      ['pending', 'pending_approval', 'needs_review'].includes(String(p.status))
    ).length;
    const scheduledThisWeek = posts.filter((p) => {
      if (!p.scheduled_time) return false;
      const t = new Date(p.scheduled_time as string);
      return t >= new Date() && t <= weekEnd;
    }).length;
    const todaysQueue = posts
      .filter((p) => {
        if (!p.scheduled_time) return false;
        const t = new Date(p.scheduled_time as string);
        return t >= todayStart && t <= todayEnd;
      })
      .slice(0, 8)
      .map((p) => ({
        id: p.id as string,
        title: (p.title as string) || (p.content as string)?.slice(0, 60),
        platform: p.platform as string,
        scheduledTime: p.scheduled_time as string,
        status: p.status as string,
      }));

    const missing: string[] = [];
    if (!profileRes.data?.business_name && !brandRes.data?.business_name) missing.push('business_name');
    if (!profileRes.data?.brand_voice_summary) missing.push('brand_voice');
    if ((pillarsRes.count ?? 0) === 0) missing.push('content_pillars');
    if ((rulesRes.count ?? 0) === 0) missing.push('brand_rules');
    if ((accountsRes.count ?? 0) === 0) missing.push('connected_accounts');

    const filled = 5 - missing.length;
    const brandCompleteness = Math.max(0, Math.min(100, Math.round((filled / 5) * 100)));

    const suggestions: DashboardSummary['suggestions'] = [];
    if ((assetsRes.data?.length ?? 0) >= 2) {
      suggestions.push({
        id: 'generate-drafts',
        title: 'Generate post drafts from recent uploads',
        description: `You have ${assetsRes.data?.length} recent assets. Steward can draft captions.`,
        action: 'studio',
      });
    }
    if (needsReview > 0) {
      suggestions.push({
        id: 'review-queue',
        title: `${needsReview} item${needsReview > 1 ? 's' : ''} need review`,
        description: 'Open the approval queue before scheduling.',
        action: 'approvals',
      });
    }
    if (missing.includes('connected_accounts')) {
      suggestions.push({
        id: 'connect',
        title: 'Connect a social account',
        description: 'Publishing requires at least one connected platform.',
        action: 'accounts',
      });
    }

    const summary: DashboardSummary = {
      brandName: (brandRes.data?.name as string) || (profileRes.data?.business_name as string) || null,
      brandId,
      organizationId,
      connectedAccounts: accountsRes.count ?? 0,
      scheduledThisWeek,
      draftsReady,
      needsReview,
      aiJobsRunning: jobsRes.count ?? 0,
      publishFailures: publishRes.count ?? 0,
      recentAssets: (assetsRes.data ?? []).map((a) => ({
        id: a.id as string,
        fileName: a.file_name as string,
        mimeType: a.mime_type as string,
        createdAt: a.created_at as string,
      })),
      todaysQueue,
      brandCompleteness,
      missingBrandContext: missing,
      suggestions,
      analyticsAvailable: (accountsRes.count ?? 0) > 0 && posts.some((p) => p.status === 'published'),
      supabaseConfigured: true,
    };

    res.json({ summary, mode: 'live' });
  } catch (err) {
    res.status(500).json({ code: 'DASHBOARD_ERROR', message: String(err) });
  }
}
