import cron, { type ScheduledTask } from 'node-cron';
import { getSupabaseClient } from '../supabase.js';

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION ?? 'v25.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

interface MetaAccount {
  id: string;
  organization_id: string;
  brand_id: string;
  platform: 'facebook' | 'instagram';
  provider_account_id: string;
}

interface ProviderPost {
  id: string;
  caption?: string;
  message?: string;
  media_type?: string;
  permalink?: string;
  permalink_url?: string;
  timestamp?: string;
  created_time?: string;
  like_count?: number;
  comments_count?: number;
  shares?: { count?: number };
  reactions?: { summary?: { total_count?: number } };
  comments?: { summary?: { total_count?: number } };
}

interface MetricSnapshot {
  publicationId: string;
  engagement: number;
}

let task: ScheduledTask | null = null;
let running = false;

class MetaAnalyticsError extends Error {
  constructor(readonly providerCode: number | undefined, message: string) {
    super(message);
    this.name = 'MetaAnalyticsError';
  }
}

async function metaGet<T>(path: string, token: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${GRAPH_BASE}/${path.replace(/^\//, '')}`);
  url.searchParams.set('access_token', token);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url);
  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: { code?: number; message?: string; error_user_msg?: string };
  };
  if (!response.ok || payload.error) {
    throw new MetaAnalyticsError(
      payload.error?.code,
      payload.error?.error_user_msg ?? payload.error?.message ?? 'Meta analytics request failed'
    );
  }
  return payload;
}

async function metaGetOptional<T>(
  path: string,
  token: string,
  params: Record<string, string> = {}
): Promise<T | null> {
  try {
    return await metaGet<T>(path, token, params);
  } catch (error) {
    if (error instanceof MetaAnalyticsError && error.providerCode === 190) throw error;
    return null;
  }
}

function insightValue(
  response: { data?: Array<{ name?: string; values?: Array<{ value?: number }> }> } | null,
  name: string
): number {
  const value = response?.data?.find((item) => item.name === name)?.values?.[0]?.value;
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

async function upsertPublicationAndMetrics(
  account: MetaAccount,
  post: ProviderPost,
  token: string
): Promise<MetricSnapshot> {
  const client = getSupabaseClient()!;
  const { data: publication, error: publicationError } = await client
    .from('social_post_publications')
    .upsert(
      {
        organization_id: account.organization_id,
        brand_id: account.brand_id,
        social_account_id: account.id,
        platform: account.platform,
        platform_post_id: post.id,
        platform_url: post.permalink ?? post.permalink_url ?? null,
        published_at: post.timestamp ?? post.created_time ?? new Date().toISOString(),
        metadata: { source: 'meta_analytics_ingest' },
      },
      { onConflict: 'social_account_id,platform,platform_post_id' }
    )
    .select('id')
    .single();
  if (publicationError) throw publicationError;

  await client.from('ingested_posts').upsert(
    {
      brand_id: account.brand_id,
      platform: account.platform,
      external_id: post.id,
      payload: post,
      fetched_at: new Date().toISOString(),
    },
    { onConflict: 'platform,external_id' }
  );

  let impressions = 0;
  let reach = 0;
  let shares = post.shares?.count ?? 0;
  let saves = 0;
  let videoViews = 0;
  if (account.platform === 'instagram') {
    const insights = await metaGetOptional<{ data?: Array<{ name?: string; values?: Array<{ value?: number }> }> }>(
      `${post.id}/insights`,
      token,
      { metric: 'reach,saved,shares,total_interactions,views' }
    );
    reach = insightValue(insights, 'reach');
    impressions = insightValue(insights, 'views');
    shares = insightValue(insights, 'shares');
    saves = insightValue(insights, 'saved');
    videoViews = post.media_type === 'VIDEO' || post.media_type === 'REELS' ? impressions : 0;
  } else {
    const insights = await metaGetOptional<{ data?: Array<{ name?: string; values?: Array<{ value?: number }> }> }>(
      `${post.id}/insights`,
      token,
      { metric: 'post_impressions,post_impressions_unique,post_engaged_users' }
    );
    impressions = insightValue(insights, 'post_impressions');
    reach = insightValue(insights, 'post_impressions_unique');
  }

  const likes = post.like_count ?? post.reactions?.summary?.total_count ?? 0;
  const comments = post.comments_count ?? post.comments?.summary?.total_count ?? 0;
  const engagement = likes + comments + shares + saves;
  const engagementRate = reach > 0 ? Number(((engagement / reach) * 100).toFixed(4)) : null;
  const { error: metricError } = await client.from('post_metrics_snapshots').insert({
    organization_id: account.organization_id,
    publication_id: publication.id,
    impressions,
    reach,
    likes,
    comments,
    shares,
    saves,
    video_views: videoViews,
    engagement_rate: engagementRate,
    metadata: { source: 'meta', graphApiVersion: GRAPH_VERSION, verified: true },
  });
  if (metricError) throw metricError;
  return { publicationId: publication.id as string, engagement };
}

async function syncAccount(account: MetaAccount): Promise<{ posts: number }> {
  const client = getSupabaseClient()!;
  const { data: tokenBundle, error: tokenError } = await client.rpc('read_social_token_bundle', {
    p_account_id: account.id,
  });
  if (tokenError || !tokenBundle?.accessToken) throw new Error('TOKEN_UNAVAILABLE');
  const token = String(tokenBundle.accessToken);

  const accountFields = account.platform === 'instagram'
    ? 'followers_count,follows_count,media_count'
    : 'followers_count,fan_count';
  const profile = await metaGet<Record<string, number>>(
    account.provider_account_id,
    token,
    { fields: accountFields }
  );
  const followers = Number(profile.followers_count ?? profile.fan_count ?? 0);
  const following = Number(profile.follows_count ?? 0);
  const postsCount = Number(profile.media_count ?? 0);
  const { data: previous } = await client
    .from('platform_account_metrics')
    .select('followers')
    .eq('social_account_id', account.id)
    .order('collected_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  await client.from('platform_account_metrics').insert({
    organization_id: account.organization_id,
    brand_id: account.brand_id,
    social_account_id: account.id,
    platform: account.platform,
    followers,
    following,
    posts_count: postsCount,
    metadata: { source: 'meta', graphApiVersion: GRAPH_VERSION, verified: true },
  });
  await client.from('audience_growth_snapshots').insert({
    organization_id: account.organization_id,
    brand_id: account.brand_id,
    social_account_id: account.id,
    followers,
    followers_gained: previous?.followers == null ? 0 : followers - Number(previous.followers),
    metadata: { source: 'meta', graphApiVersion: GRAPH_VERSION, verified: true },
  });

  const feedPath = account.platform === 'instagram'
    ? `${account.provider_account_id}/media`
    : `${account.provider_account_id}/published_posts`;
  const fields = account.platform === 'instagram'
    ? 'id,caption,media_type,permalink,timestamp,like_count,comments_count'
    : 'id,message,created_time,permalink_url,reactions.limit(0).summary(true),comments.limit(0).summary(true),shares';
  const feed = await metaGet<{ data?: ProviderPost[] }>(feedPath, token, { fields, limit: '25' });
  const snapshots: MetricSnapshot[] = [];
  for (const post of feed.data ?? []) {
    if (post.id) snapshots.push(await upsertPublicationAndMetrics(account, post, token));
  }

  if (snapshots.length >= 3) {
    const best = [...snapshots].sort((a, b) => b.engagement - a.engagement)[0]!;
    const average = snapshots.reduce((sum, item) => sum + item.engagement, 0) / snapshots.length;
    const confidence = Math.min(0.95, 0.55 + snapshots.length / 100);
    const { data: existing } = await client
      .from('content_insights')
      .select('id')
      .eq('brand_id', account.brand_id)
      .eq('insight_type', 'performance_pattern')
      .eq('insight_key', `${account.platform}_verified_engagement_baseline`)
      .maybeSingle();
    const insight = {
      organization_id: account.organization_id,
      brand_id: account.brand_id,
      insight_type: 'performance_pattern',
      insight_key: `${account.platform}_verified_engagement_baseline`,
      insight_value: {
        bestPublicationId: best.publicationId,
        bestEngagement: best.engagement,
        averageEngagement: Number(average.toFixed(2)),
      },
      confidence,
      sample_size: snapshots.length,
      period_end: new Date().toISOString(),
      recommended_actions: confidence >= 0.65
        ? [{ action: 'Review the strongest post for reusable creative patterns.', confidence }]
        : [],
      metadata: { source: 'verified_meta_metrics', qualified: confidence >= 0.65 },
    };
    if (existing?.id) await client.from('content_insights').update(insight).eq('id', existing.id);
    else await client.from('content_insights').insert(insight);
  }

  await client.from('social_accounts').update({
    last_sync: new Date().toISOString(),
    status: 'connected',
    connection_status: 'connected',
  }).eq('id', account.id);
  return { posts: snapshots.length };
}

