/** Real Facebook Pages and Instagram Professional publishing adapters. */

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION ?? 'v25.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export interface PublishJobContent {
  text?: string;
  hashtags?: string[];
  linkUrl?: string;
  mediaUrls?: string[];
  mediaAssetIds?: string[];
  mediaTypes?: string[];
  format?: 'text' | 'link' | 'photo' | 'video' | 'single_image' | 'carousel' | 'reel';
  postId?: string;
}

export interface PublishJobRow {
  id: string;
  organization_id: string;
  brand_id?: string | null;
  post_id?: string | null;
  post_variant_id?: string | null;
  social_account_id?: string | null;
  connection_id: string;
  platform: string;
  post_content: PublishJobContent;
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
  token_secret_id?: string | null;
  oauth_access_token: string | null;
  oauth_refresh_token: string | null;
  oauth_expires_at: string | null;
  token_expires_at?: string | null;
  status: string;
}

export interface PublishResult {
  externalId: string;
  url?: string;
  providerResponse?: Record<string, unknown>;
}

export class NotImplementedError extends Error {
  constructor(platform: string) {
    super(`Publishing to "${platform}" is not implemented yet`);
    this.name = 'NotImplementedError';
  }
}

export class PublishError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  constructor(code: string, message: string, retryable = true) {
    super(message);
    this.name = 'PublishError';
    this.code = code;
    this.retryable = retryable;
  }
}

function buildMessage(job: PublishJobRow): string {
  const text = job.post_content?.text ?? '';
  const hashtags = job.post_content?.hashtags ?? [];
  const tagSuffix = hashtags.length > 0 ? `\n\n${hashtags.map((tag) => (tag.startsWith('#') ? tag : `#${tag}`)).join(' ')}` : '';
  return `${text}${tagSuffix}`.trim();
}

function providerMessage(code?: number, fallback?: string): { code: string; message: string; retryable: boolean } {
  if (code === 190) return { code: 'TOKEN_EXPIRED', message: 'The Meta access token expired. Reconnect the account.', retryable: false };
  if (code === 10 || code === 200) return { code: 'PERMISSION_DENIED', message: 'Meta denied the required publishing permission.', retryable: false };
  if (code === 4 || code === 17 || code === 32) return { code: 'META_RATE_LIMITED', message: 'Meta is rate limiting this account.', retryable: true };
  return { code: 'META_API_ERROR', message: fallback ?? 'Meta could not publish this content.', retryable: true };
}

async function metaPost(path: string, params: URLSearchParams): Promise<{ id: string; [key: string]: unknown }> {
  const response = await fetch(`${GRAPH_BASE}/${path.replace(/^\//, '')}`, { method: 'POST', body: params });
  const data = (await response.json().catch(() => ({}))) as {
    id?: string;
    error?: { message?: string; code?: number; error_user_msg?: string };
  };
  if (!response.ok || !data.id) {
    const mapped = providerMessage(data.error?.code, data.error?.error_user_msg ?? data.error?.message);
    throw new PublishError(mapped.code, mapped.message, mapped.retryable);
  }
  return data as { id: string; [key: string]: unknown };
}

async function waitForInstagramContainer(containerId: string, token: string): Promise<void> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const url = new URL(`${GRAPH_BASE}/${containerId}`);
    url.searchParams.set('fields', 'status_code,status');
    url.searchParams.set('access_token', token);
    const response = await fetch(url);
    const data = (await response.json().catch(() => ({}))) as {
      status_code?: string;
      status?: string;
      error?: { code?: number; message?: string; error_user_msg?: string };
    };
    if (!response.ok || data.error) {
      const mapped = providerMessage(data.error?.code, data.error?.error_user_msg ?? data.error?.message);
      throw new PublishError(mapped.code, mapped.message, mapped.retryable);
    }
    if (data.status_code === 'FINISHED' || data.status_code === 'PUBLISHED') return;
    if (data.status_code === 'ERROR' || data.status_code === 'EXPIRED') {
      throw new PublishError('INSTAGRAM_CONTAINER_FAILED', data.status ?? 'Instagram could not process the media.', false);
    }
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }
  throw new PublishError('INSTAGRAM_CONTAINER_TIMEOUT', 'Instagram is still processing the media. Steward will retry.', true);
}

