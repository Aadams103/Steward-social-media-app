/**
 * Platform publishing adapters for the scheduled publishing worker.
 *
 * Shared contract: publishPost(job, account) resolves with the external post
 * id (and URL when available), or throws:
 * - NotImplementedError for platforms without a real implementation — the
 *   worker marks these jobs failed with error_code NOT_IMPLEMENTED instead of
 *   simulating success.
 * - PublishError for real API failures (retryable by the worker).
 */

const GRAPH_BASE = 'https://graph.facebook.com/v18.0';

export interface PublishJobRow {
  id: string;
  organization_id: string;
  connection_id: string;
  platform: string;
  post_content: { text?: string; hashtags?: string[]; linkUrl?: string; mediaUrls?: string[]; postId?: string };
  status: string;
  attempt_count: number;
  max_attempts: number;
  retry_backoff_ms: number;
  published_post_id: string | null;
  published_url: string | null;
}

export interface SocialAccountRow {
  id: string;
  brand_id: string;
  platform: string;
  username: string;
  provider_account_id: string | null;
  oauth_access_token: string | null;
  oauth_refresh_token: string | null;
  oauth_expires_at: string | null;
  status: string;
}

export interface PublishResult {
  externalId: string;
  url?: string;
}

export class NotImplementedError extends Error {
  constructor(platform: string) {
    super(`Publishing to "${platform}" is not implemented yet`);
    this.name = 'NotImplementedError';
  }
}

export class PublishError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'PublishError';
    this.code = code;
  }
}

function buildMessage(job: PublishJobRow): string {
  const text = job.post_content?.text ?? '';
  const hashtags = job.post_content?.hashtags ?? [];
  const tagSuffix = hashtags.length > 0 ? `\n\n${hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}` : '';
  return `${text}${tagSuffix}`.trim();
}

async function publishToFacebook(job: PublishJobRow, account: SocialAccountRow): Promise<PublishResult> {
  const pageId = account.provider_account_id;
  const token = account.oauth_access_token;
  if (!pageId || !token) {
    throw new PublishError('MISSING_CREDENTIALS', 'Facebook account is missing a page id or access token');
  }

  const message = buildMessage(job);
  if (!message && !job.post_content?.linkUrl) {
    throw new PublishError('EMPTY_CONTENT', 'Post has no text or link to publish');
  }

  const params = new URLSearchParams({ access_token: token });
  if (message) params.set('message', message);
  if (job.post_content?.linkUrl) params.set('link', job.post_content.linkUrl);

  const response = await fetch(`${GRAPH_BASE}/${pageId}/feed`, { method: 'POST', body: params });
  const data = (await response.json().catch(() => ({}))) as { id?: string; error?: { message?: string; code?: number } };
  if (!response.ok || !data.id) {
    throw new PublishError('FACEBOOK_API_ERROR', data.error?.message ?? `Facebook publish failed (HTTP ${response.status})`);
  }
  return { externalId: data.id, url: `https://www.facebook.com/${data.id}` };
}

async function publishToInstagram(job: PublishJobRow, account: SocialAccountRow): Promise<PublishResult> {
  const igUserId = account.provider_account_id;
  const token = account.oauth_access_token;
  if (!igUserId || !token) {
    throw new PublishError('MISSING_CREDENTIALS', 'Instagram account is missing a user id or access token');
  }

  // Instagram requires media; text-only posts are not supported by the API.
  const imageUrl = job.post_content?.mediaUrls?.[0];
  if (!imageUrl) {
    throw new PublishError('MEDIA_REQUIRED', 'Instagram posts require at least one image URL');
  }

  const containerParams = new URLSearchParams({
    access_token: token,
    image_url: imageUrl,
    caption: buildMessage(job),
  });
  const containerRes = await fetch(`${GRAPH_BASE}/${igUserId}/media`, { method: 'POST', body: containerParams });
  const containerData = (await containerRes.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
  if (!containerRes.ok || !containerData.id) {
    throw new PublishError('INSTAGRAM_API_ERROR', containerData.error?.message ?? `Instagram container creation failed (HTTP ${containerRes.status})`);
  }

  const publishParams = new URLSearchParams({ access_token: token, creation_id: containerData.id });
  const publishRes = await fetch(`${GRAPH_BASE}/${igUserId}/media_publish`, { method: 'POST', body: publishParams });
  const publishData = (await publishRes.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
  if (!publishRes.ok || !publishData.id) {
    throw new PublishError('INSTAGRAM_API_ERROR', publishData.error?.message ?? `Instagram publish failed (HTTP ${publishRes.status})`);
  }
  return { externalId: publishData.id };
}

/**
 * Publish a claimed job through the right platform adapter.
 * Unsupported platforms throw NotImplementedError — never fake success.
 */
export async function publishPost(job: PublishJobRow, account: SocialAccountRow): Promise<PublishResult> {
  switch (job.platform) {
    case 'facebook':
      return publishToFacebook(job, account);
    case 'instagram':
      return publishToInstagram(job, account);
    default:
      throw new NotImplementedError(job.platform);
  }
}
