import { randomBytes } from 'node:crypto';
import type { Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { getPermissions } from '../services/permissions.js';
import { assertWorkspaceAccess, logAuditEvent } from '../services/workspace.js';
import { getSupabaseClient } from '../supabase.js';

const META_VERSION = process.env.META_GRAPH_API_VERSION ?? 'v25.0';
const GRAPH_ORIGIN = 'https://graph.facebook.com';
const META_DIALOG_ORIGIN = 'https://www.facebook.com';

interface MetaInstagramAccount {
  id: string;
  username?: string;
  name?: string;
  profile_picture_url?: string;
}

interface MetaPage {
  id: string;
  name: string;
  access_token: string;
  tasks?: string[];
  instagram_business_account?: MetaInstagramAccount;
}

interface MetaCandidate {
  key: string;
  platform: 'facebook' | 'instagram';
  accountId: string;
  accountName: string;
  username?: string;
  avatarUrl?: string;
  pageId: string;
  pageName: string;
}

class MetaApiError extends Error {
  constructor(
    public readonly providerCode: number | undefined,
    public readonly userMessage: string,
    public readonly status: number,
  ) {
    super(userMessage);
  }
}

function requireMetaConfig(): { appId: string; appSecret: string; redirectUri: string } {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const base = process.env.META_OAUTH_REDIRECT_BASE ?? process.env.BACKEND_URL;
  if (!appId || !appSecret || !base) throw new Error('META_NOT_CONFIGURED');
  return { appId, appSecret, redirectUri: `${base.replace(/\/$/, '')}/api/oauth/meta/callback` };
}

function configuredFrontendOrigins(): string[] {
  const configured = [process.env.FRONTEND_URL, ...(process.env.FRONTEND_URLS ?? '').split(',')]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
  return configured.flatMap((value) => {
    try {
      return [new URL(value).origin];
    } catch {
      return [];
    }
  });
}

export function validateMetaReturnOrigin(value?: string): string {
  const fallback = configuredFrontendOrigins()[0]
    ?? (process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:5173');
  const requested = value ?? fallback;
  if (!requested) {
    const error = new Error('INVALID_RETURN_ORIGIN');
    (error as Error & { code: string }).code = 'INVALID_RETURN_ORIGIN';
    throw error;
  }

  let parsed: URL;
  try {
    parsed = new URL(requested);
  } catch {
    const error = new Error('INVALID_RETURN_ORIGIN');
    (error as Error & { code: string }).code = 'INVALID_RETURN_ORIGIN';
    throw error;
  }
  if (parsed.origin !== requested.replace(/\/$/, '') || parsed.username || parsed.password) {
    const error = new Error('INVALID_RETURN_ORIGIN');
    (error as Error & { code: string }).code = 'INVALID_RETURN_ORIGIN';
    throw error;
  }

  const exactOrigins = new Set(configuredFrontendOrigins());
  const previewSuffix = process.env.VERCEL_PREVIEW_SUFFIX?.trim().toLowerCase();
  const previewPrefix = process.env.VERCEL_PREVIEW_PROJECT_PREFIX?.trim().toLowerCase();
  const hostname = parsed.hostname.toLowerCase();
  const isApprovedPreview = Boolean(
    previewSuffix
      && parsed.protocol === 'https:'
      && hostname.endsWith(`-${previewSuffix}`)
      && (!previewPrefix || hostname.startsWith(previewPrefix)),
  );
  const isLocalDevelopment = process.env.NODE_ENV !== 'production'
    && ['localhost', '127.0.0.1'].includes(hostname)
    && ['http:', 'https:'].includes(parsed.protocol);
  if (!exactOrigins.has(parsed.origin) && !isApprovedPreview && !isLocalDevelopment) {
    const error = new Error('INVALID_RETURN_ORIGIN');
    (error as Error & { code: string }).code = 'INVALID_RETURN_ORIGIN';
    throw error;
  }
  return parsed.origin;
}

function metaUserMessage(code?: number): string {
  if (code === 190) return 'Your Meta session expired. Reconnect the account and try again.';
  if (code === 10 || code === 200) return 'Meta did not grant the required Page or Instagram permissions.';
  if (code === 4 || code === 17 || code === 32) return 'Meta is rate limiting this account. Wait a few minutes and retry.';
  return 'Meta could not complete the request. Check the app permissions and try again.';
}

async function metaFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${GRAPH_ORIGIN}/${META_VERSION}/${path.replace(/^\//, '')}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  const payload = await response.json().catch(() => ({})) as {
    error?: { code?: number; message?: string; error_user_msg?: string };
  } & T;
  if (!response.ok || payload.error) {
    const providerCode = payload.error?.code;
    throw new MetaApiError(providerCode, metaUserMessage(providerCode), response.status);
  }
  return payload as T;
}

async function loadManagedPages(accessToken: string): Promise<MetaPage[]> {
  const payload = await metaFetch<{ data?: MetaPage[] }>('me/accounts', {
    fields: 'id,name,access_token,tasks,instagram_business_account{id,username,name,profile_picture_url}',
    limit: '100',
    access_token: accessToken,
  });
  return payload.data ?? [];
}

function safeCandidates(pages: MetaPage[]): MetaCandidate[] {
  return pages.flatMap((page) => {
    const candidates: MetaCandidate[] = [{
      key: `facebook:${page.id}`,
      platform: 'facebook',
      accountId: page.id,
      accountName: page.name,
      pageId: page.id,
      pageName: page.name,
    }];
    const instagram = page.instagram_business_account;
    if (instagram?.id) {
      candidates.push({
        key: `instagram:${instagram.id}`,
        platform: 'instagram',
        accountId: instagram.id,
        accountName: instagram.name || instagram.username || page.name,
        username: instagram.username,
        avatarUrl: instagram.profile_picture_url,
        pageId: page.id,
        pageName: page.name,
      });
    }
    return candidates;
  });
}

function callbackHtml(sessionId: string, returnOrigin: string): string {
  const frontendOrigin = validateMetaReturnOrigin(returnOrigin);
  const fallback = new URL('/app', frontendOrigin);
  fallback.searchParams.set('metaSelection', sessionId);
  return `<!doctype html><html><head><meta charset="utf-8"><title>Steward · Meta connected</title></head><body style="font-family:system-ui;background:#0b1530;color:#fff;display:grid;place-items:center;min-height:100vh"><main><h1>Choose your accounts in Steward</h1><p>This window will close automatically.</p></main><script>if(window.opener){window.opener.postMessage({type:'steward:meta-selection',sessionId:${JSON.stringify(sessionId)}},${JSON.stringify(frontendOrigin)});window.close()}else{window.location.replace(${JSON.stringify(fallback.toString())})}</script></body></html>`;
}

function oauthError(res: Response, err: unknown): void {
  if (err instanceof z.ZodError) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Check the connection details and try again.', details: err.flatten() });
    return;
  }
  if (err instanceof MetaApiError) {
    res.status(err.status >= 500 ? 502 : 400).json({
      code: 'META_API_ERROR',
      message: err.userMessage,
      providerCode: err.providerCode,
    });
    return;
  }
  const code = err instanceof Error ? (err as Error & { code?: string }).code : undefined;
  if (code === 'ORG_ACCESS_DENIED' || code === 'BRAND_ACCESS_DENIED' || code === 'FORBIDDEN') {
    res.status(403).json({ code: 'FORBIDDEN', message: 'You cannot manage connections for this workspace.' });
    return;
  }
  if (code === 'INVALID_RETURN_ORIGIN') {
    res.status(400).json({ code: 'INVALID_RETURN_ORIGIN', message: 'Return to Steward from an approved application address.' });
    return;
  }
  if (err instanceof Error && err.message === 'META_NOT_CONFIGURED') {
    res.status(503).json({ code: 'META_NOT_CONFIGURED', message: 'Meta connection settings are not configured.' });
    return;
  }
  console.error('Meta OAuth request failed', err instanceof Error ? err.message : 'unknown error');
  res.status(500).json({ code: 'META_OAUTH_ERROR', message: 'The Meta connection could not be completed.' });
}

export async function initiateMetaOAuthHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  const client = getSupabaseClient();
  if (!userId) return void res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
  if (!client) return void res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Connection storage is unavailable' });
  try {
    const body = z.object({
      provider: z.literal('meta').optional().default('meta'),
      platform: z.enum(['facebook', 'instagram']).optional(),
      organizationId: z.string().uuid(),
      brandId: z.string().uuid(),
      returnOrigin: z.string().url().optional(),
    }).parse(req.body);
    const role = await assertWorkspaceAccess(userId, body.organizationId, body.brandId);
    if (!getPermissions(role).canManageWorkspace && !['editor', 'strategist'].includes(role)) {
      const error = new Error('FORBIDDEN');
      (error as Error & { code: string }).code = 'FORBIDDEN';
      throw error;
    }
    const config = requireMetaConfig();
    const returnOrigin = validateMetaReturnOrigin(body.returnOrigin);
    const state = randomBytes(32).toString('base64url');
    const nonce = randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error } = await client.from('oauth_states').insert({
      state,
      user_id: userId,
      organization_id: body.organizationId,
      brand_id: body.brandId,
      purpose: body.platform ?? 'meta',
      provider: 'meta',
      nonce,
      redirect_uri: config.redirectUri,
      return_origin: returnOrigin,
      expires_at: expiresAt,
    });
    if (error) throw error;

    const authUrl = new URL(`${META_DIALOG_ORIGIN}/${META_VERSION}/dialog/oauth`);
    authUrl.searchParams.set('client_id', config.appId);
    authUrl.searchParams.set('redirect_uri', config.redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'read_insights',
      'instagram_basic',
      'instagram_content_publish',
      'instagram_manage_insights',
    ].join(','));

    res.status(201).json({
      authUrl: authUrl.toString(),
      callbackOrigin: new URL(config.redirectUri).origin,
      state,
      expiresAt,
    });
  } catch (err) {
    oauthError(res, err);
  }
}

