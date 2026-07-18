import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PublishError,
  publishPost,
  type PublishJobRow,
  type SocialAccountRow,
} from '../publishers/index.js';

const account: SocialAccountRow = {
  id: 'account-1',
  brand_id: 'brand-1',
  platform: 'facebook',
  username: 'Steward',
  provider_account_id: 'page-1',
  oauth_access_token: 'vault-token',
  oauth_refresh_token: null,
  oauth_expires_at: null,
  status: 'connected',
};

function job(platform: 'facebook' | 'instagram', content: PublishJobRow['post_content']): PublishJobRow {
  return {
    id: 'job-1',
    organization_id: 'org-1',
    connection_id: 'account-1',
    platform,
    post_content: content,
    status: 'processing',
    attempt_count: 1,
    max_attempts: 3,
    retry_backoff_ms: 1000,
    published_post_id: null,
    published_url: null,
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('Meta publishing contract', () => {
  it('publishes a Facebook text post through the configured Graph version', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'facebook-post-1' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const result = await publishPost(job('facebook', { text: 'Hello', format: 'text' }), account);
    expect(result.externalId).toBe('facebook-post-1');
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/v25.0/page-1/feed');
    const body = fetchMock.mock.calls[0]?.[1]?.body as URLSearchParams;
    expect(body.get('message')).toBe('Hello');
  });

  it('maps expired Meta tokens to an actionable permanent error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { code: 190, message: 'Expired' } }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        })
      )
    );
    await expect(publishPost(job('facebook', { text: 'Hello' }), account)).rejects.toMatchObject({
      code: 'TOKEN_EXPIRED',
      retryable: false,
    } satisfies Partial<PublishError>);
  });

  it('waits for an Instagram image container before publishing', async () => {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      const value = String(url);
      if (init?.method === 'POST' && value.endsWith('/ig-1/media')) {
        return new Response(JSON.stringify({ id: 'container-1' }), { status: 200 });
      }
      if (!init?.method && value.includes('/container-1?')) {
        return new Response(JSON.stringify({ status_code: 'FINISHED' }), { status: 200 });
      }
      if (init?.method === 'POST' && value.endsWith('/ig-1/media_publish')) {
        return new Response(JSON.stringify({ id: 'instagram-post-1' }), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await publishPost(
      job('instagram', {
        text: 'An approved post',
        format: 'single_image',
        mediaUrls: ['https://signed.example/image.jpg'],
        mediaTypes: ['image/jpeg'],
      }),
      { ...account, platform: 'instagram', provider_account_id: 'ig-1' }
    );
    expect(result.externalId).toBe('instagram-post-1');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
