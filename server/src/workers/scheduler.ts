/**
 * Scheduled publishing worker.
 *
 * Every minute, atomically claims due rows from public.publish_jobs via the
 * claim_due_publish_jobs RPC (FOR UPDATE SKIP LOCKED — no double-processing)
 * and publishes them sequentially through the platform adapters.
 *
 * Enabled by default in production. Requires the Supabase service client;
 * tokens never leave the backend.
 */

import cron, { type ScheduledTask } from 'node-cron';
import { isWorkerEnabled } from '../config.js';
import { getSupabaseClient } from '../supabase.js';
import {
  publishPost,
  NotImplementedError,
  PublishError,
  type PublishJobRow,
  type SocialAccountRow,
} from './publishers/index.js';

const DEFAULT_BATCH_SIZE = 5;

let task: ScheduledTask | null = null;
let tickInProgress = false;
let lastTickAt: string | null = null;
let lastSuccessfulRunAt: string | null = null;
let lastError: string | null = null;

export function getPublishWorkerHealth(): {
  enabled: boolean;
  running: boolean;
  ready: boolean;
  tickInProgress: boolean;
  lastTickAt: string | null;
  lastSuccessfulRunAt: string | null;
  lastError: string | null;
} {
  const enabled = isWorkerEnabled('PUBLISH_WORKER_ENABLED');
  return {
    enabled,
    running: task !== null,
    ready: enabled && task !== null && Boolean(getSupabaseClient()),
    tickInProgress,
    lastTickAt,
    lastSuccessfulRunAt,
    lastError,
  };
}

function getBatchSize(): number {
  const parsed = Number(process.env.PUBLISH_WORKER_BATCH_SIZE);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_BATCH_SIZE;
}

// ---------------------------------------------------------------------------
// Token handling
// ---------------------------------------------------------------------------

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

function tokenNeedsRefresh(account: SocialAccountRow): boolean {
  const expiresAt = account.token_expires_at ?? account.oauth_expires_at;
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() - TOKEN_EXPIRY_BUFFER_MS <= Date.now();
}

/**
 * Meta long-lived token exchange. Other providers have no refresh helper yet
 * and fail honestly.
 */
async function refreshAccessToken(account: SocialAccountRow): Promise<{ accessToken: string; expiresAt: Date } | null> {
  if (account.platform === 'facebook' || account.platform === 'instagram') {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    if (!appId || !appSecret || !account.oauth_access_token) return null;
    try {
      const graphVersion = process.env.META_GRAPH_API_VERSION ?? 'v25.0';
      const url = new URL(`https://graph.facebook.com/${graphVersion}/oauth/access_token`);
      url.searchParams.set('grant_type', 'fb_exchange_token');
      url.searchParams.set('client_id', appId);
      url.searchParams.set('client_secret', appSecret);
      url.searchParams.set('fb_exchange_token', account.oauth_access_token);
      const response = await fetch(url);
      const data = (await response.json().catch(() => ({}))) as { access_token?: string; expires_in?: number };
      if (!response.ok || !data.access_token) return null;
      return {
        accessToken: data.access_token,
        expiresAt: new Date(Date.now() + (data.expires_in ?? 60 * 24 * 60 * 60) * 1000),
      };
    } catch (err) {
      console.error(`[scheduler] Token refresh failed for account ${account.id}:`, err);
      return null;
    }
  }
  // TODO: provider-specific refresh for google/linkedin/etc. when implemented.
  return null;
}

// ---------------------------------------------------------------------------
// Job processing
// ---------------------------------------------------------------------------

interface JobFailure {
  code: string;
  message: string;
  /** Permanent failures go straight to 'failed' regardless of attempts left. */
  permanent?: boolean;
}

async function markJobFailed(job: PublishJobRow, failure: JobFailure): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const canRetry = !failure.permanent && job.attempt_count < job.max_attempts;
  const { error } = await supabase
    .from('publish_jobs')
    .update({
      status: canRetry ? 'retrying' : 'failed',
      error_code: failure.code,
      error_message: failure.message.slice(0, 1000),
    })
    .eq('id', job.id);
  if (error) {
    console.error(`[scheduler] Failed to mark job ${job.id} as failed:`, error.message);
  }
  const internalPostId = job.post_id ?? job.post_content?.postId;
  if (internalPostId) {
    await supabase
      .from('posts')
      .update({ status: canRetry ? 'retrying' : 'failed', updated_at: new Date().toISOString() })
      .eq('id', internalPostId);
  }
}