export async function metaOAuthCallbackHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return void res.status(503).send('Connection storage is unavailable.');
  try {
    const query = z.object({ code: z.string().min(1), state: z.string().min(20) }).parse(req.query);
    const config = requireMetaConfig();
    const { data: consumed, error: stateError } = await client.rpc('consume_oauth_state', { p_state: query.state });
    if (stateError) throw stateError;
    const state = Array.isArray(consumed) ? consumed[0] : consumed;
    if (!state?.user_id || !state?.organization_id || !state?.brand_id || state.provider !== 'meta') {
      return void res.status(400).send('This connection request expired or was already used. Start again in Steward.');
    }
    if (state.redirect_uri && state.redirect_uri !== config.redirectUri) {
      return void res.status(400).send('Connection redirect mismatch. Start again in Steward.');
    }

    const shortToken = await metaFetch<{ access_token: string; expires_in?: number }>('oauth/access_token', {
      client_id: config.appId,
      client_secret: config.appSecret,
      redirect_uri: config.redirectUri,
      code: query.code,
    });
    const longToken = await metaFetch<{ access_token: string; expires_in?: number }>('oauth/access_token', {
      grant_type: 'fb_exchange_token',
      client_id: config.appId,
      client_secret: config.appSecret,
      fb_exchange_token: shortToken.access_token,
    });
    const expiresAt = new Date(Date.now() + (longToken.expires_in ?? 5_184_000) * 1000).toISOString();
    const pages = await loadManagedPages(longToken.access_token);
    const candidates = safeCandidates(pages);
    if (candidates.length === 0) {
      return void res.status(400).send('No Facebook Pages or linked Instagram Professional accounts were found.');
    }
    const { data: sessionId, error: sessionError } = await client.rpc('create_meta_oauth_selection', {
      p_user_id: state.user_id,
      p_organization_id: state.organization_id,
      p_brand_id: state.brand_id,
      p_token_bundle: { accessToken: longToken.access_token, expiresAt },
      p_candidates: candidates,
      p_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
    if (sessionError || !sessionId) throw sessionError ?? new Error('OAUTH_SESSION_EMPTY');
    res.type('html').send(callbackHtml(String(sessionId), validateMetaReturnOrigin(state.return_origin)));
  } catch (err) {
    if (err instanceof MetaApiError) return void res.status(400).send(err.userMessage);
    if (err instanceof z.ZodError) return void res.status(400).send('The connection response is invalid. Start again in Steward.');
    console.error('Meta OAuth callback failed', err instanceof Error ? err.message : 'unknown error');
    res.status(500).send('The Meta connection could not be completed. Return to Steward and try again.');
  }
}

export async function listMetaSelectionsHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  const client = getSupabaseClient();
  if (!userId) return void res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
  if (!client) return void res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Connection storage is unavailable' });
  try {
    const sessionId = z.string().uuid().parse(req.params.id);
    const { data, error } = await client
      .from('oauth_selection_sessions')
      .select('id, organization_id, brand_id, candidates, expires_at')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .is('completed_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    if (error) throw error;
    if (!data) return void res.status(404).json({ code: 'OAUTH_SELECTION_NOT_FOUND', message: 'This account selection expired.' });
    res.json({ session: data });
  } catch (err) {
    oauthError(res, err);
  }
}

export async function completeMetaSelectionHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  const client = getSupabaseClient();
  if (!userId) return void res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
  if (!client) return void res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Connection storage is unavailable' });
  try {
    const sessionId = z.string().uuid().parse(req.params.id);
    const body = z.object({ selectedKeys: z.array(z.string().min(3).max(200)).min(1).max(20) }).parse(req.body);
    const { data: session, error: sessionError } = await client
      .from('oauth_selection_sessions')
      .select('id, organization_id, brand_id, candidates, expires_at')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .is('completed_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    if (sessionError) throw sessionError;
    if (!session) return void res.status(404).json({ code: 'OAUTH_SELECTION_NOT_FOUND', message: 'This account selection expired.' });
    await assertWorkspaceAccess(userId, session.organization_id as string, session.brand_id as string);

    const { data: tokenBundle, error: tokenError } = await client.rpc('read_meta_oauth_selection_token', {
      p_session_id: sessionId,
      p_user_id: userId,
    });
    if (tokenError || !tokenBundle?.accessToken) throw tokenError ?? new Error('OAUTH_TOKEN_EMPTY');
    const pages = await loadManagedPages(String(tokenBundle.accessToken));
    const candidates = safeCandidates(pages);
    const selected = new Set(body.selectedKeys);
    const chosen = candidates.filter((candidate) => selected.has(candidate.key));
    if (chosen.length !== selected.size) return void res.status(400).json({ code: 'INVALID_ACCOUNT_SELECTION', message: 'One or more selected accounts are no longer available.' });

    const connected = [];
    for (const candidate of chosen) {
      const page = pages.find((item) => item.id === candidate.pageId);
      if (!page?.access_token) throw new MetaApiError(190, metaUserMessage(190), 400);
      const { data: account, error } = await client.from('social_accounts').upsert({
        organization_id: session.organization_id,
        brand_id: session.brand_id,
        platform: candidate.platform,
        username: candidate.username ?? candidate.accountName,
        handle: candidate.username ?? candidate.accountName,
        display_name: candidate.accountName,
        avatar_url: candidate.avatarUrl ?? null,
        is_connected: true,
        status: 'connected',
        connection_status: 'connected',
        provider_account_id: candidate.accountId,
        platform_account_id: candidate.accountId,
        auth_provider: 'meta',
        scopes: page.tasks ?? [],
        token_expires_at: tokenBundle.expiresAt ?? null,
        oauth_expires_at: tokenBundle.expiresAt ?? null,
        posting_permissions: { approvalRequired: true },
        metadata: { pageId: candidate.pageId, pageName: candidate.pageName, graphApiVersion: META_VERSION },
        archived_at: null,
      }, { onConflict: 'brand_id,platform,provider_account_id' }).select('id, platform, provider_account_id, display_name, username, status, token_expires_at, scopes').single();
      if (error) throw error;
      const { error: vaultError } = await client.rpc('store_social_token_bundle', {
        p_account_id: account.id,
        p_token_bundle: { accessToken: page.access_token, expiresAt: tokenBundle.expiresAt ?? null },
      });
      if (vaultError) throw vaultError;
      connected.push(account);
    }

    const { error: completeError } = await client.rpc('complete_meta_oauth_selection', {
      p_session_id: sessionId,
      p_user_id: userId,
    });
    if (completeError) throw completeError;
    await logAuditEvent({
      organizationId: session.organization_id as string,
      brandId: session.brand_id as string,
      actorUserId: userId,
      action: 'oauth.meta.connect',
      entityType: 'social_account',
      metadata: { accountIds: connected.map((account) => account.id), platforms: connected.map((account) => account.platform) },
    });
    res.status(201).json({ connections: connected });
  } catch (err) {
    oauthError(res, err);
  }
}

export async function listSocialConnectionsHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  const client = getSupabaseClient();
  if (!userId) return void res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
  if (!client) return void res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Connection storage is unavailable' });
  try {
    const query = z.object({ organizationId: z.string().uuid(), brandId: z.string().uuid().optional() }).parse(req.query);
    await assertWorkspaceAccess(userId, query.organizationId, query.brandId);
    let builder = client.from('social_accounts')
      .select('id, brand_id, platform, provider_account_id, display_name, username, avatar_url, status, connection_status, token_expires_at, scopes, last_sync')
      .eq('organization_id', query.organizationId)
      .is('archived_at', null)
      .in('platform', ['facebook', 'instagram']);
    if (query.brandId) builder = builder.eq('brand_id', query.brandId);
    const { data, error } = await builder.order('created_at', { ascending: true });
    if (error) throw error;
    res.json({
      connections: (data ?? []).map((account) => ({
        id: account.id,
        provider: 'meta',
        brandId: account.brand_id,
        platform: account.platform,
        accountId: account.provider_account_id,
        accountName: account.display_name,
        username: account.username,
        avatarUrl: account.avatar_url,
        status: account.connection_status ?? account.status,
        tokenExpiresAt: account.token_expires_at,
        scopes: account.scopes ?? [],
        lastSyncAt: account.last_sync,
      })),
    });
  } catch (err) {
    oauthError(res, err);
  }
}

