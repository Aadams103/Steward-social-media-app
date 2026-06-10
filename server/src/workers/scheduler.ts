/**
 * Scheduled publishing worker.
 *
 * Every minute, atomically claims due rows from public.publish_jobs via the
 * claim_due_publish_jobs RPC (FOR UPDATE SKIP LOCKED — no double-processing)
 * and publishes them sequentially through the platform adapters.
 *
 * Disabled unless PUBLISH_WORKER_ENABLED=true. Requires the Supabase service
 * role client; tokens never leave the backend.
 */

import cron, { type ScheduledTask } from 'node-cron';
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

function getBatchSize(): number {
  const parsed = Number(process.env.PUBLISH_WORKER_BATCH_SIZE);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_BATCH_SIZE;
}

// ---------------------------------------------------------------------------
// Token handling
// ---------------------------------------------------------------------------

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

function tokenNeedsRefresh(account: SocialAccountRow): boolean {
  if (!account.oauth_expires_at) return false;
  return new Date(account.oauth_expires_at).getTime() - TOKEN_EXPIRY_BUFFER_MS <= Date.now();
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
      const url = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
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
}

async function markJobCompleted(job: PublishJobRow, externalId: string, url?: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  // publish_jobs.published_post_id is a uuid referencing the internal posts
  // row; the platform's external id is stored on posts.published_id (text)
  // and surfaced via published_url here.
  const internalPostId = job.post_content?.postId ?? null;
  const { error } = await supabase
    .from('publish_jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      published_post_id: internalPostId,
      published_url: url ?? null,
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
}

async function processJob(job: PublishJobRow): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { data: account, error: accountError } = await supabase
    .from('social_accounts')
    .select('id, brand_id, platform, username, provider_account_id, oauth_access_token, oauth_refresh_token, oauth_expires_at, status')
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

  let workingAccount = account;
  if (tokenNeedsRefresh(account)) {
    const refreshed = await refreshAccessToken(account);
    if (refreshed) {
      const { error: updateError } = await supabase
        .from('social_accounts')
        .update({
          oauth_access_token: refreshed.accessToken,
          oauth_expires_at: refreshed.expiresAt.toISOString(),
        })
        .eq('id', account.id);
      if (updateError) {
        console.error(`[scheduler] Failed to persist refreshed token for account ${account.id}:`, updateError.message);
      }
      workingAccount = { ...account, oauth_access_token: refreshed.accessToken, oauth_expires_at: refreshed.expiresAt.toISOString() };
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

  try {
    const result = await publishPost(job, workingAccount);
    await markJobCompleted(job, result.externalId, result.url);
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
        ? { code: err.code, message: err.message }
        : { code: 'PUBLISH_ERROR', message: err instanceof Error ? err.message : String(err) };
    await markJobFailed(job, failure);
    console.error(`[scheduler] Job ${job.id} failed (${failure.code}): ${failure.message}`);
  }
}

async function tick(): Promise<void> {
  if (tickInProgress) return;
  tickInProgress = true;
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
      console.error('[scheduler] Failed to claim due jobs:', error.message);
      return;
    }

    const claimed = (jobs ?? []) as PublishJobRow[];
    if (claimed.length === 0) return;
    console.log(`[scheduler] Claimed ${claimed.length} due publish job(s)`);

    // Sequential on purpose: keeps platform rate limits manageable.
    for (const job of claimed) {
      await processJob(job);
    }
  } finally {
    tickInProgress = false;
  }
}

/**
 * Starts the cron-based scheduler. No-op unless PUBLISH_WORKER_ENABLED=true.
 * Idempotent so dev/watch restarts don't stack intervals.
 */
export function startScheduler(): void {
  if (process.env.PUBLISH_WORKER_ENABLED !== 'true') {
    console.log('[scheduler] PUBLISH_WORKER_ENABLED is not "true"; publishing worker disabled');
    return;
  }
  if (task) {
    console.warn('[scheduler] Scheduler already started; ignoring duplicate start');
    return;
  }
  if (!getSupabaseClient()) {
    console.error('[scheduler] Cannot start: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not configured');
    return;
  }
  task = cron.schedule('* * * * *', () => {
    void tick();
  });
  console.log(`[scheduler] Publishing worker started (batch size ${getBatchSize()}, every minute)`);
}

export function stopScheduler(): void {
  if (task) {
    task.stop();
    task = null;
  }
}
