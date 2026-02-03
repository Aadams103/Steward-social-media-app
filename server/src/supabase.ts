/**
 * Supabase client for Steward backend.
 * Use only when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.
 * Service role bypasses RLS — use only server-side; never expose to frontend.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { SocialAccount } from './types.js';

let _client: SupabaseClient | null = null;

const oauthStatesMemory = new Map<string, { brandId: string; purpose: string; provider: string; expiresAt: number }>();

export function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

export async function checkSupabaseConnection(): Promise<'connected' | 'disconnected'> {
  const client = getSupabaseClient();
  if (!client) return 'disconnected';
  try {
    const { error } = await client.from('organizations').select('id').limit(1);
    if (error) return 'disconnected';
    return 'connected';
  } catch {
    return 'disconnected';
  }
}

// --- OAuth state: persist in Supabase when configured, else in-memory ---

export async function setOAuthState(
  state: string,
  data: { brandId: string; purpose: string; provider: string; expiresAt: number }
): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    await client.from('oauth_states').insert({
      state,
      brand_id: data.brandId,
      purpose: data.purpose,
      provider: data.provider,
      expires_at: new Date(data.expiresAt).toISOString(),
    });
  } else {
    for (const [k, v] of oauthStatesMemory.entries()) {
      if (v.expiresAt < Date.now()) oauthStatesMemory.delete(k);
    }
    oauthStatesMemory.set(state, data);
  }
}

export async function getAndDeleteOAuthState(
  state: string
): Promise<{ brandId: string; purpose: string; provider: string; expiresAt: number } | null> {
  const client = getSupabaseClient();
  if (client) {
    const { data: row } = await client.from('oauth_states').select('brand_id, purpose, provider, expires_at').eq('state', state).single();
    await client.from('oauth_states').delete().eq('state', state);
    if (!row || new Date(row.expires_at).getTime() < Date.now()) return null;
    return { brandId: row.brand_id, purpose: row.purpose, provider: row.provider, expiresAt: new Date(row.expires_at).getTime() };
  }
  const d = oauthStatesMemory.get(state);
  oauthStatesMemory.delete(state);
  if (!d || d.expiresAt < Date.now()) return null;
  return d;
}

// --- Social account: upsert to Supabase when configured (for OAuth token storage) ---

export async function upsertSocialAccountForSupabase(
  account: SocialAccount,
  organizationIdOverride?: string
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  let orgId: string | null = organizationIdOverride ?? null;
  if (!orgId) {
    const { data: b } = await client.from('brands').select('organization_id').eq('id', account.brandId).single();
    orgId = b?.organization_id ?? null;
  }
  if (!orgId) return;
  const oauth = account.oauthToken;
  await client.from('social_accounts').upsert(
    {
      id: account.id,
      brand_id: account.brandId,
      platform: account.platform,
      username: account.username,
      display_name: account.displayName,
      avatar_url: account.avatarUrl ?? null,
      is_connected: account.isConnected,
      status: account.status,
      last_sync: account.lastSync?.toISOString() ?? null,
      follower_count: account.followerCount ?? null,
      organization_id: orgId,
      provider_account_id: account.providerAccountId ?? null,
      oauth_access_token: oauth?.accessToken ?? null,
      oauth_refresh_token: oauth?.refreshToken ?? null,
      oauth_expires_at: oauth?.expiresAt?.toISOString() ?? null,
      created_at: (account.createdAt ?? new Date()).toISOString(),
      updated_at: (account.updatedAt ?? new Date()).toISOString(),
    },
    { onConflict: 'id' }
  );
}

// --- Ingest: Instagram (one-platform proof) ---

export async function getInstagramAccountsForIngest(): Promise<
  Array<{ id: string; brand_id: string; provider_account_id: string; oauth_access_token: string }>
> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data } = await client
    .from('social_accounts')
    .select('id, brand_id, provider_account_id, oauth_access_token, oauth_expires_at')
    .eq('platform', 'instagram')
    .not('oauth_access_token', 'is', null);
  const now = Date.now();
  return (data ?? [])
    .filter((r) => !r.oauth_expires_at || new Date(r.oauth_expires_at).getTime() > now)
    .map((r) => ({
      id: r.id,
      brand_id: r.brand_id,
      provider_account_id: r.provider_account_id || r.id,
      oauth_access_token: r.oauth_access_token,
    }));
}

export async function upsertIngestedPost(
  platform: string,
  externalId: string,
  brandId: string | null,
  payload: Record<string, unknown>
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.from('ingested_posts').upsert(
    { platform, external_id: externalId, brand_id: brandId, payload, fetched_at: new Date().toISOString() },
    { onConflict: 'platform,external_id' }
  );
}

// --- List ingested posts for API (real data from Instagram/Facebook etc.) ---

export interface IngestedPostRow {
  id: string;
  brand_id: string | null;
  platform: string;
  external_id: string;
  payload: Record<string, unknown>;
  fetched_at: string;
}

export async function listIngestedPosts(options: {
  brandId?: string;
  platform?: string;
  limit?: number;
}): Promise<IngestedPostRow[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  let q = client
    .from('ingested_posts')
    .select('id, brand_id, platform, external_id, payload, fetched_at')
    .order('fetched_at', { ascending: false });
  if (options.brandId) q = q.eq('brand_id', options.brandId);
  if (options.platform) q = q.eq('platform', options.platform);
  if (options.limit) q = q.limit(options.limit);
  const { data } = await q;
  return (data ?? []) as IngestedPostRow[];
}