async function publishToFacebook(job: PublishJobRow, account: SocialAccountRow): Promise<PublishResult> {
  const pageId = account.provider_account_id;
  const token = account.oauth_access_token;
  if (!pageId || !token) throw new PublishError('MISSING_CREDENTIALS', 'Facebook connection needs to be reconnected.', false);

  const message = buildMessage(job);
  const mediaUrl = job.post_content.mediaUrls?.[0];
  const mediaType = job.post_content.mediaTypes?.[0] ?? '';
  const format = job.post_content.format;

  if (mediaUrl && (format === 'video' || mediaType.startsWith('video/'))) {
    const data = await metaPost(`${pageId}/videos`, new URLSearchParams({
      access_token: token,
      file_url: mediaUrl,
      description: message,
    }));
    return { externalId: data.id, url: `https://www.facebook.com/${data.id}`, providerResponse: { id: data.id } };
  }

  if (mediaUrl && (format === 'photo' || format === 'single_image' || mediaType.startsWith('image/'))) {
    const data = await metaPost(`${pageId}/photos`, new URLSearchParams({
      access_token: token,
      url: mediaUrl,
      caption: message,
    }));
    return { externalId: data.id, url: `https://www.facebook.com/${data.id}`, providerResponse: { id: data.id } };
  }

  if (!message && !job.post_content.linkUrl) throw new PublishError('EMPTY_CONTENT', 'Facebook post has no content.', false);
  const params = new URLSearchParams({ access_token: token });
  if (message) params.set('message', message);
  if (job.post_content.linkUrl) params.set('link', job.post_content.linkUrl);
  const data = await metaPost(`${pageId}/feed`, params);
  return { externalId: data.id, url: `https://www.facebook.com/${data.id}`, providerResponse: { id: data.id } };
}

async function createInstagramChild(
  igUserId: string,
  token: string,
  mediaUrl: string,
  mediaType: string,
): Promise<string> {
  const params = new URLSearchParams({ access_token: token, is_carousel_item: 'true' });
  if (mediaType.startsWith('video/')) {
    params.set('media_type', 'VIDEO');
    params.set('video_url', mediaUrl);
  } else {
    params.set('image_url', mediaUrl);
  }
  const child = await metaPost(`${igUserId}/media`, params);
  if (mediaType.startsWith('video/')) await waitForInstagramContainer(child.id, token);
  return child.id;
}

async function publishToInstagram(job: PublishJobRow, account: SocialAccountRow): Promise<PublishResult> {
  const igUserId = account.provider_account_id;
  const token = account.oauth_access_token;
  if (!igUserId || !token) throw new PublishError('MISSING_CREDENTIALS', 'Instagram connection needs to be reconnected.', false);
  const mediaUrls = job.post_content.mediaUrls ?? [];
  const mediaTypes = job.post_content.mediaTypes ?? [];
  if (mediaUrls.length === 0) throw new PublishError('MEDIA_REQUIRED', 'Instagram posts require approved media.', false);
  const caption = buildMessage(job);

  let containerId: string;
  if (job.post_content.format === 'carousel' || mediaUrls.length > 1) {
    if (mediaUrls.length > 10) throw new PublishError('CAROUSEL_TOO_LARGE', 'Instagram carousels support up to 10 items.', false);
    const children: string[] = [];
    for (let index = 0; index < mediaUrls.length; index += 1) {
      children.push(await createInstagramChild(igUserId, token, mediaUrls[index]!, mediaTypes[index] ?? 'image/jpeg'));
    }
    const parent = await metaPost(`${igUserId}/media`, new URLSearchParams({
      access_token: token,
      media_type: 'CAROUSEL',
      children: children.join(','),
      caption,
    }));
    containerId = parent.id;
  } else if (job.post_content.format === 'reel' || (mediaTypes[0] ?? '').startsWith('video/')) {
    const reel = await metaPost(`${igUserId}/media`, new URLSearchParams({
      access_token: token,
      media_type: 'REELS',
      video_url: mediaUrls[0]!,
      caption,
      share_to_feed: 'true',
    }));
    containerId = reel.id;
  } else {
    const image = await metaPost(`${igUserId}/media`, new URLSearchParams({
      access_token: token,
      image_url: mediaUrls[0]!,
      caption,
    }));
    containerId = image.id;
  }

  await waitForInstagramContainer(containerId, token);
  const published = await metaPost(`${igUserId}/media_publish`, new URLSearchParams({
    access_token: token,
    creation_id: containerId,
  }));
  return { externalId: published.id, url: `https://www.instagram.com/p/${published.id}/`, providerResponse: { id: published.id, containerId } };
}

export async function publishPost(job: PublishJobRow, account: SocialAccountRow): Promise<PublishResult> {
  if (job.platform === 'facebook') return publishToFacebook(job, account);
  if (job.platform === 'instagram') return publishToInstagram(job, account);
  throw new NotImplementedError(job.platform);
}