export async function disconnectSocialConnectionHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id;
  const client = getSupabaseClient();
  if (!userId) return void res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
  if (!client) return void res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Connection storage is unavailable' });
  try {
    const connectionId = z.string().uuid().parse(req.params.id);
    const organizationId = z.string().uuid().parse(req.query.organizationId ?? req.headers['x-organization-id']);
    await assertWorkspaceAccess(userId, organizationId);
    const { data: account, error } = await client.from('social_accounts')
      .select('id, brand_id, platform')
      .eq('id', connectionId)
      .eq('organization_id', organizationId)
      .maybeSingle();
    if (error) throw error;
    if (!account) return void res.status(404).json({ code: 'CONNECTION_NOT_FOUND', message: 'Connection not found.' });
    const { error: vaultError } = await client.rpc('delete_social_token_bundle', { p_account_id: connectionId });
    if (vaultError) throw vaultError;
    const { error: updateError } = await client.from('social_accounts').update({
      is_connected: false,
      status: 'disconnected',
      connection_status: 'disconnected',
      archived_at: new Date().toISOString(),
    }).eq('id', connectionId);
    if (updateError) throw updateError;
    await logAuditEvent({
      organizationId,
      brandId: account.brand_id as string,
      actorUserId: userId,
      action: 'oauth.meta.disconnect',
      entityType: 'social_account',
      entityId: connectionId,
      metadata: { platform: account.platform },
    });
    res.status(204).send();
  } catch (err) {
    oauthError(res, err);
  }
}
