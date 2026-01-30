/**
 * Steward Backend Shim
 * Express server with WebSocket support for local development
 * Simulates backend API endpoints matching api-services.ts
 */

import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import type { Request as ExpressRequest } from 'express-serve-static-core';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import type { Post, PublishJob, AutopilotSettings, Organization, Campaign, SocialAccount, Asset, HashtagRecommendation, BestTimeToPost, RSSFeed, RSSFeedItem, RecycledPost, TimeZoneOptimization, PostStatus, Platform, Event, AutopilotBrief, StrategyPlan, Brand, GoogleIntegration, GoogleIntegrationPublic, EmailThread, EmailMessage, TriageStatus, BusinessScheduleTemplate, CalendarItem, AutopilotGenerateResponse, AutopilotDraftPost, AutopilotCalendarSuggestion, AutopilotPlanSummary } from './types';
import { defaultOrg, defaultAutopilotSettings, createDefaultBrand } from './seed';
import { setOAuthState, getAndDeleteOAuthState, upsertSocialAccountForSupabase, getSupabaseClient, getInstagramAccountsForIngest, upsertIngestedPost } from './supabase.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer setup for multipart uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_req: ExpressRequest, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}-${file.originalname}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file (requirement: 5-10MB)
  },
});

// In-memory stores
const posts: Map<string, Post> = new Map();
const publishJobs: Map<string, PublishJob> = new Map();
const campaigns: Map<string, Campaign> = new Map();
const socialAccounts: Map<string, SocialAccount> = new Map();
const assets: Map<string, Asset> = new Map();
const rssFeeds: Map<string, RSSFeed> = new Map();
const rssFeedItems: Map<string, RSSFeedItem> = new Map();
const recycledPosts: Map<string, RecycledPost> = new Map();
const events: Map<string, Event> = new Map();
const brands: Map<string, Brand> = new Map();
const autopilotBriefs: Map<string, AutopilotBrief> = new Map();
const googleIntegrations: Map<string, GoogleIntegration> = new Map();
const googleConnections: Map<string, import('./types').GoogleConnection> = new Map(); // For GBP
const emailAccounts: Map<string, import('./types').EmailAccount> = new Map();
const emailTriage: Map<string, TriageStatus> = new Map(); // Key: `${brandId}:${messageId}`
const scheduleTemplates: Map<string, BusinessScheduleTemplate> = new Map();

// Helper to get brand ID from request header
function getBrandIdFromRequest(req: express.Request): string | 'all' {
  const brandId = req.headers['x-brand-id'] as string | undefined;
  if (brandId === 'all') return 'all';
  if (brandId) return brandId;
  // Default to "Primary" brand if no header
  const primaryBrand = Array.from(brands.values()).find(b => b.slug === 'primary');
  return primaryBrand?.id || 'default';
}
// Use seed data for autopilot settings
let autopilotSettings: AutopilotSettings = { ...defaultAutopilotSettings };

// WebSocket clients
const clients: Set<WebSocket> = new Set();

wss.on('connection', (ws: WebSocket) => {
  console.log('WebSocket client connected');
  clients.add(ws);

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error: unknown) => {
    console.error('WebSocket error:', error);
  });
});

// Broadcast to all WebSocket clients
function broadcast(event: { type: string; data: unknown }) {
  const message = JSON.stringify(event);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Helper to generate IDs
function generateId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to safely parse JSON responses (for TypeScript strict mode)
function parseJsonResponse<T = unknown>(data: unknown): T {
  return data as T;
}

// Helper to generate platform-appropriate published URLs
function getPlatformUrl(platform: string, postId: string): string {
  switch (platform) {
    case 'reddit':
      return `https://reddit.com/r/all/comments/${postId}`;
    case 'slack':
      return `https://slack.com/archives/C${postId}`;
    case 'notion':
      return `https://notion.so/${postId}`;
    default:
      return `https://${platform}.com/post/${postId}`;
  }
}

// ============================================================================
// POSTS API
// ============================================================================

// GET /api/posts
app.get('/api/posts', (req, res) => {
  ensureDefaultBrand();
  const brandId = getBrandIdFromRequest(req);
  const { platform, status, campaignId } = req.query;
  let filteredPosts = Array.from(posts.values());
  
  // Filter by brand: if "all", show all; otherwise filter by brandId
  if (brandId !== 'all') {
    filteredPosts = filteredPosts.filter((p) => (p.brandId || 'default') === brandId);
  }

  if (platform) {
    filteredPosts = filteredPosts.filter((p) => p.platform === platform);
  }
  if (status) {
    filteredPosts = filteredPosts.filter((p) => p.status === status);
  }
  if (campaignId) {
    filteredPosts = filteredPosts.filter((p) => p.campaignId === campaignId);
  }

  res.json({
    posts: filteredPosts,
    total: filteredPosts.length,
  });
});

// GET /api/posts/:id
app.get('/api/posts/:id', (req, res) => {
  const post = posts.get(req.params.id);
  if (!post) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Post not found' });
  }
  res.json(post);
});