export async function syncMetaAnalytics(): Promise<{
  accounts: number;
  succeeded: number;
  failed: number;
  posts: number;
}> {
  if (running) return { accounts: 0, succeeded: 0, failed: 0, posts: 0 };
  const client = getSupabaseClient();
  if (!client) throw new Error('SUPABASE_NOT_CONFIGURED');
  running = true;
  try {
    const { data, error } = await client
      .from('social_accounts')
      .select('id, organization_id, brand_id, platform, provider_account_id')
      .in('platform', ['facebook', 'instagram'])
      .eq('connection_status', 'connected')
      .is('archived_at', null);
    if (error) throw error;
    const accounts = (data ?? []).filter(
      (row): row is MetaAccount => Boolean(row.organization_id && row.brand_id && row.provider_account_id)
    );
    let succeeded = 0;
    let failed = 0;
    let posts = 0;
    for (const account of accounts) {
      try {
        const result = await syncAccount(account);
        succeeded += 1;
        posts += result.posts;
      } catch (error) {
        failed += 1;
        const expired = error instanceof MetaAnalyticsError && error.providerCode === 190;
        await client.from('social_accounts').update({
          status: 'error',
          connection_status: expired ? 'expired' : 'error',
          metadata: { analyticsSyncError: expired ? 'token_expired' : 'provider_error' },
        }).eq('id', account.id);
        console.warn(`[analytics-worker] Account ${account.id} sync failed`);
      }
    }
    return { accounts: accounts.length, succeeded, failed, posts };
  } finally {
    running = false;
  }
}

export function startAnalyticsWorker(): void {
  if (process.env.ANALYTICS_WORKER_ENABLED !== 'true') {
    console.log('[analytics-worker] ANALYTICS_WORKER_ENABLED is not "true"; metrics worker disabled');
    return;
  }
  if (task) return;
  task = cron.schedule('17 * * * *', () => {
    void syncMetaAnalytics().catch(() => console.error('[analytics-worker] Metrics sync failed'));
  });
  console.log('[analytics-worker] Meta metrics worker started (hourly)');
}