async function markJobCompleted(
  job: PublishJobRow,
  externalId: string,
  url?: string,
  providerResponse?: Record<string, unknown>,
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  // publish_jobs.published_post_id is a uuid referencing the internal posts
  // row; the platform's external id is stored on posts.published_id (text)
  // and surfaced via published_url here.
  const internalPostId = job.post_id ?? job.post_content?.postId ?? null;
  const { error } = await supabase
    .from('publish_jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      published_post_id: internalPostId,
      published_url: url ?? null,
      platform_response: providerResponse ?? null,
      platform_post_id: externalId,
      platform_url: url ?? null,
      error_code: null,
      error_message: null,
    })
    .eq('id', job.id);
  if (error) {
    console.error(`[scheduler] Failed to mark job ${job.id} completed:`, error.message);
  }

  if (internalPostId) {
    const { error: postError } = await supabase
      .from('posts')
      .update({
        status: 'published',
        published_time: new Date().toISOString(),
        published_id: externalId,
      })
      .eq('id', internalPostId);
    if (postError) {
      console.error(`[scheduler] Failed to update post ${internalPostId}:`, postError.message);
    }
  }

  await supabase.from('social_post_publications').upsert({
    organization_id: job.organization_id,
    brand_id: job.brand_id ?? null,
    post_id: internalPostId,
    post_variant_id: job.post_variant_id ?? null,
    publish_job_id: job.id,
    social_account_id: job.social_account_id ?? job.connection_id,
    platform: job.platform,
    platform_post_id: externalId,
    platform_url: url ?? null,
    published_at: new Date().toISOString(),
    metadata: { providerResponse: providerResponse ?? {} },
  }, { onConflict: 'social_account_id,platform,platform_post_id' });
}

async function processJob(job: PublishJobRow): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { data: account, error: accountError } = await supabase
    .from('social_accounts')
    .select('id, brand_id, platform, username, provider_account_id, token_secret_id, token_expires_at, oauth_access_token, oauth_refresh_token, oauth_expires_at, status')
    .eq('id', job.connection_id)
    .maybeSingle<SocialAccountRow>();

  if (accountError || !account) {
    await markJobFailed(job, {
      code: 'ACCOUNT_NOT_FOUND',
      message: accountError?.message ?? `Social account ${job.connection_id} not found`,
      permanent: true,
    });
    return;
  }

  const internalPostId = job.post_id ?? job.post_content?.postId;
  if (internalPostId) {
    await supabase
      .from('posts')
      .update({ status: 'publishing', updated_at: new Date().toISOString() })
      .eq('id', internalPostId);
  }

  let workingAccount = account;
  if (account.token_secret_id) {
    const { data: tokenBundle, error: tokenError } = await supabase.rpc('read_social_token_bundle', {
      p_account_id: account.id,
    });
    if (tokenError || !tokenBundle?.accessToken) {
      await markJobFailed(job, { code: 'TOKEN_UNAVAILABLE', message: 'The social connection must be reconnected.', permanent: true });
      return;
    }
    workingAccount = {
      ...account,
      oauth_access_token: String(tokenBundle.accessToken),
      oauth_expires_at: tokenBundle.expiresAt ? String(tokenBundle.expiresAt) : account.oauth_expires_at,
      token_expires_at: tokenBundle.expiresAt ? String(tokenBundle.expiresAt) : account.token_expires_at,
    };
  }

  if (tokenNeedsRefresh(workingAccount)) {
    const refreshed = await refreshAccessToken(workingAccount);
    if (refreshed) {
      const { error: updateError } = await supabase.rpc('store_social_token_bundle', {
        p_account_id: account.id,
        p_token_bundle: { accessToken: refreshed.accessToken, expiresAt: refreshed.expiresAt.toISOString() },
      });
      if (updateError) {
        console.error(`[scheduler] Failed to persist refreshed token for account ${account.id}:`, updateError.message);
      }
      await supabase.from('social_accounts').update({
        oauth_expires_at: refreshed.expiresAt.toISOString(),
        token_expires_at: refreshed.expiresAt.toISOString(),
      }).eq('id', account.id);
      workingAccount = {
        ...workingAccount,
        oauth_access_token: refreshed.accessToken,
        oauth_expires_at: refreshed.expiresAt.toISOString(),
        token_expires_at: refreshed.expiresAt.toISOString(),
      };
    } else {
      await supabase.from('social_accounts').update({ status: 'error' }).eq('id', account.id);
      // TODO: create an alert/notification record once an alerts table exists.
      console.error(`[scheduler] Token expired and refresh failed for account ${account.id} (${account.platform})`);
      await markJobFailed(job, {
        code: 'TOKEN_EXPIRED',
        message: `Access token expired for ${account.platform} account ${account.username}; refresh failed`,
      });
      return;
    }
  }

  const mediaAssetIds = job.post_content?.mediaAssetIds ?? [];
  if (mediaAssetIds.length > 0) {
    const { data: mediaRows, error: mediaError } = await supabase
      .from('assets')
      .select('id, storage_bucket, storage_path, mime_type')
      .eq('organization_id', job.organization_id)
      .in('id', mediaAssetIds)
      .is('archived_at', null);
    if (mediaError || (mediaRows?.length ?? 0) !== mediaAssetIds.length) {
      await markJobFailed(job, { code: 'MEDIA_NOT_FOUND', message: 'One or more approved media assets are unavailable.', permanent: true });
      return;
    }
    const ordered = mediaAssetIds.map((id) => mediaRows!.find((row) => row.id === id)!);
    const mediaUrls: string[] = [];
    for (const media of ordered) {
      if (!media.storage_bucket || !media.storage_path) {
        await markJobFailed(job, { code: 'MEDIA_NOT_FOUND', message: 'An approved media asset has no storage object.', permanent: true });
        return;
      }
      const { data: signed, error: signedError } = await supabase.storage
        .from(media.storage_bucket as string)
        .createSignedUrl(media.storage_path as string, 20 * 60);
      if (signedError || !signed?.signedUrl) {
        await markJobFailed(job, { code: 'MEDIA_URL_ERROR', message: 'Steward could not prepare the media for publishing.' });
        return;
      }
      mediaUrls.push(signed.signedUrl);
    }
    job = {
      ...job,
      post_content: {
        ...job.post_content,
        mediaUrls,
        mediaTypes: ordered.map((row) => (row.mime_type as string | null) ?? 'application/octet-stream'),
      },
    };
  }

  try {
    const result = await publishPost(job, workingAccount);
    await markJobCompleted(job, result.externalId, result.url, result.providerResponse);
    console.log(`[scheduler] Job ${job.id} published to ${job.platform} (external id ${result.externalId})`);
  } catch (err) {
    if (err instanceof NotImplementedError) {
      // Honest failure: retrying will not help until the adapter exists.
      await markJobFailed(job, { code: 'NOT_IMPLEMENTED', message: err.message, permanent: true });
      console.warn(`[scheduler] Job ${job.id} failed: ${err.message}`);
      return;
    }
    const failure: JobFailure =
      err instanceof PublishError
        ? { code: err.code, message: err.message, permanent: !err.retryable }
        : { code: 'PUBLISH_ERROR', message: err instanceof Error ? err.message : String(err) };
    await markJobFailed(job, failure);
    console.error(`[scheduler] Job ${job.id} failed (${failure.code}): ${failure.message}`);
  }
}