// POST /api/posts
app.post('/api/posts', (req, res) => {
  ensureDefaultBrand();
  const brandId = getBrandIdFromRequest(req);
  
  // Block creating posts in "all" mode
  if (brandId === 'all') {
    return res.status(400).json({ code: 'BRAND_REQUIRED', message: 'Please select a specific brand to create posts' });
  }
  
  const postData = req.body;
  const post: Post = {
    id: generateId(),
    ...postData,
    brandId: brandId, // Attach current brand
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  posts.set(post.id, post);

  broadcast({ type: 'post_created', data: post });
  res.status(201).json(post);
});

// ============================================================================
// META OAUTH API
// ============================================================================

// POST /api/oauth/meta/start?brandId=...&purpose=facebook|instagram
app.get('/api/oauth/meta/start', async (req, res) => {
  if (!META_APP_ID || !META_APP_SECRET) {
    return res.status(500).json({ 
      code: 'META_NOT_CONFIGURED', 
      message: 'Meta OAuth is not configured. Please set META_APP_ID and META_APP_SECRET environment variables.' 
    });
  }

  const brandId = req.query.brandId as string;
  const purpose = (req.query.purpose as 'facebook' | 'instagram') || 'facebook';
  
  if (!brandId) {
    return res.status(400).json({ code: 'BRAND_ID_REQUIRED', message: 'brandId query parameter is required' });
  }

  const state = generateState();
  const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes
  await setOAuthState(state, { brandId, purpose, provider: 'meta', expiresAt });

  const redirectUri = `${META_OAUTH_REDIRECT_BASE}/api/oauth/meta/callback`;
  
  // Meta OAuth scopes
  const scopes = [
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
    'instagram_basic',
    'instagram_content_publish',
    'business_management',
  ].join(' ');

  const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
  authUrl.searchParams.set('client_id', META_APP_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', state);

  res.json({ authUrl: authUrl.toString(), state, purpose });
});

// GET /api/oauth/meta/callback?code=...&state=...
app.get('/api/oauth/meta/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>OAuth Error</title></head>
        <body>
          <script>
            window.opener.postMessage({ 
              type: 'oauth:complete', 
              provider: 'meta', 
              success: false, 
              error: '${error}' 
            }, window.location.origin);
            window.close();
          </script>
          <p>OAuth error: ${error}</p>
        </body>
      </html>
    `;
    return res.send(errorHtml);
  }

  if (!code || !state) {
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>OAuth Error</title></head>
        <body>
          <script>
            window.opener.postMessage({ 
              type: 'oauth:complete', 
              provider: 'meta', 
              success: false, 
              error: 'Missing code or state' 
            }, window.location.origin);
            window.close();
          </script>
          <p>Missing code or state parameter</p>
        </body>
      </html>
    `;
    return res.send(errorHtml);
  }

  const stateData = await getAndDeleteOAuthState(state as string);
  if (!stateData || stateData.provider !== 'meta') {
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>OAuth Error</title></head>
        <body>
          <script>
            window.opener.postMessage({ 
              type: 'oauth:complete', 
              provider: 'meta', 
              success: false, 
              error: 'Invalid or expired state' 
            }, window.location.origin);
            window.close();
          </script>
          <p>Invalid or expired state</p>
        </body>
      </html>
    `;
    return res.send(errorHtml);
  }

  const { brandId, purpose } = stateData;

  try {
    // Exchange code for tokens
    const redirectUri = `${META_OAUTH_REDIRECT_BASE}/api/oauth/meta/callback`;
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Meta uses query params
    });

    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', META_APP_ID);
    tokenUrl.searchParams.set('client_secret', META_APP_SECRET);
    tokenUrl.searchParams.set('code', code as string);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);

    const tokenRes = await fetch(tokenUrl.toString());

    if (!tokenRes.ok) {
      const errorData = await tokenRes.text();
      throw new Error(`Token exchange failed: ${errorData}`);
    }

    const tokenData = parseJsonResponse<{ access_token?: string; expires_in?: number }>(await tokenRes.json());

    if (!tokenData.access_token) {
      throw new Error('No access token received');
    }

    // Get long-lived token (60 days)
    const longLivedUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token');
    longLivedUrl.searchParams.set('client_id', META_APP_ID);
    longLivedUrl.searchParams.set('client_secret', META_APP_SECRET);
    longLivedUrl.searchParams.set('fb_exchange_token', tokenData.access_token);

    const longLivedRes = await fetch(longLivedUrl.toString());
    const longLivedData = parseJsonResponse<{ access_token?: string; expires_in?: number }>(longLivedRes.ok ? await longLivedRes.json() : tokenData);

    const accessToken = longLivedData.access_token || tokenData.access_token;
    const expiresIn = longLivedData.expires_in || tokenData.expires_in || 5184000; // 60 days default

    // Fetch user/Page info
    const meResponse = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${accessToken}`);
    const meData = parseJsonResponse<{ id?: string; name?: string }>(meResponse.ok ? await meResponse.json() : { id: 'unknown', name: 'Meta Account' });

    // Fetch Pages
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);
    const pagesData = parseJsonResponse<{ data?: Array<{ id: string; name: string; access_token: string }> }>(pagesResponse.ok ? await pagesResponse.json() : { data: [] });

    if (purpose === 'facebook' && pagesData.data && pagesData.data.length > 0) {
      // Create SocialAccount for first Page (or let user select)
      const page = pagesData.data[0];
      
      const existingAccount = Array.from(socialAccounts.values())
        .find(sa => sa.brandId === brandId && sa.platform === 'facebook' && sa.providerAccountId === page.id);

      const account: SocialAccount = {
        id: existingAccount?.id || generateId(),
        brandId,
        platform: 'facebook' as Platform,
        username: page.id,
        displayName: page.name,
        avatarUrl: undefined,
        isConnected: true,
        status: 'connected',
        providerAccountId: page.id,
        oauthToken: {
          accessToken: accessToken,
          refreshToken: accessToken, // Meta uses long-lived tokens, no separate refresh
          expiresAt: new Date(Date.now() + (expiresIn * 1000)),
        },
        organizationId: defaultOrg.id,
        createdAt: existingAccount?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      socialAccounts.set(account.id, account);
      await upsertSocialAccountForSupabase(account, defaultOrg.id);
      broadcast({ type: 'account_created', data: account });

      const successHtml = `
        <!DOCTYPE html>
        <html>
          <head><title>OAuth Success</title></head>
          <body>
            <script>
              window.opener.postMessage({ 
                type: 'oauth:complete', 
                provider: 'meta',
                purpose: 'facebook',
                success: true,
                accountId: '${account.id}',
                platform: 'facebook'
              }, window.location.origin);
              window.close();
            </script>
            <p>Facebook Page connected successfully! You can close this window.</p>
          </body>
        </html>
      `;
      return res.send(successHtml);
    } else if (purpose === 'instagram' && pagesData.data && pagesData.data.length > 0) {
      // For Instagram, need to get IG Business Account linked to Page
      const page = pagesData.data[0];
      const igAccountResponse = await fetch(`https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${accessToken}`);
      const igAccountData = parseJsonResponse<{ instagram_business_account?: { id: string } }>(igAccountResponse.ok ? await igAccountResponse.json() : {});

      if (igAccountData.instagram_business_account) {
        const igAccountId = igAccountData.instagram_business_account.id;
        
        // Fetch IG account info
        const igInfoResponse = await fetch(`https://graph.facebook.com/v18.0/${igAccountId}?fields=username,profile_picture_url&access_token=${accessToken}`);
        const igInfo = parseJsonResponse<{ username?: string; profile_picture_url?: string }>(igInfoResponse.ok ? await igInfoResponse.json() : { username: 'instagram_account', profile_picture_url: undefined });

        const existingAccount = Array.from(socialAccounts.values())
          .find(sa => sa.brandId === brandId && sa.platform === 'instagram' && sa.providerAccountId === igAccountId);

        const account: SocialAccount = {
          id: existingAccount?.id || generateId(),
          brandId,
          platform: 'instagram' as Platform,
          username: igInfo.username || igAccountId,
          displayName: igInfo.username || 'Instagram Account',
          avatarUrl: igInfo.profile_picture_url,
          isConnected: true,
          status: 'connected',
          providerAccountId: igAccountId,
          oauthToken: {
            accessToken: accessToken,
            refreshToken: accessToken,
            expiresAt: new Date(Date.now() + (expiresIn * 1000)),
          },
          organizationId: defaultOrg.id,
          createdAt: existingAccount?.createdAt || new Date(),
          updatedAt: new Date(),
        };

        socialAccounts.set(account.id, account);
        await upsertSocialAccountForSupabase(account, defaultOrg.id);
        broadcast({ type: 'account_created', data: account });

        const successHtml = `
          <!DOCTYPE html>
          <html>
            <head><title>OAuth Success</title></head>
            <body>
              <script>
                window.opener.postMessage({ 
                  type: 'oauth:complete', 
                  provider: 'meta',
                  purpose: 'instagram',
                  success: true,
                  accountId: '${account.id}',
                  platform: 'instagram'
                }, window.location.origin);
                window.close();
              </script>
              <p>Instagram Business Account connected successfully! You can close this window.</p>
            </body>
          </html>
        `;
        return res.send(successHtml);
      } else {
        throw new Error('No Instagram Business Account linked to this Facebook Page');
      }
    } else {
      throw new Error('No Pages found. Please ensure your Facebook account has at least one Page.');
    }
  } catch (error) {
    console.error('Meta OAuth callback error:', error);
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>OAuth Error</title></head>
        <body>
          <script>
            window.opener.postMessage({ 
              type: 'oauth:complete', 
              provider: 'meta', 
              success: false, 
              error: '${error instanceof Error ? error.message : 'Unknown error'}' 
            }, window.location.origin);
            window.close();
          </script>
          <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
        </body>
      </html>
    `;
    res.send(errorHtml);
  }
});

// PATCH /api/posts/:id
app.patch('/api/posts/:id', (req, res) => {
  const post = posts.get(req.params.id);
  if (!post) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Post not found' });
  }

  const updated = { ...post, ...req.body, updatedAt: new Date() };
  posts.set(req.params.id, updated);

  broadcast({ type: 'post_updated', data: updated });
  res.json(updated);
});

// DELETE /api/posts/:id
app.delete('/api/posts/:id', (req, res) => {
  if (!posts.has(req.params.id)) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Post not found' });
  }
  posts.delete(req.params.id);
  res.status(204).send();
});

// POST /api/posts/bulk
app.post('/api/posts/bulk', (req, res) => {
  ensureDefaultBrand();
  const brandId = getBrandIdFromRequest(req);
  
  // Block creating posts in "all" mode
  if (brandId === 'all') {
    return res.status(400).json({ code: 'BRAND_REQUIRED', message: 'Please select a specific brand to create posts' });
  }
  
  const { posts: postsData } = req.body;
  
  if (!Array.isArray(postsData)) {
    return res.status(400).json({ code: 'INVALID_REQUEST', message: 'Expected array of posts' });
  }

  const results: Array<{ success: boolean; post?: Post; error?: string; index: number }> = [];
  
  postsData.forEach((postData: Partial<Post>, index: number) => {
    try {
      // Validate required fields
      if (!postData.content || !postData.platform) {
        results.push({ success: false, error: 'Missing required fields: content and platform', index });
        return;
      }

      // Determine status based on scheduledTime
      const hasScheduledTime = postData.scheduledTime;
      const status: PostStatus = hasScheduledTime ? 'scheduled' : (postData.status || 'draft');

      const post: Post = {
        id: generateId(),
        content: postData.content,
        platform: postData.platform as Platform,
        status,
        scheduledTime: postData.scheduledTime ? new Date(postData.scheduledTime) : undefined,
        publishedTime: postData.publishedTime ? new Date(postData.publishedTime) : undefined,
        publishedId: postData.publishedId,
        campaignId: postData.campaignId,
        authorId: postData.authorId || 'user1',
        brandId: brandId, // Attach current brand
        mediaUrls: postData.mediaUrls,
        hashtags: postData.hashtags,
        metrics: postData.metrics,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      posts.set(post.id, post);
      broadcast({ type: 'post_created', data: post });
      results.push({ success: true, post, index });
    } catch (error) {
      results.push({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        index 
      });
    }
  });

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  res.status(200).json({
    results,
    summary: {
      total: postsData.length,
      successful,
      failed,
    },
  });
});

// POST /api/posts/:id/approve
app.post('/api/posts/:id/approve', (req, res) => {
  const post = posts.get(req.params.id);
  if (!post) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Post not found' });
  }

  const updated = { ...post, status: 'approved' as const, updatedAt: new Date() };
  posts.set(req.params.id, updated);

  broadcast({ type: 'post_updated', data: updated });
  res.json(updated);
});

// POST /api/posts/:id/publish
app.post('/api/posts/:id/publish', (req, res) => {
  ensureDefaultBrand();
  const brandId = getBrandIdFromRequest(req);
  
  // Block publishing in "all" mode
  if (brandId === 'all') {
    return res.status(400).json({ code: 'BRAND_REQUIRED', message: 'Please select a specific brand to publish posts' });
  }
  
  const post = posts.get(req.params.id);
  if (!post) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Post not found' });
  }

  // NOTE: For MCP-based platforms (reddit, slack, notion), in production this would:
  // 1. Call the MCP API endpoint (/execute-mcp/v2) with appropriate tool
  // 2. Handle authentication via organization's MCP credentials
  // 3. Process the response and extract published post ID/URL
  // Currently, this is a development shim that simulates the publish workflow

  // Create a publish job
  const job: PublishJob = {
    id: generateId(),
    organizationId: defaultOrg.id,
    connectionId: 'conn1',
    platform: post.platform,
    postContent: {
      text: post.content,
      hashtags: post.hashtags || [],
    },
    status: 'queued',
    priority: 5,
    scheduledAt: new Date(),
    attemptCount: 0,
    maxAttempts: 5,
    retryBackoffMs: 1000,
    brandId: brandId, // Attach current brand
    createdAt: new Date(),
    createdByUserId: post.authorId,
    updatedAt: new Date(),
  };

  publishJobs.set(job.id, job);

  // Simulate job lifecycle
  setTimeout(() => {
    const updatedJob = { ...job, status: 'processing' as const, processedAt: new Date(), updatedAt: new Date() };
    publishJobs.set(job.id, updatedJob);
    broadcast({ type: 'publish_job_updated', data: updatedJob });
  }, 2000);

  setTimeout(() => {
    const postId = generateId();
    const completedJob = {
      ...job,
      status: 'completed' as const,
      processedAt: new Date(),
      completedAt: new Date(),
      publishedPostId: `external_${postId}`,
      publishedUrl: getPlatformUrl(post.platform, postId),
      updatedAt: new Date(),
    };
    publishJobs.set(job.id, completedJob);
    broadcast({ type: 'publish_job_updated', data: completedJob });

    // Update post status
    const updatedPost = { ...post, status: 'published' as const, publishedTime: new Date(), updatedAt: new Date() };
    posts.set(post.id, updatedPost);
    broadcast({ type: 'post_published', data: updatedPost });
  }, 4000);

  broadcast({ type: 'publish_job_updated', data: job });
  res.json(job);
});

// ============================================================================
// PUBLISH JOBS API
// ============================================================================

// GET /api/publish-jobs
app.get('/api/publish-jobs', (req, res) => {
  ensureDefaultBrand();
  const brandId = getBrandIdFromRequest(req);
  const { organizationId, status } = req.query;
  let filteredJobs = Array.from(publishJobs.values());
  
  // Filter by brand: if "all", show all; otherwise filter by brandId
  if (brandId !== 'all') {
    filteredJobs = filteredJobs.filter((j) => (j.brandId || 'default') === brandId);
  }

  if (organizationId) {
    filteredJobs = filteredJobs.filter((j) => j.organizationId === organizationId);
  }
  if (status) {
    filteredJobs = filteredJobs.filter((j) => j.status === status);
  }

  res.json({
    jobs: filteredJobs,
    total: filteredJobs.length,
  });
});

// GET /api/publish-jobs/:id
app.get('/api/publish-jobs/:id', (req, res) => {
  const job = publishJobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Publish job not found' });
  }
  res.json(job);
});

// POST /api/publish-jobs
app.post('/api/publish-jobs', (req, res) => {
  const jobData = req.body;
  const job: PublishJob = {
    id: generateId(),
    ...jobData,
    createdAt: new Date(),
    updatedAt: new Date(),
    attemptCount: jobData.attemptCount || 0,
  };
  publishJobs.set(job.id, job);

  // Simulate job lifecycle
  setTimeout(() => {
    const updatedJob = { ...job, status: 'processing' as const, processedAt: new Date(), updatedAt: new Date() };
    publishJobs.set(job.id, updatedJob);
    broadcast({ type: 'publish_job_updated', data: updatedJob });
  }, 2000);

  setTimeout(() => {
    const postId = generateId();
    const completedJob = {
      ...job,
      status: 'completed' as const,
      processedAt: new Date(),
      completedAt: new Date(),
      publishedPostId: `external_${postId}`,
      publishedUrl: getPlatformUrl(job.platform, postId),
      updatedAt: new Date(),
    };
    publishJobs.set(job.id, completedJob);
    broadcast({ type: 'publish_job_updated', data: completedJob });
  }, 4000);

  broadcast({ type: 'publish_job_updated', data: job });
  res.status(201).json(job);
});

// PATCH /api/publish-jobs/:id
app.patch('/api/publish-jobs/:id', (req, res) => {
  const job = publishJobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Publish job not found' });
  }

  const updated = { ...job, ...req.body, updatedAt: new Date() };
  publishJobs.set(req.params.id, updated);

  broadcast({ type: 'publish_job_updated', data: updated });
  res.json(updated);
});

// POST /api/publish-jobs/:id/retry
app.post('/api/publish-jobs/:id/retry', (req, res) => {
  const job = publishJobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Publish job not found' });
  }

  const retried = {
    ...job,
    status: 'queued' as const,
    attemptCount: 0,
    errorCode: undefined,
    errorMessage: undefined,
    updatedAt: new Date(),
  };
  publishJobs.set(req.params.id, retried);

  broadcast({ type: 'publish_job_updated', data: retried });
  res.json(retried);
});

// ============================================================================
// AUTOPILOT API
// ============================================================================

// GET /api/autopilot
app.get('/api/autopilot', (req, res) => {
  res.json(autopilotSettings);
});

// PUT /api/autopilot
app.put('/api/autopilot', (req, res) => {
  autopilotSettings = { ...autopilotSettings, ...req.body };
  res.json(autopilotSettings);
});

// ============================================================================
// ORGANIZATIONS API
// ============================================================================

// GET /api/organizations/me
app.get('/api/organizations/me', (req, res) => {
  res.json(defaultOrg);
});

// GET /api/organizations
app.get('/api/organizations', (req, res) => {
  res.json({ organizations: [defaultOrg] });
});

// ============================================================================
// CAMPAIGNS API
// ============================================================================

// GET /api/campaigns
app.get('/api/campaigns', (req, res) => {
  const { status } = req.query;
  let filteredCampaigns = Array.from(campaigns.values());

  if (status) {
    filteredCampaigns = filteredCampaigns.filter((c) => c.status === status);
  }

  res.json({
    campaigns: filteredCampaigns,
    total: filteredCampaigns.length,
  });
});

// GET /api/campaigns/:id
app.get('/api/campaigns/:id', (req, res) => {
  const campaign = campaigns.get(req.params.id);
  if (!campaign) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Campaign not found' });
  }
  res.json(campaign);
});

// POST /api/campaigns
app.post('/api/campaigns', (req, res) => {
  const campaignData = req.body;
  const campaign: Campaign = {
    id: generateId(),
    name: campaignData.name,
    description: campaignData.description,
    startDate: campaignData.startDate ? new Date(campaignData.startDate) : undefined,
    endDate: campaignData.endDate ? new Date(campaignData.endDate) : undefined,
    goal: campaignData.goal,
    postCount: 0,
    totalEngagement: 0,
    status: campaignData.status || 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  campaigns.set(campaign.id, campaign);

  broadcast({ type: 'campaign_created', data: campaign });
  res.status(201).json(campaign);
});

// PATCH /api/campaigns/:id
app.patch('/api/campaigns/:id', (req, res) => {
  const campaign = campaigns.get(req.params.id);
  if (!campaign) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Campaign not found' });
  }

  const updated = {
    ...campaign,
    ...req.body,
    startDate: req.body.startDate ? new Date(req.body.startDate) : campaign.startDate,
    endDate: req.body.endDate ? new Date(req.body.endDate) : campaign.endDate,
    updatedAt: new Date(),
  };
  campaigns.set(req.params.id, updated);

  broadcast({ type: 'campaign_updated', data: updated });
  res.json(updated);
});

// DELETE /api/campaigns/:id
app.delete('/api/campaigns/:id', (req, res) => {
  const campaign = campaigns.get(req.params.id);
  if (!campaign) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Campaign not found' });
  }
  campaigns.delete(req.params.id);

  broadcast({ type: 'campaign_deleted', data: { id: req.params.id } });
  res.status(204).send();
});

// ============================================================================
// SOCIAL ACCOUNTS API
// ============================================================================

// GET /api/social-accounts
app.get('/api/social-accounts', (req, res) => {
  ensureDefaultBrand();
  const brandId = getBrandIdFromRequest(req);
  const { platform, isConnected } = req.query;
  let filteredAccounts = Array.from(socialAccounts.values());
  
  // Filter by brand: if "all", show all; otherwise filter by brandId
  if (brandId !== 'all') {
    filteredAccounts = filteredAccounts.filter((a) => (a.brandId || 'default') === brandId);
  }

  if (platform) {
    filteredAccounts = filteredAccounts.filter((a) => a.platform === platform);
  }
  if (isConnected !== undefined) {
    filteredAccounts = filteredAccounts.filter((a) => a.isConnected === (isConnected === 'true'));
  }

  res.json({ accounts: filteredAccounts });
});

// GET /api/social-accounts/:id
app.get('/api/social-accounts/:id', (req, res) => {
  const account = socialAccounts.get(req.params.id);
  if (!account) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Social account not found' });
  }
  res.json(account);
});

// POST /api/social-accounts
app.post('/api/social-accounts', (req, res) => {
  ensureDefaultBrand();
  const brandId = getBrandIdFromRequest(req);
  
  // Block creating accounts in "all" mode
  if (brandId === 'all') {
    return res.status(400).json({ code: 'BRAND_REQUIRED', message: 'Please select a specific brand to create social accounts' });
  }
  
  const { platform, username, displayName, avatarUrl, status } = req.body;
  
  if (!platform || !username) {
    return res.status(400).json({ code: 'INVALID_REQUEST', message: 'Platform and username are required' });
  }

  // Only allow social platforms (not slack/notion for connections)
  const socialPlatforms: Platform[] = ['facebook', 'instagram', 'linkedin', 'tiktok', 'pinterest', 'reddit'];
  if (!socialPlatforms.includes(platform as Platform)) {
    return res.status(400).json({ code: 'INVALID_PLATFORM', message: 'Only social platforms can be connected as accounts' });
  }

  const account: SocialAccount = {
    id: generateId(),
    brandId: brandId,
    platform: platform as Platform,
    username,
    displayName: displayName || username,
    avatarUrl,
    isConnected: status === 'connected',
    status: (status || 'stub') as 'connected' | 'disconnected' | 'stub',
    organizationId: defaultOrg.id,
    followerCount: status === 'stub' ? undefined : Math.floor(Math.random() * 10000),
    lastSync: status === 'stub' ? undefined : new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  socialAccounts.set(account.id, account);
  broadcast({ type: 'account_created', data: account });
  res.status(201).json(account);
});

// POST /api/social-accounts/:id/sync
app.post('/api/social-accounts/:id/sync', (req, res) => {
  const account = socialAccounts.get(req.params.id);
  if (!account) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Social account not found' });
  }

  // Simulate sync - update lastSync and potentially follower count
  const updated: SocialAccount = {
    ...account,
    lastSync: new Date(),
    followerCount: account.followerCount ? account.followerCount + Math.floor(Math.random() * 100) : Math.floor(Math.random() * 10000),
    updatedAt: new Date(),
  };
  socialAccounts.set(req.params.id, updated);

  broadcast({ type: 'account_synced', data: updated });
  res.json(updated);
});

// DELETE /api/social-accounts/:id
app.delete('/api/social-accounts/:id', (req, res) => {
  ensureDefaultBrand();
  const brandId = getBrandIdFromRequest(req);
  
  const account = socialAccounts.get(req.params.id);
  if (!account) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Social account not found' });
  }

  // Verify brand ownership
  if (brandId !== 'all' && (account.brandId || 'default') !== brandId) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Account belongs to a different brand' });
  }

  socialAccounts.delete(req.params.id);
  broadcast({ type: 'account_deleted', data: { id: req.params.id } });
  res.status(204).send();
});

// GET /api/conversations
app.get('/api/conversations', (req, res) => {
  res.json({ conversations: [], total: 0 });
});

// GET /api/alerts
app.get('/api/alerts', (req, res) => {
  res.json({ alerts: [] });
});

// ============================================================================
// ASSETS API
// ============================================================================

// Helper to infer asset type from mime
function inferAssetType(mimeType?: string): 'image' | 'video' | 'template' | 'hashtags' {
  if (!mimeType) return 'image';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'image';
}

// GET /api/assets
app.get('/api/assets', (req, res) => {
  const { type, search, tags } = req.query;
  const brandId = getBrandIdFromRequest(req);
  let filteredAssets = Array.from(assets.values());

  // Brand scoping (allow all to view everything)
  if (brandId !== 'all') {
    filteredAssets = filteredAssets.filter((a) => !a.brandId || a.brandId === brandId);
  }

  if (type) {
    filteredAssets = filteredAssets.filter((a) => a.type === type);
  }
  if (tags) {
    // Handle comma-separated tags from query string
    const tagArray = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : (Array.isArray(tags) ? tags : [tags]);
    filteredAssets = filteredAssets.filter((a) => 
      a.tags && tagArray.some((tag) => a.tags?.includes(tag as string))
    );
  }
  if (search) {
    const searchLower = (search as string).toLowerCase();
    filteredAssets = filteredAssets.filter((a) =>
      a.url?.toLowerCase().includes(searchLower) ||
      a.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  }

  res.json({
    assets: filteredAssets,
    total: filteredAssets.length,
  });
});

// GET /api/assets/:id
app.get('/api/assets/:id', (req, res) => {
  const asset = assets.get(req.params.id);
  if (!asset) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Asset not found' });
  }
  res.json(asset);
});

// POST /api/assets (JSON body) - legacy URL uploads
app.post('/api/assets', (req, res) => {
  const brandId = getBrandIdFromRequest(req);
  if (brandId === 'all') {
    return res.status(400).json({ code: 'VIEW_ONLY', message: 'Select a brand to upload assets.' });
  }

  const assetData = req.body;
  const asset: Asset = {
    id: generateId(),
    ...assetData,
    brandId,
    organizationId: assetData.organizationId || defaultOrg.id,
    version: assetData.version || '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  assets.set(asset.id, asset);

  broadcast({ type: 'asset_created', data: asset });
  res.status(201).json(asset);
});

// POST /api/assets/upload (multipart)
app.post('/api/assets/upload', (req, res, next) => {
  const brandId = getBrandIdFromRequest(req);
  if (brandId === 'all') {
    return res.status(400).json({ code: 'VIEW_ONLY', message: 'Select a brand to upload assets.' });
  }
  upload.array('files')(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: 'File too large. Max is 10 MB.' });
      }
      return next(err);
    }

    const files = ((req as ExpressRequest & { files?: Express.Multer.File[] }).files) || [];
    if (files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const tagsRaw = Array.isArray((req.body as any).tags)
      ? (req.body as any).tags.join(',')
      : (req.body as any).tags;
    const parsedTags = typeof tagsRaw === 'string'
      ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
      : undefined;

    const newAssets: Asset[] = files.map((file) => {
      const urlPath = `/uploads/${file.filename}`;
      const asset: Asset = {
        id: generateId(),
        type: inferAssetType(file.mimetype),
        url: urlPath,
        brandId,
        organizationId: defaultOrg.id,
        version: '1.0.0',
        tags: parsedTags,
        metadata: {
          size: file.size,
          mimeType: file.mimetype,
          filename: file.originalname,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      assets.set(asset.id, asset);
      return asset;
    });

    newAssets.forEach((asset) => {
      broadcast({ type: 'asset_created', data: asset });
    });
    res.status(201).json({ assets: newAssets });
  });
});

// PATCH /api/assets/:id
app.patch('/api/assets/:id', (req, res) => {
  const asset = assets.get(req.params.id);
  if (!asset) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Asset not found' });
  }

  const updated = { ...asset, ...req.body, updatedAt: new Date() };
  assets.set(req.params.id, updated);

  broadcast({ type: 'asset_updated', data: updated });
  res.json(updated);
});

// DELETE /api/assets/:id
app.delete('/api/assets/:id', (req, res) => {
  if (!assets.has(req.params.id)) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Asset not found' });
  }
  assets.delete(req.params.id);

  broadcast({ type: 'asset_deleted', data: { id: req.params.id } });
  res.status(204).send();
});

// GET /api/organizations/:id/quota/usage
app.get('/api/organizations/:id/quota/usage', (req, res) => {
  res.json({ usage: [] });
});

// GET /api/organizations/:id/autopilot/brand-profile
app.get('/api/organizations/:id/autopilot/brand-profile', (req, res) => {
  res.json({
    brandName: '',
    brandVoice: '',
    targetAudience: '',
    keyMessages: [],
    brandGuidelines: '',
  });
});

// GET /api/organizations/:id/autopilot/settings
app.get('/api/organizations/:id/autopilot/settings', (req, res) => {
  res.json(autopilotSettings);
});

// PATCH /api/organizations/:id/autopilot/settings
app.patch('/api/organizations/:id/autopilot/settings', (req, res) => {
  autopilotSettings = { ...autopilotSettings, ...req.body };
  res.json(autopilotSettings);
});

// GET /api/organizations/:id/autopilot/slots
app.get('/api/organizations/:id/autopilot/slots', (req, res) => {
  res.json({ slots: [] });
});

// ============================================================================
// HASHTAG RECOMMENDATIONS API
// ============================================================================

// GET /api/hashtags/recommendations
app.get('/api/hashtags/recommendations', (req, res) => {
  const { content, platform } = req.query;
  
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ code: 'INVALID_REQUEST', message: 'Content parameter is required' });
  }

  // Simple hashtag recommendation algorithm
  const contentLower = content.toLowerCase();
  const recommendations: HashtagRecommendation[] = [];
  
  // Extract keywords from content
  const keywords = contentLower
    .split(/\s+/)
    .filter(word => word.length > 3)
    .slice(0, 10);
  
  // Generate hashtag suggestions based on keywords and platform
  const platformHashtags: Record<string, string[]> = {
    instagram: ['#instagood', '#photooftheday', '#instadaily', '#picoftheday', '#beautiful', '#fashion', '#style', '#love', '#art', '#photography'],
    twitter: ['#trending', '#news', '#tech', '#business', '#startup', '#innovation', '#marketing', '#socialmedia', '#digital', '#content'],
    linkedin: ['#leadership', '#business', '#career', '#networking', '#professional', '#innovation', '#entrepreneurship', '#success', '#growth', '#strategy'],
    facebook: ['#community', '#friends', '#family', '#life', '#love', '#happy', '#blessed', '#grateful', '#memories', '#fun'],
    tiktok: ['#fyp', '#foryou', '#viral', '#trending', '#comedy', '#dance', '#music', '#funny', '#entertainment', '#challenge'],
    pinterest: ['#diy', '#crafts', '#home', '#decor', '#recipe', '#food', '#fashion', '#style', '#beauty', '#inspiration'],
  };

  // Add platform-specific hashtags
  if (platform && platformHashtags[platform as string]) {
    platformHashtags[platform as string].forEach((tag, index) => {
      recommendations.push({
        hashtag: tag,
        relevance: 0.8 - (index * 0.05),
        category: 'platform',
        popularity: 0.7 + (Math.random() * 0.3),
      });
    });
  }

  // Add keyword-based hashtags
  keywords.forEach((keyword, index) => {
    if (keyword.length > 3) {
      recommendations.push({
        hashtag: `#${keyword}`,
        relevance: 0.9 - (index * 0.1),
        category: 'keyword',
        popularity: 0.5 + (Math.random() * 0.3),
      });
    }
  });

  // Sort by relevance
  recommendations.sort((a, b) => b.relevance - a.relevance);

  res.json({
    recommendations: recommendations.slice(0, 20),
    total: recommendations.length,
  });
});

