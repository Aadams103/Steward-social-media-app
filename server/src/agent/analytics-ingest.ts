/**
 * Agent analytics ingestion — computes content_insights from real data only.
 *
 * Sources: ingested_posts (platform API payloads) and post_metrics_snapshots.
 * If no data exists, no insights are written — the agent never fabricates
 * analytics. Every insight records its sample_size honestly.
 */

import { getSupabaseClient } from '../supabase.js';

interface IngestedMetrics {
  likeCount: number;
  commentCount: number;
  timestamp: string | null;
  caption: string | null;
  mediaType: string | null;
}

function extractMetrics(payload: Record<string, unknown>): IngestedMetrics {
  return {
    likeCount: Number(payload.like_count ?? payload.likes ?? 0) || 0,
    commentCount: Number(payload.comments_count ?? payload.comments ?? 0) || 0,
    timestamp: (payload.timestamp as string) ?? (payload.created_time as string) ?? null,
    caption: (payload.caption as string) ?? null,
    mediaType: (payload.media_type as string) ?? null,
  };
}

async function upsertInsight(input: {
  organizationId: string;
  brandId: string;
  insightType: string;
  insightKey: string;
  insightValue: Record<string, unknown>;
  sampleSize: number;
  recommendedActions?: string[];
}): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  // Race-free upsert backed by the content_insights_brand_type_key_idx unique index.
  const { error } = await client.from('content_insights').upsert(
    {
      organization_id: input.organizationId,
      brand_id: input.brandId,
      insight_type: input.insightType,
      insight_key: input.insightKey,
      insight_value: input.insightValue,
      sample_size: input.sampleSize,
      recommended_actions: input.recommendedActions ?? [],
      period_start: null,
      period_end: new Date().toISOString(),
    },
    { onConflict: 'brand_id,insight_type,insight_key' }
  );
  if (error) {
    console.error('[agent] Failed to upsert insight:', error.message);
  }
}

export interface AnalyticsIngestResult {
  ingestedPostCount: number;
  insightsWritten: number;
  skippedReason?: string;
}

/**
 * Aggregate ingested platform posts into content_insights.
 * Returns honest counts; writes nothing when there is no source data.
 */
export async function ingestBrandAnalytics(
  organizationId: string,
  brandId: string
): Promise<AnalyticsIngestResult> {
  const client = getSupabaseClient();
  if (!client) return { ingestedPostCount: 0, insightsWritten: 0, skippedReason: 'supabase_not_configured' };

  const { data: ingested, error } = await client
    .from('ingested_posts')
    .select('platform, payload, fetched_at')
    .eq('brand_id', brandId)
    .order('fetched_at', { ascending: false })
    .limit(200);

  if (error) {
    return { ingestedPostCount: 0, insightsWritten: 0, skippedReason: `query_error: ${error.message}` };
  }

  const rows = ingested ?? [];
  if (rows.length === 0) {
    return { ingestedPostCount: 0, insightsWritten: 0, skippedReason: 'no_ingested_posts' };
  }

  let insightsWritten = 0;

  // --- Per-platform engagement aggregate ---
  const byPlatform = new Map<string, IngestedMetrics[]>();
  for (const row of rows) {
    const metrics = extractMetrics((row.payload as Record<string, unknown>) ?? {});
    const list = byPlatform.get(row.platform as string) ?? [];
    list.push(metrics);
    byPlatform.set(row.platform as string, list);
  }

  for (const [platform, metrics] of byPlatform.entries()) {
    const totalEngagement = metrics.reduce((sum, m) => sum + m.likeCount + m.commentCount, 0);
    const avgEngagement = metrics.length ? totalEngagement / metrics.length : 0;
    await upsertInsight({
      organizationId,
      brandId,
      insightType: 'platform_engagement',
      insightKey: platform,
      insightValue: {
        avg_engagement: Math.round(avgEngagement * 100) / 100,
        total_engagement: totalEngagement,
        post_count: metrics.length,
      },
      sampleSize: metrics.length,
    });
    insightsWritten += 1;
  }

  // --- Best posting hour (only with enough samples to be meaningful) ---
  const hourBuckets = new Map<number, { count: number; engagement: number }>();
  for (const metricsList of byPlatform.values()) {
    for (const m of metricsList) {
      if (!m.timestamp) continue;
      const hour = new Date(m.timestamp).getUTCHours();
      const bucket = hourBuckets.get(hour) ?? { count: 0, engagement: 0 };
      bucket.count += 1;
      bucket.engagement += m.likeCount + m.commentCount;
      hourBuckets.set(hour, bucket);
    }
  }

  const MIN_SAMPLES_FOR_TIMING = 5;
  const timedSamples = Array.from(hourBuckets.values()).reduce((s, b) => s + b.count, 0);
  if (timedSamples >= MIN_SAMPLES_FOR_TIMING) {
    const ranked = Array.from(hourBuckets.entries())
      .map(([hour, b]) => ({ hour, avg: b.engagement / b.count, count: b.count }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 3);
    await upsertInsight({
      organizationId,
      brandId,
      insightType: 'best_posting_hours_utc',
      insightKey: 'top_hours',
      insightValue: { top_hours: ranked },
      sampleSize: timedSamples,
      recommendedActions: ['Use these windows when scheduling; confirm against platform strategy.'],
    });
    insightsWritten += 1;
  }

  // --- Top posts by engagement ---
  const allWithEngagement = rows
    .map((row) => {
      const m = extractMetrics((row.payload as Record<string, unknown>) ?? {});
      return {
        platform: row.platform as string,
        engagement: m.likeCount + m.commentCount,
        caption_preview: m.caption ? m.caption.slice(0, 120) : null,
        media_type: m.mediaType,
      };
    })
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 5);

  if (allWithEngagement.length > 0) {
    await upsertInsight({
      organizationId,
      brandId,
      insightType: 'top_posts',
      insightKey: 'by_engagement',
      insightValue: { posts: allWithEngagement },
      sampleSize: rows.length,
    });
    insightsWritten += 1;
  }

  return { ingestedPostCount: rows.length, insightsWritten };
}