async function tick(): Promise<void> {
  if (tickInProgress) return;
  tickInProgress = true;
  lastTickAt = new Date().toISOString();
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('[scheduler] Supabase service client not configured; skipping tick');
      return;
    }

    const { data: jobs, error } = await supabase.rpc('claim_due_publish_jobs', {
      limit_count: getBatchSize(),
    });
    if (error) {
      lastError = error.message;
      console.error('[scheduler] Failed to claim due jobs:', error.message);
      return;
    }

    const claimed = (jobs ?? []) as PublishJobRow[];
    if (claimed.length === 0) {
      lastSuccessfulRunAt = new Date().toISOString();
      lastError = null;
      return;
    }
    console.log(`[scheduler] Claimed ${claimed.length} due publish job(s)`);

    // Sequential on purpose: keeps platform rate limits manageable.
    for (const job of claimed) {
      await processJob(job);
    }
    lastSuccessfulRunAt = new Date().toISOString();
    lastError = null;
  } catch (err) {
    lastError = err instanceof Error ? err.message : String(err);
    console.error('[scheduler] Unexpected worker error:', lastError);
  } finally {
    tickInProgress = false;
  }
}

/**
 * Starts the cron-based scheduler. Enabled by default in production and
 * disabled by default elsewhere; PUBLISH_WORKER_ENABLED overrides either.
 */
export function startScheduler(): void {
  if (!isWorkerEnabled('PUBLISH_WORKER_ENABLED')) {
    console.log('[scheduler] Publishing worker disabled by environment configuration');
    return;
  }
  if (task) {
    console.warn('[scheduler] Scheduler already started; ignoring duplicate start');
    return;
  }
  if (!getSupabaseClient()) {
    console.error('[scheduler] Cannot start: SUPABASE_URL and a Supabase secret key are not configured');
    return;
  }
  task = cron.schedule('* * * * *', () => {
    void tick();
  });
  lastError = null;
  console.log(`[scheduler] Publishing worker started (batch size ${getBatchSize()}, every minute)`);
}

export function stopScheduler(): void {
  if (task) {
    task.stop();
    task = null;
  }
}