// ============================================================================
// RSS FEED IMPORT API
// ============================================================================

// GET /api/rss-feeds
app.get('/api/rss-feeds', (req, res) => {
  const feeds = Array.from(rssFeeds.values());
  res.json({ feeds, total: feeds.length });
});

// GET /api/rss-feeds/:id
app.get('/api/rss-feeds/:id', (req, res) => {
  const feed = rssFeeds.get(req.params.id);
  if (!feed) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'RSS feed not found' });
  }
  res.json(feed);
});

// POST /api/rss-feeds
app.post('/api/rss-feeds', (req, res) => {
  const { name, url, platform, autoImport, tags } = req.body;
  
  if (!name || !url || !platform) {
    return res.status(400).json({ code: 'INVALID_REQUEST', message: 'Name, URL, and platform are required' });
  }

  const feed: RSSFeed = {
    id: generateId(),
    name,
    url,
    platform,
    autoImport: autoImport || false,
    tags: tags || [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  rssFeeds.set(feed.id, feed);
  broadcast({ type: 'rss_feed_created', data: feed });
  res.status(201).json(feed);
});

// PATCH /api/rss-feeds/:id
app.patch('/api/rss-feeds/:id', (req, res) => {
  const feed = rssFeeds.get(req.params.id);
  if (!feed) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'RSS feed not found' });
  }

  const updated = { ...feed, ...req.body, updatedAt: new Date() };
  rssFeeds.set(req.params.id, updated);
  broadcast({ type: 'rss_feed_updated', data: updated });
  res.json(updated);
});

// DELETE /api/rss-feeds/:id
app.delete('/api/rss-feeds/:id', (req, res) => {
  const feed = rssFeeds.get(req.params.id);
  if (!feed) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'RSS feed not found' });
  }

  rssFeeds.delete(req.params.id);
  // Delete associated feed items
  Array.from(rssFeedItems.values())
    .filter(item => item.feedId === req.params.id)
    .forEach(item => rssFeedItems.delete(item.id));
  
  broadcast({ type: 'rss_feed_deleted', data: { id: req.params.id } });
  res.status(204).send();
});

// POST /api/rss-feeds/:id/import
app.post('/api/rss-feeds/:id/import', (req, res) => {
  const feed = rssFeeds.get(req.params.id);
  if (!feed) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'RSS feed not found' });
  }

  // Simulate RSS feed parsing
  const mockItems: RSSFeedItem[] = [
    {
      id: generateId(),
      feedId: feed.id,
      title: 'Sample RSS Item 1',
      description: 'This is a sample RSS feed item description.',
      link: 'https://example.com/article1',
      publishedAt: new Date(),
      author: 'Sample Author',
      categories: ['news', 'tech'],
      imported: false,
      createdAt: new Date(),
    },
    {
      id: generateId(),
      feedId: feed.id,
      title: 'Sample RSS Item 2',
      description: 'Another sample RSS feed item.',
      link: 'https://example.com/article2',
      publishedAt: new Date(Date.now() - 86400000),
      categories: ['business'],
      imported: false,
      createdAt: new Date(),
    },
  ];

  mockItems.forEach(item => {
    rssFeedItems.set(item.id, item);
  });

  const updatedFeed = { ...feed, lastFetched: new Date(), lastItemCount: mockItems.length, updatedAt: new Date() };
  rssFeeds.set(feed.id, updatedFeed);

  broadcast({ type: 'rss_feed_imported', data: { feedId: feed.id, items: mockItems } });
  res.json({ items: mockItems, count: mockItems.length });
});

// GET /api/rss-feeds/:id/items
app.get('/api/rss-feeds/:id/items', (req, res) => {
  const items = Array.from(rssFeedItems.values()).filter(item => item.feedId === req.params.id);
  res.json({ items, total: items.length });
});

// ============================================================================
// BEST TIME TO POST API
// ============================================================================

// GET /api/analytics/best-time-to-post
app.get('/api/analytics/best-time-to-post', (req, res) => {
  const { platform } = req.query;
  
  const bestTimes: BestTimeToPost[] = [];
  const platforms = platform ? [platform as string] : ['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok'];
  
  platforms.forEach((p) => {
    const optimalHours = [9, 10, 11, 13, 14, 15, 16, 17];
    const optimalDays = [1, 2, 3, 4, 5];
    
    optimalDays.forEach((day) => {
      optimalHours.forEach((hour) => {
        bestTimes.push({
          platform: p as Platform,
          dayOfWeek: day,
          hour,
          score: 0.6 + (Math.random() * 0.4),
          engagementRate: 0.05 + (Math.random() * 0.1),
        });
      });
    });
  });

  bestTimes.sort((a, b) => b.score - a.score);

  res.json({
    bestTimes: bestTimes.slice(0, 50),
    total: bestTimes.length,
  });
});

// ============================================================================
// TIME ZONE OPTIMIZATION API
// ============================================================================

// GET /api/scheduling/timezone-optimization
app.get('/api/scheduling/timezone-optimization', (req, res) => {
  const { platform, timezone, audienceTimezone } = req.query;
  
  if (!platform || !timezone) {
    return res.status(400).json({ code: 'INVALID_REQUEST', message: 'Platform and timezone are required' });
  }

  const optimalTimes: Array<{ dayOfWeek: number; hour: number; score: number }> = [];
  const targetTimezone = (typeof audienceTimezone === 'string' ? audienceTimezone : undefined) || (typeof timezone === 'string' ? timezone : 'UTC');
  
  for (let day = 1; day <= 5; day++) {
    for (let hour = 9; hour <= 17; hour++) {
      optimalTimes.push({
        dayOfWeek: day,
        hour,
        score: 0.7 + (Math.random() * 0.3),
      });
    }
  }

  optimalTimes.sort((a, b) => b.score - a.score);

  const optimization: TimeZoneOptimization = {
    platform: platform as Platform,
    timezone: typeof timezone === 'string' ? timezone : 'UTC',
    optimalTimes: optimalTimes.slice(0, 20),
    audienceTimezone: typeof audienceTimezone === 'string' ? audienceTimezone : undefined,
    recommendedSchedule: optimalTimes.slice(0, 5).map(opt => {
      const date = new Date();
      const dayDiff = opt.dayOfWeek - date.getDay();
      date.setDate(date.getDate() + (dayDiff > 0 ? dayDiff : dayDiff + 7));
      date.setHours(opt.hour, 0, 0, 0);
      return date;
    }),
  };

  res.json(optimization);
});

// ============================================================================
// CONTENT RECYCLING API
// ============================================================================

// POST /api/posts/:id/recycle
app.post('/api/posts/:id/recycle', (req, res) => {
  const post = posts.get(req.params.id);
  if (!post) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Post not found' });
  }

  if (post.status !== 'published') {
    return res.status(400).json({ code: 'INVALID_REQUEST', message: 'Only published posts can be recycled' });
  }

  const existingRecycled = Array.from(recycledPosts.values())
    .find(rp => rp.originalPostId === post.id);
  
  const recycleCount = existingRecycled ? existingRecycled.recycleCount + 1 : 1;

  const recycledPost: RecycledPost = {
    id: existingRecycled?.id || generateId(),
    originalPostId: post.id,
    content: post.content,
    platform: post.platform,
    recycleCount,
    lastRecycledAt: new Date(),
    createdAt: existingRecycled?.createdAt || new Date(),
    updatedAt: new Date(),
  };

  recycledPosts.set(recycledPost.id, recycledPost);

  const newPost: Post = {
    id: generateId(),
    content: post.content,
    platform: post.platform,
    status: 'draft',
    authorId: post.authorId,
    campaignId: post.campaignId,
    hashtags: post.hashtags,
    mediaUrls: post.mediaUrls,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  posts.set(newPost.id, newPost);
  broadcast({ type: 'post_recycled', data: { recycledPost, newPost } });
  
  res.json({
    recycledPost,
    newPost,
    recycleCount,
  });
});

// GET /api/posts/recycled
app.get('/api/posts/recycled', (req, res) => {
  const recycled = Array.from(recycledPosts.values());
  res.json({ recycledPosts: recycled, total: recycled.length });
});

// ============================================================================
// EVENTS API
// ============================================================================

// POST /api/events
app.post('/api/events', (req, res) => {
  ensureDefaultBrand();
  const brandId = getBrandIdFromRequest(req);
  
  // Block creating events in "all" mode
  if (brandId === 'all') {
    return res.status(400).json({ code: 'BRAND_REQUIRED', message: 'Please select a specific brand to create events' });
  }
  
  const { title, eventDate, postWhen, notes, assetIds } = req.body;
  
  if (!title || !eventDate) {
    return res.status(400).json({ code: 'INVALID_REQUEST', message: 'Title and eventDate are required' });
  }

  const event: Event = {
    id: generateId(),
    title,
    eventDate,
    postWhen: postWhen || 'same-day',
    notes: notes || '',
    assetIds: assetIds || [],
    organizationId: defaultOrg.id,
    brandId: brandId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  events.set(event.id, event);
  broadcast({ type: 'event_created', data: event });
  res.status(201).json(event);
});

// GET /api/events
app.get('/api/events', (req, res) => {
  ensureDefaultBrand();
  const brandId = getBrandIdFromRequest(req);
  const { from, to } = req.query;
  let filteredEvents = Array.from(events.values());
  
  // Filter by brand: if "all", show all; otherwise filter by brandId
  if (brandId !== 'all') {
    filteredEvents = filteredEvents.filter((e) => (e.brandId || 'default') === brandId);
  }

  if (from) {
    filteredEvents = filteredEvents.filter((e) => e.eventDate >= (from as string));
  }
  if (to) {
    filteredEvents = filteredEvents.filter((e) => e.eventDate <= (to as string));
  }

  res.json({
    events: filteredEvents,
    total: filteredEvents.length,
  });
});

// GET /api/events/:id
app.get('/api/events/:id', (req, res) => {
  const event = events.get(req.params.id);
  if (!event) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Event not found' });
  }
  res.json(event);
});

// POST /api/events/:id/generate-drafts
app.post('/api/events/:id/generate-drafts', (req, res) => {
  const event = events.get(req.params.id);
  if (!event) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Event not found' });
  }

  // Load brief to use for draft generation (for current brand)
  ensureDefaultBrand();
  const brandId = getBrandIdFromRequest(req);
  
  // Block generating drafts in "all" mode
  if (brandId === 'all') {
    return res.status(400).json({ code: 'BRAND_REQUIRED', message: 'Please select a specific brand to generate drafts' });
  }
  
  const brief = autopilotBriefs.get(brandId);

  // Calculate scheduled time based on postWhen
  let scheduledTime: Date;
  const eventDate = new Date(event.eventDate);
  
  if (event.postWhen === 'same-day') {
    // Schedule for 9 AM on event date
    scheduledTime = new Date(eventDate);
    scheduledTime.setHours(9, 0, 0, 0);
  } else if (event.postWhen === 'next-day') {
    // Schedule for 9 AM the day after event
    scheduledTime = new Date(eventDate);
    scheduledTime.setDate(scheduledTime.getDate() + 1);
    scheduledTime.setHours(9, 0, 0, 0);
  } else {
    // Custom ISO datetime
    scheduledTime = new Date(event.postWhen);
  }

  // Use platforms from brief if available, otherwise default
  const platformsToUse: Platform[] = brief && brief.platforms.length > 0
    ? brief.platforms
        .filter(p => p.priority <= 2) // Only priority 1-2 platforms
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 3) // Max 3 platforms
        .map(p => {
          // Map brief platform names to Post Platform type
          const platformMap: Record<string, Platform> = {
            'instagram': 'instagram',
            'tiktok': 'tiktok',
            'facebook': 'facebook',
            'linkedin': 'linkedin',
            'youtube_shorts': 'tiktok', // Map to tiktok for now
            'x': 'facebook', // Map to facebook for now
            'pinterest': 'pinterest',
          };
          return platformMap[p.platform] || 'facebook';
        })
    : ['facebook', 'instagram', 'linkedin'];

  const generatedPosts: Post[] = [];

  platformsToUse.forEach((platform) => {
    // Build content using brief data
    let content = event.title;
    
    if (event.notes) {
      content += `\n\n${event.notes}`;
    }

    // Apply tone from brief
    if (brief && brief.voice.tone) {
      // In a real implementation, this would use AI to rewrite with tone
      // For MVP, we'll just add a note about tone
      content += `\n\n[Post should maintain ${brief.voice.tone} tone]`;
    }

    // Add CTA from brief offer
    if (brief && brief.offer) {
      content += `\n\n${brief.offer}`;
    }

    // Apply constraints
    if (brief && brief.constraints.noClientNames) {
      content += '\n\n[No client names to be used]';
    }
    if (brief && brief.constraints.noFaceKids) {
      content += '\n\n[No faces of children in media]';
    }

    const post: Post = {
      id: generateId(),
      content,
      platform,
      status: 'draft',
      scheduledTime,
      authorId: 'user1',
      mediaUrls: event.assetIds.length > 0 ? event.assetIds.map(id => assets.get(id)?.url).filter(Boolean) as string[] : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    posts.set(post.id, post);
    generatedPosts.push(post);
    broadcast({ type: 'post_created', data: post });
  });

  res.json({
    posts: generatedPosts,
    count: generatedPosts.length,
  });
});

// ============================================================================
// AUTOPILOT BRIEF API
// ============================================================================

// Store briefs by brandId (declared at top of file)

// GET /api/autopilot/brief
app.get('/api/autopilot/brief', (req, res) => {
  ensureDefaultBrand();
  const brandId = getBrandIdFromRequest(req);
  
  // In "all" mode, return empty brief
  if (brandId === 'all') {
    return res.json({
      id: '',
      orgId: defaultOrg.id,
      brandId: '',
      brandName: '',
      subjectType: 'business' as const,
      industry: '',
      primaryGoal: 'brand_awareness' as const,
      secondaryGoals: [],
      targetAudience: '',
      offer: '',
      location: '',
      platforms: [],
      voice: { tone: '' },
      brandAssets: {},
      constraints: {},
      successMetrics: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  
  const brief = autopilotBriefs.get(brandId);
  
  if (!brief) {
    // Return empty shape
    return res.json({
      id: '',
      orgId: defaultOrg.id,
      brandId: brandId,
      brandName: '',
      subjectType: 'business' as const,
      industry: '',
      primaryGoal: 'brand_awareness' as const,
      secondaryGoals: [],
      targetAudience: '',
      offer: '',
      location: '',
      platforms: [],
      voice: { tone: '' },
      brandAssets: {},
      constraints: {},
      successMetrics: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  res.json(brief);
});

// PUT /api/autopilot/brief
app.put('/api/autopilot/brief', (req, res) => {
  ensureDefaultBrand();
  const brandId = getBrandIdFromRequest(req);
  
  // Block updating brief in "all" mode
  if (brandId === 'all') {
    return res.status(400).json({ code: 'BRAND_REQUIRED', message: 'Please select a specific brand to update Autopilot brief' });
  }
  
  const briefData = req.body;
  
  const existingBrief = autopilotBriefs.get(brandId);
  
  if (existingBrief) {
    const updated: AutopilotBrief = {
      ...existingBrief,
      ...briefData,
      brandId: brandId,
      updatedAt: new Date(),
    };
    autopilotBriefs.set(brandId, updated);
    broadcast({ type: 'autopilot_brief_updated', data: updated });
    res.json(updated);
  } else {
    const newBrief: AutopilotBrief = {
      id: generateId(),
      orgId: briefData.orgId || defaultOrg.id,
      brandId: brandId,
      brandName: briefData.brandName || '',
      subjectType: briefData.subjectType || 'business',
      industry: briefData.industry || '',
      primaryGoal: briefData.primaryGoal || 'brand_awareness',
      secondaryGoals: briefData.secondaryGoals || [],
      targetAudience: briefData.targetAudience || '',
      offer: briefData.offer || '',
      location: briefData.location || '',
      platforms: briefData.platforms || [],
      voice: briefData.voice || { tone: '' },
      brandAssets: briefData.brandAssets || {},
      constraints: briefData.constraints || {},
      successMetrics: briefData.successMetrics || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    autopilotBriefs.set(brandId, newBrief);
    broadcast({ type: 'autopilot_brief_updated', data: newBrief });
    res.json(newBrief);
  }
});

// POST /api/autopilot/plan
app.post('/api/autopilot/plan', (req, res) => {
  ensureDefaultBrand();
  const brandId = getBrandIdFromRequest(req);
  
  // Block generating plan in "all" mode
  if (brandId === 'all') {
    return res.status(400).json({ code: 'BRAND_REQUIRED', message: 'Please select a specific brand to generate Autopilot plan' });
  }
  
  const brief = autopilotBriefs.get(brandId);
  
  if (!brief || !brief.brandName) {
    return res.status(400).json({ code: 'NO_BRIEF', message: 'Autopilot brief must be created first' });
  }
  
  // Rule-based strategy generation
  const contentPillars: StrategyPlan['contentPillars'] = [];
  const weeklyCadence: StrategyPlan['weeklyCadence'] = [];
  const recommendedPostTypes: string[] = [];
  let ctaGuidance = '';
  const thirtyDayStarterPlan: StrategyPlan['thirtyDayStarterPlan'] = [];

  // Generate content pillars based on industry and goals
  if (brief.primaryGoal === 'brand_awareness') {
    contentPillars.push({
      name: 'Brand Story',
      description: `Share the story behind ${brief.brandName}`,
      examples: [`Behind the scenes at ${brief.brandName}`, `Our mission and values`, `Team spotlights`],
    });
  }
  
  if (brief.primaryGoal === 'leads' || brief.primaryGoal === 'sales') {
    contentPillars.push({
      name: 'Value Proposition',
      description: `Highlight what makes ${brief.brandName} unique`,
      examples: [`Key benefits of ${brief.offer}`, `Success stories`, `Problem-solving content`],
    });
  }

  if (brief.primaryGoal === 'community') {
    contentPillars.push({
      name: 'Community Building',
      description: `Foster engagement and connection`,
      examples: [`User-generated content`, `Community highlights`, `Interactive Q&A`],
    });
  }

  // Add industry-specific pillars
  if (brief.industry.toLowerCase().includes('bjj') || brief.industry.toLowerCase().includes('gym')) {
    contentPillars.push({
      name: 'Training Tips',
      description: 'Share martial arts techniques and training advice',
      examples: ['Technique breakdowns', 'Training drills', 'Competition prep'],
    });
    contentPillars.push({
      name: 'Community & Culture',
      description: 'Showcase the gym community and values',
      examples: ['Student spotlights', 'Class highlights', 'Belt promotions'],
    });
  }

  // Default pillars if none generated
  if (contentPillars.length === 0) {
    contentPillars.push(
      {
        name: 'Educational Content',
        description: `Share valuable insights about ${brief.industry}`,
        examples: ['Tips and tricks', 'Industry insights', 'How-to guides'],
      },
      {
        name: 'Behind the Scenes',
        description: 'Show the human side of the brand',
        examples: ['Day in the life', 'Team moments', 'Process reveals'],
      },
      {
        name: 'Social Proof',
        description: 'Build trust through testimonials and results',
        examples: ['Customer stories', 'Results showcase', 'Reviews and feedback'],
      }
    );
  }

  // Generate weekly cadence from platform configs
  brief.platforms.forEach((platformConfig) => {
    const postTypes: string[] = [];
    
    if (platformConfig.platform === 'instagram') {
      postTypes.push('reels', 'carousels', 'stories');
      recommendedPostTypes.push('reels', 'carousels', 'stories');
    } else if (platformConfig.platform === 'tiktok') {
      postTypes.push('short-form video');
      recommendedPostTypes.push('short-form video');
    } else if (platformConfig.platform === 'facebook') {
      postTypes.push('video', 'carousels', 'single image');
      recommendedPostTypes.push('video', 'carousels');
    } else if (platformConfig.platform === 'linkedin') {
      postTypes.push('article', 'carousel', 'video');
      recommendedPostTypes.push('article', 'carousel');
    }

    weeklyCadence.push({
      platform: platformConfig.platform,
      postTypes,
      postsPerWeek: platformConfig.postingCadencePerWeek,
    });
  });

  // Generate CTA guidance
  if (brief.offer) {
    ctaGuidance = `Primary CTA: ${brief.offer}. Use clear, action-oriented language. ${brief.voice.tone ? `Maintain ${brief.voice.tone} tone.` : ''}`;
  } else {
    ctaGuidance = `Focus on ${brief.primaryGoal}. Use engaging calls-to-action that align with your goals.`;
  }

  // Generate 30-day starter plan
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    // Rotate through platforms based on priority
    const activePlatforms = brief.platforms
      .filter(p => p.priority <= 2)
      .sort((a, b) => a.priority - b.priority);
    
    if (activePlatforms.length > 0) {
      const platformIndex = i % activePlatforms.length;
      const platform = activePlatforms[platformIndex];
      const pillarIndex = i % contentPillars.length;
      const pillar = contentPillars[pillarIndex];
      
      thirtyDayStarterPlan.push({
        date: date.toISOString().split('T')[0],
        platform: platform.platform,
        postIdea: `${pillar.name}: ${pillar.examples[0] || 'Content idea'}`,
        assetSuggestion: platform.platform === 'instagram' ? 'High-quality photo or video' : 'Platform-appropriate media',
      });
    }
  }

  const plan: StrategyPlan = {
    contentPillars,
    weeklyCadence,
    recommendedPostTypes: [...new Set(recommendedPostTypes)],
    ctaGuidance,
    thirtyDayStarterPlan,
  };

  res.json(plan);
});

// POST /api/autopilot/generate
app.post('/api/autopilot/generate', (req, res) => {
  ensureDefaultBrand();
  const brandId = getBrandIdFromRequest(req);
  
  // Block generating in "all" mode
  if (brandId === 'all') {
    return res.status(400).json({ code: 'VIEW_ONLY', message: 'Select a brand to generate Autopilot outputs.' });
  }
  
  const brief = autopilotBriefs.get(brandId);
  
  if (!brief || !brief.brandName) {
    return res.status(400).json({ code: 'NO_BRIEF', message: 'Autopilot brief must be created first. Please complete setup.' });
  }
  
  const { from, to } = req.body;
  const fromDate = from ? new Date(from) : new Date();
  const toDate = to ? new Date(to) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // default 7 days
  
  // Import platform knowledge (dynamic import for TypeScript compatibility)
  // For now, we'll use a simplified inline version that matches the structure
  const PLATFORM_RULES: Record<string, any> = {
    instagram: {
      captionMaxChars: 2200,
      recommendedCaptionChars: { min: 80, max: 400 },
      recommendedHashtags: { min: 3, max: 12 },
      tone: ['friendly', 'confident', 'energetic'],
      formatting: ['Hook line', 'Short paragraphs', 'Emoji optional', 'Hashtags at end'],
    },
    facebook: {
      recommendedCaptionChars: { min: 60, max: 300 },
      tone: ['conversational', 'helpful', 'community-first'],
      formatting: ['1–2 short paragraphs', 'Clear CTA', 'Avoid heavy hashtag use'],
    },
    linkedin: {
      captionMaxChars: 3000,
      recommendedCaptionChars: { min: 300, max: 1300 },
      recommendedHashtags: { min: 0, max: 5 },
      tone: ['professional', 'insightful', 'human'],
      formatting: ['Hook line', 'Short paragraphs', 'Bullets ok', 'Light hashtags at end'],
    },
    x: {
      captionMaxChars: 280,
      recommendedHashtags: { min: 0, max: 2 },
      tone: ['concise', 'witty', 'direct'],
      formatting: ['One-liner hook', 'Optional line break', 'Minimal hashtags'],
    },
    tiktok: {
      recommendedHashtags: { min: 2, max: 6 },
      tone: ['casual', 'direct', 'playful'],
      formatting: ['Short caption', 'Hook in video text', 'Hashtags minimal'],
    },
    pinterest: {
      recommendedHashtags: { min: 0, max: 5 },
      tone: ['informative', 'clear', 'utility-first'],
      formatting: ['Title + keywords', 'Short description', 'Avoid slang-heavy copy'],
    },
  };
  
  console.log(`[Autopilot Generate] brandId: ${brandId}, platforms: ${brief.platforms.map(p => p.platform).join(', ')}, Using PLATFORM_KNOWLEDGE: true`);
  
  // Generate plan summary
  const plan: AutopilotPlanSummary = {
    overview: `Content strategy for ${brief.brandName} focusing on ${brief.primaryGoal}. ${brief.voice.tone ? `Tone: ${brief.voice.tone}.` : ''} Target audience: ${brief.targetAudience || 'general audience'}.`,
    pillars: brief.platforms.length > 0 
      ? brief.platforms.map(p => `${p.platform.charAt(0).toUpperCase() + p.platform.slice(1)} content`)
      : ['Educational', 'Behind the Scenes', 'Social Proof'],
    cadence: brief.platforms.map(p => {
      const rules = PLATFORM_RULES[p.platform] || {};
      const cadenceGuidance = rules.cadenceGuidance || { recommendedPerWeek: { min: 2, max: 5 } };
      // Map platform to valid Platform type (youtube_shorts -> tiktok, x -> reddit for now)
      const mappedPlatform: Platform = (p.platform === 'youtube_shorts' ? 'tiktok' : 
        p.platform === 'x' ? 'reddit' : 
        p.platform) as Platform;
      return {
        platform: mappedPlatform,
        postsPerWeek: p.postingCadencePerWeek || cadenceGuidance.recommendedPerWeek?.min || 3,
        notes: cadenceGuidance.notes?.[0] || undefined,
      };
    }),
  };
  
  // Generate calendar suggestions
  const calendar: AutopilotCalendarSuggestion[] = [];
  const currentDate = new Date(fromDate);
  while (currentDate <= toDate) {
    brief.platforms.forEach((platformConfig) => {
      const rules = PLATFORM_RULES[platformConfig.platform] || {};
      const contentType = platformConfig.platform === 'instagram' ? 'carousel' 
        : platformConfig.platform === 'tiktok' ? 'short_video'
        : platformConfig.platform === 'linkedin' ? 'text'
        : 'image';
      
      // Map platform to valid Platform type
      const mappedPlatform: Platform = (platformConfig.platform === 'youtube_shorts' ? 'tiktok' : 
        platformConfig.platform === 'x' ? 'reddit' : 
        platformConfig.platform) as Platform;
      
      calendar.push({
        id: `cal_${currentDate.toISOString().split('T')[0]}_${platformConfig.platform}`,
        date: currentDate.toISOString().split('T')[0],
        platform: mappedPlatform,
        title: `${brief.brandName} ${platformConfig.platform} post`,
        summary: `Content aligned with ${brief.primaryGoal} goal`,
        contentType,
      });
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Generate drafts with platform-specific formatting
  const drafts: AutopilotDraftPost[] = [];
  brief.platforms.forEach((platformConfig, idx) => {
    const rules = PLATFORM_RULES[platformConfig.platform] || {};
    const maxChars = rules.captionMaxChars || 500;
    const recommendedChars = rules.recommendedCaptionChars || { min: 100, max: 300 };
    const hashtagRange = rules.recommendedHashtags || { min: 3, max: 10 };
    const tone = rules.tone?.[0] || 'professional';
    const formatting = rules.formatting || [];
    
    // Generate platform-specific caption
    let caption = '';
    if (platformConfig.platform === 'x') {
      // X/Twitter: very short, punchy
      caption = `${brief.brandName}: ${brief.offer || brief.primaryGoal}. ${brief.voice.tone ? `Tone: ${tone}.` : ''}`;
      if (caption.length > maxChars) {
        caption = caption.substring(0, maxChars - 3) + '...';
      }
    } else if (platformConfig.platform === 'linkedin') {
      // LinkedIn: longer, professional
      caption = `${brief.brandName} | ${brief.industry}\n\n${brief.targetAudience || 'Our audience'} ${brief.offer ? `can benefit from ${brief.offer}.` : 'needs our expertise.'}\n\n${brief.voice.tone ? `We maintain a ${tone} tone.` : ''}\n\nWhat's your take?`;
      if (caption.length > maxChars) {
        caption = caption.substring(0, maxChars - 3) + '...';
      }
    } else if (platformConfig.platform === 'instagram') {
      // Instagram: medium length, hashtags
      caption = `${brief.brandName} ✨\n\n${brief.offer || `Focusing on ${brief.primaryGoal}`}\n\n${brief.voice.tone ? `Tone: ${tone}` : ''}\n\nWhat do you think? Drop a comment! 👇`;
      if (caption.length > recommendedChars.max) {
        caption = caption.substring(0, recommendedChars.max - 3) + '...';
      }
    } else {
      // Default: medium length
      caption = `${brief.brandName}: ${brief.offer || brief.primaryGoal}. ${brief.voice.tone ? `Tone: ${tone}.` : ''}`;
      if (caption.length > recommendedChars.max) {
        caption = caption.substring(0, recommendedChars.max - 3) + '...';
      }
    }
    
    // Generate hashtags based on platform rules
    const hashtagCount = Math.floor(Math.random() * (hashtagRange.max - hashtagRange.min + 1)) + hashtagRange.min;
    const hashtags: string[] = [];
    if (platformConfig.platform !== 'linkedin' && platformConfig.platform !== 'x') {
      // Generate mock hashtags (in real implementation, use brief or AI)
      const baseHashtags = [brief.industry, brief.primaryGoal, brief.brandName.toLowerCase().replace(/\s+/g, '')];
      for (let i = 0; i < hashtagCount && i < baseHashtags.length + 3; i++) {
        hashtags.push(`#${baseHashtags[i] || `tag${i}`}`);
      }
    }
    
    // Map platform to valid Platform type
    const mappedPlatform: Platform = (platformConfig.platform === 'youtube_shorts' ? 'tiktok' : 
      platformConfig.platform === 'x' ? 'reddit' : 
      platformConfig.platform) as Platform;
    
    drafts.push({
      id: `draft_${platformConfig.platform}_${idx}`,
      platform: mappedPlatform,
      contentType: platformConfig.platform === 'instagram' ? 'carousel' 
        : platformConfig.platform === 'tiktok' || platformConfig.platform === 'youtube_shorts' ? 'short_video'
        : platformConfig.platform === 'linkedin' ? 'text'
        : 'image',
      caption,
      hashtags: hashtags.length > 0 ? hashtags : undefined,
      notes: `Platform rules applied: ${maxChars} char limit, ${tone} tone, ${formatting.join(', ')}`,
      recommendedTime: '09:00',
    });
  });
  
  const response: AutopilotGenerateResponse = {
    plan,
    calendar,
    drafts,
  };
  
  res.json(response);
});

// ============================================================================
// BRANDS API
// ============================================================================

// Initialize default brand if none exist
function ensureDefaultBrand() {
  if (brands.size === 0) {
    const defaultBrand = createDefaultBrand(generateId);
    brands.set(defaultBrand.id, defaultBrand);
  }
}

// Initialize on startup
ensureDefaultBrand();

// GET /api/brands
app.get('/api/brands', (req, res) => {
  ensureDefaultBrand();
  res.json({ brands: Array.from(brands.values()) });
});

// POST /api/brands
app.post('/api/brands', (req, res) => {
  const { name, avatarUrl, color } = req.body;
  
  if (!name) {
    return res.status(400).json({ code: 'INVALID_REQUEST', message: 'Name is required' });
  }

  // Enforce max 6 brands
  if (brands.size >= 6) {
    return res.status(409).json({ code: 'MAX_BRANDS_EXCEEDED', message: 'Maximum of 6 brands allowed' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  
  // Check for duplicate slug
  const existingBrand = Array.from(brands.values()).find(b => b.slug === slug);
  if (existingBrand) {
    return res.status(400).json({ code: 'DUPLICATE_SLUG', message: 'Brand with this name already exists' });
  }

  const brand: Brand = {
    id: generateId(),
    name,
    slug,
    avatarUrl,
    color,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  brands.set(brand.id, brand);

  broadcast({ type: 'brand_created', data: brand });
  res.status(201).json(brand);
});

// PUT /api/brands/:id
app.put('/api/brands/:id', (req, res) => {
  const brand = brands.get(req.params.id);
  if (!brand) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Brand not found' });
  }

  const { name, avatarUrl, color } = req.body;
  const updated: Brand = {
    ...brand,
    ...(name && { name }),
    ...(avatarUrl !== undefined && { avatarUrl }),
    ...(color !== undefined && { color }),
    updatedAt: new Date(),
  };

  // Update slug if name changed
  if (name && name !== brand.name) {
    const newSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const existingBrand = Array.from(brands.values()).find(b => b.slug === newSlug && b.id !== brand.id);
    if (existingBrand) {
      return res.status(400).json({ code: 'DUPLICATE_SLUG', message: 'Brand with this name already exists' });
    }
    updated.slug = newSlug;
  }

  brands.set(brand.id, updated);
  broadcast({ type: 'brand_updated', data: updated });
  res.json(updated);
});

// DELETE /api/brands/:id
app.delete('/api/brands/:id', (req, res) => {
  const brand = brands.get(req.params.id);
  if (!brand) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Brand not found' });
  }

  // Don't allow deleting if it's the only brand
  if (brands.size === 1) {
    return res.status(400).json({ code: 'CANNOT_DELETE_LAST', message: 'Cannot delete the last brand' });
  }

  // Delete avatar file if exists
  if (brand.avatarUrl) {
    const avatarPath = path.join(uploadsDir, path.basename(brand.avatarUrl));
    if (fs.existsSync(avatarPath)) {
      fs.unlinkSync(avatarPath);
    }
  }

  // Delete avatar file if exists
  if (brand.avatarUrl) {
    const avatarPath = path.join(uploadsDir, path.basename(brand.avatarUrl));
    if (fs.existsSync(avatarPath)) {
      fs.unlinkSync(avatarPath);
    }
  }

  brands.delete(req.params.id);

  broadcast({ type: 'brand_deleted', data: { id: req.params.id } });
  res.status(204).send();
});

// POST /api/brands/:id/avatar (multipart upload)
app.post('/api/brands/:id/avatar', upload.single('file'), (req: ExpressRequest, res) => {
  const brandId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const brand = brands.get(brandId);
  if (!brand) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Brand not found' });
  }

  const file = (req as ExpressRequest & { file?: Express.Multer.File }).file;
  if (!file) {
    return res.status(400).json({ code: 'INVALID_REQUEST', message: 'No file uploaded' });
  }

  // Validate file type
  if (!file.mimetype.startsWith('image/')) {
    // Delete uploaded file
    fs.unlinkSync(file.path);
    return res.status(400).json({ code: 'INVALID_FILE_TYPE', message: 'File must be an image' });
  }

  // Validate file size (5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    fs.unlinkSync(file.path);
    return res.status(413).json({ code: 'FILE_TOO_LARGE', message: 'File too large. Max size is 5MB.' });
  }

  // Delete old avatar if exists
  if (brand.avatarUrl) {
    const oldAvatarPath = path.join(uploadsDir, path.basename(brand.avatarUrl));
    if (fs.existsSync(oldAvatarPath)) {
      fs.unlinkSync(oldAvatarPath);
    }
  }

  // Generate avatar URL
  const avatarUrl = `/uploads/${file.filename}`;

  // Update brand
  const updated: Brand = {
    ...brand,
    avatarUrl,
    updatedAt: new Date(),
  };

  brands.set(brand.id, updated);
  broadcast({ type: 'brand_updated', data: updated });
  res.json({ avatarUrl });
});

// DELETE /api/brands/:id/avatar
app.delete('/api/brands/:id/avatar', (req, res) => {
  const brandId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const brand = brands.get(brandId);
  if (!brand) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Brand not found' });
  }

  // Delete avatar file if exists
  if (brand.avatarUrl) {
    const avatarPath = path.join(uploadsDir, path.basename(brand.avatarUrl));
    if (fs.existsSync(avatarPath)) {
      fs.unlinkSync(avatarPath);
    }
  }

  // Update brand
  const updated: Brand = {
    ...brand,
    avatarUrl: undefined,
    updatedAt: new Date(),
  };

  brands.set(brand.id, updated);
  broadcast({ type: 'brand_updated', data: updated });
  res.json({ avatarUrl: undefined });
});

// GET /api/brands/current - Returns brand from x-brand-id header
app.get('/api/brands/current', (req, res) => {
  ensureDefaultBrand();
  const brandId = getBrandIdFromRequest(req);
  
  if (brandId === 'all') {
    return res.json({ id: 'all', name: 'All Brands', slug: 'all' });
  }
  
  const brand = brands.get(brandId);
  if (!brand) {
    // Fallback to first brand
    const firstBrand = Array.from(brands.values())[0];
    if (firstBrand) {
      return res.json(firstBrand);
    }
    return res.status(404).json({ code: 'NOT_FOUND', message: 'No brand found' });
  }
  res.json(brand);
});

// ============================================================================
// BUSINESS SCHEDULE API
// ============================================================================

// GET /api/schedule/templates
app.get('/api/schedule/templates', (req, res) => {
  ensureDefaultBrand();
  const brandId = getBrandIdFromRequest(req);
  
  // Block in "all" mode
  if (brandId === 'all') {
    return res.json({ templates: [] });
  }
  
  const templates = Array.from(scheduleTemplates.values())
    .filter(t => t.brandId === brandId);
  
  res.json({ templates });
});

// POST /api/schedule/templates
app.post('/api/schedule/templates', (req, res) => {
  ensureDefaultBrand();
  const brandId = getBrandIdFromRequest(req);
  
  // Block creating in "all" mode
  if (brandId === 'all') {
    return res.status(400).json({ code: 'BRAND_REQUIRED', message: 'Please select a specific brand to create schedule templates' });
  }
  
  const { title, daysOfWeek, startTime, durationMinutes, location, notes } = req.body;
  
  if (!title || !daysOfWeek || !Array.isArray(daysOfWeek) || !startTime || !durationMinutes) {
    return res.status(400).json({ code: 'INVALID_REQUEST', message: 'Title, daysOfWeek, startTime, and durationMinutes are required' });
  }
  
  const template: BusinessScheduleTemplate = {
    id: generateId(),
    brandId,
    title,
    daysOfWeek,
    startTime,
    durationMinutes,
    location,
    notes,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  scheduleTemplates.set(template.id, template);
  broadcast({ type: 'schedule_template_created', data: template });
  res.status(201).json(template);
});

// PUT /api/schedule/templates/:id
app.put('/api/schedule/templates/:id', (req, res) => {
  const template = scheduleTemplates.get(req.params.id);
  if (!template) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Schedule template not found' });
  }
  
  const updated = {
    ...template,
    ...req.body,
    updatedAt: new Date(),
  };
  
  scheduleTemplates.set(req.params.id, updated);
  broadcast({ type: 'schedule_template_updated', data: updated });
  res.json(updated);
});

// DELETE /api/schedule/templates/:id
app.delete('/api/schedule/templates/:id', (req, res) => {
  const template = scheduleTemplates.get(req.params.id);
  if (!template) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Schedule template not found' });
  }
  
  scheduleTemplates.delete(req.params.id);
  broadcast({ type: 'schedule_template_deleted', data: { id: req.params.id } });
  res.status(204).send();
});

// GET /api/calendar
app.get('/api/calendar', (req, res) => {
  ensureDefaultBrand();
  const brandId = getBrandIdFromRequest(req);
  const { from, to } = req.query;
  
  if (!from || !to) {
    return res.status(400).json({ code: 'INVALID_REQUEST', message: 'from and to query parameters are required (YYYY-MM-DD)' });
  }
  
  const fromDate = new Date(from as string);
  const toDate = new Date(to as string);
  toDate.setHours(23, 59, 59, 999); // Include full end date
  
  const items: CalendarItem[] = [];
  
  // Get business schedule events (only for specific brand, not "all")
  if (brandId !== 'all') {
    const templates = Array.from(scheduleTemplates.values())
      .filter(t => t.brandId === brandId);
    
    // Expand templates into occurrences within date range
    templates.forEach(template => {
      const currentDate = new Date(fromDate);
      while (currentDate <= toDate) {
        const dayOfWeek = currentDate.getDay();
        if (template.daysOfWeek.includes(dayOfWeek)) {
          // Create occurrence
          const [hours, minutes] = template.startTime.split(':').map(Number);
          const startAt = new Date(currentDate);
          startAt.setHours(hours, minutes, 0, 0);
          
          const endAt = new Date(startAt);
          endAt.setMinutes(endAt.getMinutes() + template.durationMinutes);
          
          items.push({
            id: `${template.id}_${currentDate.toISOString().split('T')[0]}`,
            kind: 'business_event',
            title: template.title,
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString(),
            meta: {
              templateId: template.id,
              location: template.location,
              notes: template.notes,
            },
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
  }
  
  // Get scheduled posts within range
  const allPosts = Array.from(posts.values());
  const postsInRange = allPosts.filter(post => {
    const postDate = post.scheduledTime || post.publishedTime;
    if (!postDate) return false;
    
    const postDateObj = new Date(postDate);
    return postDateObj >= fromDate && postDateObj <= toDate &&
      (brandId === 'all' || (post.brandId || 'default') === brandId);
  });
  
  postsInRange.forEach(post => {
    const postDate = post.scheduledTime || post.publishedTime || post.createdAt;
    const startAt = new Date(postDate);
    const endAt = new Date(startAt);
    endAt.setMinutes(endAt.getMinutes() + 30); // Default 30min duration for posts
    
    items.push({
      id: `post_${post.id}`,
      kind: 'post',
      title: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : ''),
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      platform: post.platform,
      postId: post.id,
      meta: {
        status: post.status,
        content: post.content,
      },
    });
  });
  
  // Sort by startAt
  items.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  
  res.json({ items });
});

// ============================================================================
// GOOGLE OAUTH API
// ============================================================================

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_OAUTH_REDIRECT_BASE = process.env.GOOGLE_OAUTH_REDIRECT_BASE || 'http://localhost:8080';

// Meta OAuth configuration
const META_APP_ID = process.env.META_APP_ID || '';
const META_APP_SECRET = process.env.META_APP_SECRET || '';
const META_OAUTH_REDIRECT_BASE = process.env.META_OAUTH_REDIRECT_BASE || 'http://localhost:8080';

// purpose: 'gmail' | 'gbp' | 'youtube' (Google OAuth purposes)
// purpose: 'facebook' | 'instagram' (Meta OAuth purposes)
type OAuthPurpose = 'gmail' | 'gbp' | 'youtube' | 'facebook' | 'instagram';
type OAuthProvider = 'google' | 'meta';

// GET /api/oauth/config-status - Check OAuth configuration status
app.get('/api/oauth/config-status', (req, res) => {
  const googleMissing: string[] = [];
  const metaMissing: string[] = [];

  if (!GOOGLE_CLIENT_ID) googleMissing.push('GOOGLE_CLIENT_ID');
  if (!GOOGLE_CLIENT_SECRET) googleMissing.push('GOOGLE_CLIENT_SECRET');

  if (!META_APP_ID) metaMissing.push('META_APP_ID');
  if (!META_APP_SECRET) metaMissing.push('META_APP_SECRET');

  res.json({
    google: {
      configured: googleMissing.length === 0,
      missing: googleMissing,
    },
    meta: {
      configured: metaMissing.length === 0,
      missing: metaMissing,
    },
  });
});

// Helper to generate random state
function generateState(): string {
  return `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to get access token (with auto-refresh)
async function getGoogleAccessToken(integration: GoogleIntegration): Promise<string> {
  // Check if token is expired
  if (new Date() >= integration.token.accessTokenExpiresAt) {
    // Refresh token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: integration.token.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Google access token');
    }

    const data = parseJsonResponse<{ access_token?: string; expires_in?: number }>(await response.json());
    integration.token.accessToken = data.access_token || '';
    integration.token.accessTokenExpiresAt = new Date(Date.now() + ((data.expires_in || 3600) * 1000));
    integration.updatedAt = new Date();
    googleIntegrations.set(integration.id, integration);
  }

  return integration.token.accessToken;
}

// GET /api/oauth/google/start?brandId=...&purpose=gmail|gbp|youtube
app.get('/api/oauth/google/start', async (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({ 
      code: 'GOOGLE_NOT_CONFIGURED', 
      message: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.' 
    });
  }

  const brandId = req.query.brandId as string;
  const purpose = (req.query.purpose as 'gmail' | 'gbp' | 'youtube') || 'gmail';
  
  if (!brandId) {
    return res.status(400).json({ code: 'BRAND_ID_REQUIRED', message: 'brandId query parameter is required' });
  }

  const state = generateState();
  const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes
  await setOAuthState(state, { brandId, purpose, provider: 'google', expiresAt });

  const redirectUri = `${GOOGLE_OAUTH_REDIRECT_BASE}/api/oauth/google/callback`;
  
  // Different scopes based on purpose
  let scopes: string[];
  if (purpose === 'gbp') {
    scopes = [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/business.manage',
    ];
  } else if (purpose === 'youtube') {
    scopes = [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.force-ssl',
    ];
  } else {
    // gmail (default)
    scopes = [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/gmail.readonly',
    ];
  }

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scopes.join(' '));
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent'); // Force consent to get refresh token
  authUrl.searchParams.set('state', state);

  res.json({ authUrl: authUrl.toString(), state, purpose });
});

// GET /api/oauth/google/callback?code=...&state=...
app.get('/api/oauth/google/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>OAuth Error</title></head>
        <body>
          <script>
            window.opener.postMessage({ 
              type: 'oauth:complete', 
              provider: 'google', 
              success: false, 
              error: '${error}' 
            }, window.location.origin);
            window.close();
          </script>
          <p>OAuth error: ${error}</p>
        </body>
      </html>
    `;
    return res.send(errorHtml);
  }

  if (!code || !state) {
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>OAuth Error</title></head>
        <body>
          <script>
            window.opener.postMessage({ 
              type: 'oauth:complete', 
              provider: 'google', 
              success: false, 
              error: 'Missing code or state' 
            }, window.location.origin);
            window.close();
          </script>
          <p>Missing code or state parameter</p>
        </body>
      </html>
    `;
    return res.send(errorHtml);
  }

  const stateData = await getAndDeleteOAuthState(state as string);
  if (!stateData || stateData.provider !== 'google') {
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>OAuth Error</title></head>
        <body>
          <script>
            window.opener.postMessage({ 
              type: 'oauth:complete', 
              provider: 'google', 
              success: false, 
              error: 'Invalid or expired state' 
            }, window.location.origin);
            window.close();
          </script>
          <p>Invalid or expired state</p>
        </body>
      </html>
    `;
    return res.send(errorHtml);
  }

  const { brandId, purpose } = stateData;

  try {
    // Exchange code for tokens
    const redirectUri = `${GOOGLE_OAUTH_REDIRECT_BASE}/api/oauth/google/callback`;
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code: code as string,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errorData}`);
    }

    const tokenData = parseJsonResponse<{ access_token?: string; refresh_token?: string; expires_in?: number }>(await tokenResponse.json());

    if (!tokenData.refresh_token) {
      throw new Error('No refresh token received. Make sure access_type=offline and prompt=consent are set.');
    }

    // Get user email
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userInfo = parseJsonResponse<{ email?: string }>(await userInfoResponse.json());
    const email = userInfo.email || '';

    if (purpose === 'youtube') {
      // Create YouTube social account connection
      // First check if we can get YouTube channel info
      let channelInfo: { id: string; title: string; snippet?: { thumbnails?: { default?: { url: string } } } } | null = null;
      try {
        const channelResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });
        if (channelResponse.ok) {
          const channelData = parseJsonResponse<{ items?: Array<{ id: string; snippet?: { title?: string; thumbnails?: { default?: { url: string } } } }> }>(await channelResponse.json());
          if (channelData.items && channelData.items.length > 0) {
            channelInfo = {
              id: channelData.items[0].id,
              title: channelData.items[0].snippet?.title || email,
              snippet: channelData.items[0].snippet,
            };
          }
        }
      } catch (e) {
        console.warn('Failed to fetch YouTube channel info:', e);
      }

      // Create social account for YouTube (mapped to tiktok platform type for now)
      const existingAccount = Array.from(socialAccounts.values())
        .find(sa => sa.platform === 'tiktok' && sa.brandId === brandId && sa.username === email);

      const account: SocialAccount = {
        id: existingAccount?.id || generateId(),
        organizationId: defaultOrg.id,
        brandId,
        platform: 'tiktok' as Platform, // YouTube mapped to tiktok platform type
        username: channelInfo?.title || email,
        displayName: channelInfo?.title || email,
        avatarUrl: channelInfo?.snippet?.thumbnails?.default?.url || undefined,
        followerCount: 0,
        isConnected: true,
        status: 'connected',
        lastSync: new Date(),
        oauthToken: {
          accessToken: tokenData.access_token || '',
          expiresAt: new Date(Date.now() + ((tokenData.expires_in || 3600) * 1000)),
          refreshToken: tokenData.refresh_token || '', // Server-side only
        },
        providerAccountId: channelInfo?.id,
        createdAt: existingAccount?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      socialAccounts.set(account.id, account);

      // Return success HTML
      const successHtml = `
        <!DOCTYPE html>
        <html>
          <head><title>OAuth Success</title></head>
          <body>
            <script>
              window.opener.postMessage({ 
                type: 'oauth:complete', 
                provider: 'google',
                purpose: 'youtube',
                success: true,
                integrationId: '${account.id}'
              }, window.location.origin);
              window.close();
            </script>
            <p>Authorization successful! You can close this window.</p>
          </body>
        </html>
      `;
      return res.send(successHtml);
    } else if (purpose === 'gbp') {
      // Create Google Business Profile connection
      const existingConnection = Array.from(googleConnections.values())
        .find(gc => gc.brandId === brandId && gc.googleAccountEmail === email);

      const connection: import('./types').GoogleConnection = {
        id: existingConnection?.id || generateId(),
        brandId,
        provider: 'google',
        scopes: [], // Scopes not returned in token response, would need to track separately
        accessToken: tokenData.access_token || '',
        refreshToken: tokenData.refresh_token || '', // Server-side only
        tokenExpiry: new Date(Date.now() + ((tokenData.expires_in || 3600) * 1000)),
        googleAccountEmail: email,
        gbpAccounts: [],
        gbpLocations: [],
        createdAt: existingConnection?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      googleConnections.set(connection.id, connection);

      // Return success HTML
      const successHtml = `
        <!DOCTYPE html>
        <html>
          <head><title>OAuth Success</title></head>
          <body>
            <script>
              window.opener.postMessage({ 
                type: 'oauth:complete', 
                provider: 'google',
                purpose: 'gbp',
                success: true,
                connectionId: '${connection.id}'
              }, window.location.origin);
              window.close();
            </script>
            <p>Authorization successful! You can close this window.</p>
          </body>
        </html>
      `;
      return res.send(successHtml);
    } else {
      // Create or update Gmail integration (existing flow)
      const existingIntegration = Array.from(googleIntegrations.values())
        .find(gi => gi.brandId === brandId && gi.email === email);

      const integration: GoogleIntegration = {
        id: existingIntegration?.id || generateId(),
        brandId,
        provider: 'google',
        email,
        scopes: [], // Scopes not returned in token response, would need to track separately
        token: {
          accessToken: tokenData.access_token || '',
          accessTokenExpiresAt: new Date(Date.now() + ((tokenData.expires_in || 3600) * 1000)),
          refreshToken: tokenData.refresh_token || '', // Server-side only
        },
        createdAt: existingIntegration?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      googleIntegrations.set(integration.id, integration);

      // Also create EmailAccount entry for Gmail
      const existingEmailAccount = Array.from(emailAccounts.values())
        .find(ea => ea.brandId === brandId && ea.emailAddress === email && ea.provider === 'gmail');

      const emailAccount: import('./types').EmailAccount = {
        id: existingEmailAccount?.id || generateId(),
        brandId,
        provider: 'gmail',
        emailAddress: email,
        authType: 'oauth',
        oauthToken: {
          accessToken: tokenData.access_token || '',
          accessTokenExpiresAt: new Date(Date.now() + ((tokenData.expires_in || 3600) * 1000)),
          refreshToken: tokenData.refresh_token || '',
        },
        status: 'connected',
        createdAt: existingEmailAccount?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      emailAccounts.set(emailAccount.id, emailAccount);

      // Return success HTML that posts message to opener
      const successHtml = `
        <!DOCTYPE html>
        <html>
          <head><title>OAuth Success</title></head>
          <body>
            <script>
              window.opener.postMessage({ 
                type: 'oauth:complete', 
                provider: 'google',
                purpose: 'gmail',
                success: true,
                integrationId: '${integration.id}',
                emailAccountId: '${emailAccount.id}'
              }, window.location.origin);
              window.close();
            </script>
            <p>Authorization successful! You can close this window.</p>
          </body>
        </html>
      `;
      return res.send(successHtml);
    }
  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>OAuth Error</title></head>
        <body>
          <script>
            window.opener.postMessage({ 
              type: 'oauth:complete', 
              provider: 'google', 
              success: false, 
              error: '${error instanceof Error ? error.message : 'Unknown error'}' 
            }, window.location.origin);
            window.close();
          </script>
          <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
        </body>
      </html>
    `;
    res.send(errorHtml);
  }
});

// GET /api/integrations/google (brand-scoped)
app.get('/api/integrations/google', (req, res) => {
  const brandId = getBrandIdFromRequest(req);
  
  if (brandId === 'all') {
    // In "all" mode, return all integrations but still no tokens
    const allIntegrations = Array.from(googleIntegrations.values());
    const publicIntegrations: GoogleIntegrationPublic[] = allIntegrations.map(gi => ({
      id: gi.id,
      brandId: gi.brandId,
      provider: gi.provider,
      email: gi.email,
      scopes: gi.scopes,
      createdAt: gi.createdAt,
      updatedAt: gi.updatedAt,
    }));
    return res.json({ integrations: publicIntegrations });
  }

  const integrations = Array.from(googleIntegrations.values())
    .filter(gi => gi.brandId === brandId);
  
  const publicIntegrations: GoogleIntegrationPublic[] = integrations.map(gi => ({
    id: gi.id,
    brandId: gi.brandId,
    provider: gi.provider,
    email: gi.email,
    scopes: gi.scopes,
    createdAt: gi.createdAt,
    updatedAt: gi.updatedAt,
  }));

  res.json({ integrations: publicIntegrations });
});

// DELETE /api/integrations/google/:id
app.delete('/api/integrations/google/:id', (req, res) => {
  const integration = googleIntegrations.get(req.params.id);
  if (!integration) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Integration not found' });
  }

  // Verify brand ownership
  const brandId = getBrandIdFromRequest(req);
  if (brandId !== 'all' && integration.brandId !== brandId) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Integration belongs to a different brand' });
  }

  // Delete integration and associated triage data
  googleIntegrations.delete(req.params.id);
  
  // Clean up triage data for this brand
  for (const [key, _] of emailTriage.entries()) {
    if (key.startsWith(`${integration.brandId}:`)) {
      emailTriage.delete(key);
    }
  }

  res.status(204).send();
});

// ============================================================================
// EMAIL API (Read-only MVP)
// ============================================================================

// GET /api/email/accounts (brand-scoped, multi-provider)
app.get('/api/email/accounts', (req, res) => {
  const brandId = getBrandIdFromRequest(req);
  
  if (brandId === 'all') {
    const allAccounts = Array.from(emailAccounts.values());
    const accounts = allAccounts.map(ea => ({
      id: ea.id,
      brandId: ea.brandId,
      provider: ea.provider,
      emailAddress: ea.emailAddress,
      authType: ea.authType,
      status: ea.status,
      lastSyncAt: ea.lastSyncAt,
      createdAt: ea.createdAt,
      updatedAt: ea.updatedAt,
    }));
    return res.json({ accounts });
  }

  const accounts = Array.from(emailAccounts.values())
    .filter(ea => ea.brandId === brandId)
    .map(ea => ({
      id: ea.id,
      brandId: ea.brandId,
      provider: ea.provider,
      emailAddress: ea.emailAddress,
      authType: ea.authType,
      status: ea.status,
      lastSyncAt: ea.lastSyncAt,
      createdAt: ea.createdAt,
      updatedAt: ea.updatedAt,
    }));

  res.json({ accounts });
});

// POST /api/email/accounts/gmail/start (OAuth for Gmail)
app.post('/api/email/accounts/gmail/start', (req, res) => {
  const brandId = getBrandIdFromRequest(req);
  
  if (brandId === 'all') {
    return res.status(400).json({ code: 'BRAND_REQUIRED', message: 'Please select a specific brand to connect email' });
  }

  // Redirect to OAuth start endpoint with purpose=gmail
  res.redirect(`/api/oauth/google/start?brandId=${brandId}&purpose=gmail`);
});

// POST /api/email/accounts/imap/connect (IMAP for Yahoo/iCloud/custom)
app.post('/api/email/accounts/imap/connect', async (req, res) => {
  const brandId = getBrandIdFromRequest(req);
  
  if (brandId === 'all') {
    return res.status(400).json({ code: 'BRAND_REQUIRED', message: 'Please select a specific brand to connect email' });
  }

  const { provider, emailAddress, password, imapHost, imapPort, imapSecure, smtpHost, smtpPort, smtpSecure } = req.body;

  if (!provider || !emailAddress || !password) {
    return res.status(400).json({ code: 'INVALID_REQUEST', message: 'provider, emailAddress, and password are required' });
  }

  if (!['yahoo', 'icloud', 'imap_custom'].includes(provider)) {
    return res.status(400).json({ code: 'INVALID_PROVIDER', message: 'Provider must be yahoo, icloud, or imap_custom' });
  }

  // Default IMAP settings for known providers
  let finalImapHost = imapHost;
  let finalImapPort = imapPort || 993;
  let finalImapSecure = imapSecure !== false; // Default true

  if (provider === 'yahoo') {
    finalImapHost = finalImapHost || 'imap.mail.yahoo.com';
    finalImapPort = 993;
    finalImapSecure = true;
  } else if (provider === 'icloud') {
    finalImapHost = finalImapHost || 'imap.mail.me.com';
    finalImapPort = 993;
    finalImapSecure = true;
  } else if (provider === 'imap_custom') {
    if (!finalImapHost) {
      return res.status(400).json({ code: 'INVALID_REQUEST', message: 'imapHost is required for custom IMAP' });
    }
  }

  // TODO: In production, verify IMAP connection here
  // For MVP, we'll just store the credentials (encrypted in production)
  // For now, we'll simulate a connection test

  const emailAccount: import('./types').EmailAccount = {
    id: generateId(),
    brandId,
    provider: provider as 'yahoo' | 'icloud' | 'imap_custom',
    emailAddress,
    authType: 'password',
    imapHost: finalImapHost,
    imapPort: finalImapPort,
    imapSecure: finalImapSecure,
    smtpHost,
    smtpPort,
    smtpSecure,
    imapPassword: password, // In production, encrypt this
    status: 'connected',
    lastSyncAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  emailAccounts.set(emailAccount.id, emailAccount);
  broadcast({ type: 'email_account_created', data: { id: emailAccount.id, provider: emailAccount.provider } });

  res.status(201).json({
    id: emailAccount.id,
    brandId: emailAccount.brandId,
    provider: emailAccount.provider,
    emailAddress: emailAccount.emailAddress,
    authType: emailAccount.authType,
    status: emailAccount.status,
    createdAt: emailAccount.createdAt,
    updatedAt: emailAccount.updatedAt,
  });
});

// DELETE /api/email/accounts/:id (brand-scoped)
app.delete('/api/email/accounts/:id', (req, res) => {
  const account = emailAccounts.get(req.params.id);
  if (!account) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Email account not found' });
  }

  // Verify brand ownership
  const brandId = getBrandIdFromRequest(req);
  if (brandId !== 'all' && account.brandId !== brandId) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Email account belongs to a different brand' });
  }

  emailAccounts.delete(req.params.id);
  
  // Also delete Google integration if it's Gmail
  if (account.provider === 'gmail') {
    const integration = Array.from(googleIntegrations.values())
      .find(gi => gi.brandId === account.brandId && gi.email === account.emailAddress);
    if (integration) {
      googleIntegrations.delete(integration.id);
    }
  }
  
  broadcast({ type: 'email_account_deleted', data: { id: req.params.id } });
  res.status(204).send();
});

// GET /api/email/threads?limit=20&unreadOnly=true&accountId=...
app.get('/api/email/threads', async (req, res) => {
  const brandId = getBrandIdFromRequest(req);
  
  if (brandId === 'all') {
    // In "all" mode, return empty or aggregate (read-only)
    return res.json({ threads: [], total: 0 });
  }

  const accountId = req.query.accountId as string | undefined;
  
  // Find email account for this brand
  let account: import('./types').EmailAccount | undefined;
  if (accountId) {
    account = emailAccounts.get(accountId);
    if (!account || account.brandId !== brandId) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Email account not found' });
    }
  } else {
    // Find first connected account for this brand
    account = Array.from(emailAccounts.values())
      .find(ea => ea.brandId === brandId && ea.status === 'connected');
  }

  if (!account) {
    return res.status(404).json({ 
      code: 'NO_ACCOUNT', 
      message: 'No email account found for this brand. Please connect an email account first.' 
    });
  }

  try {
    let accessToken: string | undefined;
    
    if (account.provider === 'gmail' && account.authType === 'oauth' && account.oauthToken) {
      // Use Gmail API for OAuth accounts
      const integration = Array.from(googleIntegrations.values())
        .find(gi => gi.brandId === brandId && gi.email === account.emailAddress);
      if (integration) {
        accessToken = await getGoogleAccessToken(integration);
      }
    } else {
      // For IMAP accounts, we'd use IMAP library (not implemented in MVP)
      // For now, return empty or mock data
      return res.json({ threads: [], total: 0 });
    }

    if (!accessToken) {
      return res.status(401).json({ code: 'NO_ACCESS_TOKEN', message: 'Unable to get access token' });
    }
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    // Fetch messages from Gmail API
    let messagesUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${limit}`;
    if (unreadOnly) {
      messagesUrl += '&q=is:unread';
    }

    const messagesResponse = await fetch(messagesUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!messagesResponse.ok) {
      throw new Error(`Gmail API error: ${messagesResponse.statusText}`);
    }

    const messagesData = parseJsonResponse<{ messages?: Array<{ id: string }> }>(await messagesResponse.json());
    const messageIds = messagesData.messages?.map((m) => m.id) || [];

    // Fetch full message details
    const threads: EmailThread[] = [];
    for (const messageId of messageIds.slice(0, limit)) {
      try {
        const messageResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!messageResponse.ok) continue;

        const message = parseJsonResponse<{
          snippet?: string;
          internalDate?: string;
          labelIds?: string[];
          payload?: {
            headers?: Array<{ name: string; value: string }>;
            body?: { data?: string };
            parts?: Array<{ mimeType?: string; body?: { data?: string } }>;
          };
        }>(await messageResponse.json());
        const headers = message.payload?.headers || [];
        
        const fromHeader = headers.find((h) => h.name === 'From');
        const subjectHeader = headers.find((h) => h.name === 'Subject');
        const dateHeader = headers.find((h) => h.name === 'Date');

        const from = fromHeader?.value || 'Unknown';
        const subject = subjectHeader?.value || '(No subject)';
        const snippet = message.snippet || '';
        const date = dateHeader ? new Date(dateHeader.value) : new Date(message.internalDate || Date.now());
        const isUnread = message.labelIds?.includes('UNREAD') || false;

        // Get triage status
        const triageKey = `${brandId}:${messageId}`;
        const triageStatus = emailTriage.get(triageKey);

        threads.push({
          id: messageId,
          accountId: account.id,
          from,
          subject,
          snippet,
          date,
          isUnread,
          triageStatus,
        });
      } catch (err) {
        console.error(`Error fetching message ${messageId}:`, err);
      }
    }

    res.json({ threads, total: threads.length });
  } catch (error) {
    console.error('Error fetching email threads:', error);
    res.status(500).json({ 
      code: 'EMAIL_FETCH_ERROR', 
      message: error instanceof Error ? error.message : 'Failed to fetch emails' 
    });
  }
});

// GET /api/email/messages/:id
app.get('/api/email/messages/:id', async (req, res) => {
  const brandId = getBrandIdFromRequest(req);
  
  if (brandId === 'all') {
    return res.status(400).json({ code: 'BRAND_REQUIRED', message: 'Please select a specific brand to view email details' });
  }

  const integration = Array.from(googleIntegrations.values())
    .find(gi => gi.brandId === brandId);

  if (!integration) {
    return res.status(404).json({ 
      code: 'NO_INTEGRATION', 
      message: 'No Google Workspace integration found for this brand.' 
    });
  }

  try {
    const accessToken = await getGoogleAccessToken(integration);
    const messageId = req.params.id;

    const messageResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!messageResponse.ok) {
      throw new Error(`Gmail API error: ${messageResponse.statusText}`);
    }

    const message = parseJsonResponse<{
      snippet?: string;
      internalDate?: string;
      threadId?: string;
      labelIds?: string[];
      payload?: {
        headers?: Array<{ name: string; value: string }>;
        body?: { data?: string };
        parts?: Array<{ mimeType?: string; body?: { data?: string } }>;
      };
    }>(await messageResponse.json());
    const headers = message.payload?.headers || [];
    
    const fromHeader = headers.find((h) => h.name === 'From');
    const toHeader = headers.find((h) => h.name === 'To');
    const subjectHeader = headers.find((h) => h.name === 'Subject');
    const dateHeader = headers.find((h) => h.name === 'Date');

    const from = fromHeader?.value || 'Unknown';
    const to = toHeader?.value ? toHeader.value.split(',').map((e) => e.trim()) : [];
    const subject = subjectHeader?.value || '(No subject)';
    const date = dateHeader ? new Date(dateHeader.value) : new Date(message.internalDate || Date.now());
    
    // Extract body snippet
    let bodySnippet = message.snippet || '';
    if (message.payload?.body?.data) {
      bodySnippet = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
    } else if (message.payload?.parts) {
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          bodySnippet = Buffer.from(part.body.data, 'base64').toString('utf-8');
          break;
        }
      }
    }

    const isUnread = message.labelIds?.includes('UNREAD') || false;
    const triageKey = `${brandId}:${messageId}`;
    const triageStatus = emailTriage.get(triageKey);

    // Find account for this brand
    const account = Array.from(emailAccounts.values())
      .find(ea => ea.brandId === brandId && ea.status === 'connected');
    
    if (!account) {
      return res.status(404).json({ code: 'NO_ACCOUNT', message: 'No email account found for this brand' });
    }

    const emailMessage: EmailMessage = {
      id: messageId,
      accountId: account.id,
      threadId: message.threadId,
      from,
      to,
      subject,
      date,
      bodySnippet,
      isUnread,
      triageStatus,
    };

    res.json(emailMessage);
  } catch (error) {
    console.error('Error fetching email message:', error);
    res.status(500).json({ 
      code: 'EMAIL_FETCH_ERROR', 
      message: error instanceof Error ? error.message : 'Failed to fetch email' 
    });
  }
});

// ============================================================================
// EMAIL TRIAGE API
// ============================================================================

// PUT /api/email/triage/:messageId
app.put('/api/email/triage/:messageId', (req, res) => {
  const brandId = getBrandIdFromRequest(req);
  
  if (brandId === 'all') {
    return res.status(400).json({ code: 'BRAND_REQUIRED', message: 'Please select a specific brand to set triage status' });
  }

  const { status } = req.body;
  if (!status || !['needs_reply', 'follow_up', 'done'].includes(status)) {
    return res.status(400).json({ 
      code: 'INVALID_STATUS', 
      message: 'Status must be one of: needs_reply, follow_up, done' 
    });
  }

  const messageId = req.params.messageId;
  const triageKey = `${brandId}:${messageId}`;
  emailTriage.set(triageKey, status as TriageStatus);

  res.json({ messageId, status, brandId });
});

// GET /api/email/triage
app.get('/api/email/triage', (req, res) => {
  const brandId = getBrandIdFromRequest(req);
  
  if (brandId === 'all') {
    // Return all triage data (read-only in "all" mode)
    const allTriage: Record<string, TriageStatus> = {};
    for (const [key, status] of emailTriage.entries()) {
      allTriage[key] = status;
    }
    return res.json({ triage: allTriage });
  }

  // Return only triage data for this brand
  const brandTriage: Record<string, TriageStatus> = {};
  for (const [key, status] of emailTriage.entries()) {
    if (key.startsWith(`${brandId}:`)) {
      brandTriage[key] = status;
    }
  }

  res.json({ triage: brandTriage });
});

// ============================================================================
// HEALTH CHECK & AUTH /me (must be before 404 catch-all)
// ============================================================================

// GET /health - minimal health for load balancers / platforms that expect /health
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// GET /api/health
app.get('/api/health', async (req, res) => {
  const payload: { ok: boolean; time: string; version: string; supabase?: string } = {
    ok: true,
    time: new Date().toISOString(),
    version: '1.0.0',
  };
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { checkSupabaseConnection } = await import('./supabase.js');
    payload.supabase = await checkSupabaseConnection();
  }
  res.json(payload);
});

// GET /api/me - used by auth validateToken; returns minimal user for 200
app.get('/api/me', (_req, res) => {
  res.json({ id: 'dev-user', email: 'dev@localhost' });
});

// ---------------------------------------------------------------------------
// POST /api/cron/ingest - Instagram ingestion (guarded by INGEST_SECRET)
// Rate limit: ~1 run per account per 55 minutes. Idempotent upsert by (platform, external_id).
// ---------------------------------------------------------------------------
const ingestLastRun = new Map<string, number>();
const INGEST_RATE_MS = 55 * 60 * 1000;

app.post('/api/cron/ingest', async (req, res) => {
  const secret = req.headers['x-ingest-secret'] || req.headers['authorization']?.replace(/^Bearer /, '');
  const want = process.env.INGEST_SECRET || process.env.CRON_SECRET;
  if (want && secret !== want) {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid or missing secret' });
  }

  type Acc = { id: string; brand_id: string; provider_account_id: string; oauth_access_token: string };
  let accounts: Acc[];

  if (getSupabaseClient()) {
    accounts = await getInstagramAccountsForIngest();
  } else {
    accounts = Array.from(socialAccounts.values())
      .filter((sa) => sa.platform === 'instagram' && sa.oauthToken?.accessToken)
      .map((sa) => ({
        id: sa.id,
        brand_id: sa.brandId,
        provider_account_id: sa.providerAccountId || sa.id,
        oauth_access_token: sa.oauthToken!.accessToken,
      }));
  }

  let ok = 0;
  let skipped = 0;
  for (const acc of accounts) {
    const key = acc.id;
    const last = ingestLastRun.get(key) ?? 0;
    if (Date.now() - last < INGEST_RATE_MS) {
      skipped++;
      continue;
    }
    try {
      const url = `https://graph.facebook.com/v18.0/${acc.provider_account_id}/media?fields=id,caption,media_type,media_url,timestamp&access_token=${encodeURIComponent(acc.oauth_access_token)}`;
      const r = await fetch(url);
      if (!r.ok) continue;
      const json = (await r.json()) as { data?: Array<{ id?: string; caption?: string; media_type?: string; media_url?: string; timestamp?: string }> };
      const list = json.data ?? [];
      for (const item of list) {
        if (item.id) {
          try { await upsertIngestedPost('instagram', item.id, acc.brand_id, item); } catch { /* skip */ }
        }
      }
      ingestLastRun.set(key, Date.now());
      ok++;
    } catch {
      // skip on error
    }
  }

  res.json({ ok, skipped, accounts: accounts.length });
});

// ============================================================================
// ROOT
// ============================================================================

app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'steward-backend' });
});

// ============================================================================
// FALLBACK 404
// ============================================================================

// Fallback 404 handler (must be last)
app.use((req, res) => {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: 'Route not implemented in backend shim',
  });
});

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
