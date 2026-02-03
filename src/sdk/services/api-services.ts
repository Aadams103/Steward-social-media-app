/**
 * API Service Layer
 * Centralized API endpoints for backend integration
 * Replaces mock data with real API calls
 */

import { apiClient, apiRequest } from '../core/api-client';
import type {
  Post,
  Campaign,
  SocialAccount,
  Conversation,
  Alert,
  Organization,
  OrganizationMember,
  OAuthConnection,
  PublishJob,
  QuotaUsage,
  QuotaWarning,
  BrandProfile,
  AutopilotSettings,
  ScheduledSlot,
  WeeklySchedule,
  Asset,
  HashtagRecommendation,
  BestTimeToPost,
  RSSFeed,
  RSSFeedItem,
  RecycledPost,
  TimeZoneOptimization,
  Event,
  AutopilotBrief,
  StrategyPlan,
  Brand,
  Platform,
  GoogleIntegration,
  EmailThread,
  EmailMessage,
  TriageStatus,
  EmailAccount,
} from '@/types/app';

const API_BASE = import.meta.env.VITE_API_BASE_PATH || '/api';

/** Ingested post from platform APIs (e.g. Instagram Graph); real data from cron ingest */
export interface IngestedPost {
  id: string;
  brand_id: string | null;
  platform: string;
  external_id: string;
  payload: Record<string, unknown>;
  fetched_at: string;
}

/**
 * Helper to serialize query parameters into URL
 */
function buildUrlWithParams(baseUrl: string, params?: Record<string, string | number | boolean | undefined>): string {
  if (!params || Object.keys(params).length === 0) {
    return baseUrl;
  }
  
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

// ============================================================================
// POSTS API
// ============================================================================

export const postsApi = {
  list: (params?: { platform?: string; status?: string; campaignId?: string; limit?: number; offset?: number }) =>
    apiClient.get<{ posts: Post[]; total: number }>(buildUrlWithParams(`${API_BASE}/posts`, params)),

  get: (id: string) => apiClient.get<Post>(`${API_BASE}/posts/${id}`),

  create: (post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiClient.post<Post>(`${API_BASE}/posts`, post),

  update: (id: string, updates: Partial<Post>) =>
    apiClient.patch<Post>(`${API_BASE}/posts/${id}`, updates),

  delete: (id: string) => apiClient.delete<void>(`${API_BASE}/posts/${id}`),

  publish: (id: string) => apiClient.post<PublishJob>(`${API_BASE}/posts/${id}/publish`),

  schedule: (id: string, scheduledTime: Date) =>
    apiClient.post<Post>(`${API_BASE}/posts/${id}/schedule`, { scheduledTime }),

  approve: (id: string) => apiClient.post<Post>(`${API_BASE}/posts/${id}/approve`),

  deny: (id: string, reason?: string) =>
    apiClient.post<Post>(`${API_BASE}/posts/${id}/deny`, { reason }),

  getMetrics: (id: string) => apiClient.get<Post['metrics']>(`${API_BASE}/posts/${id}/metrics`),

  bulkCreate: (posts: Array<Omit<Post, 'id' | 'createdAt' | 'updatedAt'>>) =>
    apiClient.post<{
      results: Array<{ success: boolean; post?: Post; error?: string; index: number }>;
      summary: { total: number; successful: number; failed: number };
    }>(`${API_BASE}/posts/bulk`, { posts }),
};

// ============================================================================
// CAMPAIGNS API
// ============================================================================

export const campaignsApi = {
  list: (params?: { status?: string; limit?: number; offset?: number }) =>
    apiClient.get<{ campaigns: Campaign[]; total: number }>(buildUrlWithParams(`${API_BASE}/campaigns`, params)),

  get: (id: string) => apiClient.get<Campaign>(`${API_BASE}/campaigns/${id}`),

  create: (campaign: Omit<Campaign, 'id' | 'postCount' | 'totalEngagement'>) =>
    apiClient.post<Campaign>(`${API_BASE}/campaigns`, campaign),

  update: (id: string, updates: Partial<Campaign>) =>
    apiClient.patch<Campaign>(`${API_BASE}/campaigns/${id}`, updates),

  delete: (id: string) => apiClient.delete<void>(`${API_BASE}/campaigns/${id}`),
};

// ============================================================================
// SOCIAL ACCOUNTS API
// ============================================================================

export const socialAccountsApi = {
  list: (params?: { platform?: string; isConnected?: boolean }) =>
    apiClient.get<{ accounts: SocialAccount[] }>(buildUrlWithParams(`${API_BASE}/social-accounts`, params)),

  get: (id: string) => apiClient.get<SocialAccount>(`${API_BASE}/social-accounts/${id}`),

  create: (account: Omit<SocialAccount, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiClient.post<SocialAccount>(`${API_BASE}/social-accounts`, account),

  sync: (id: string) => apiClient.post<SocialAccount>(`${API_BASE}/social-accounts/${id}/sync`),

  disconnect: (id: string) => apiClient.delete<void>(`${API_BASE}/social-accounts/${id}`),
};

// ============================================================================
// INGESTED POSTS API (real data from Instagram / Facebook ingest)
// ============================================================================

export const ingestedPostsApi = {
  list: (params?: { platform?: string; limit?: number }) =>
    apiClient.get<{ items: IngestedPost[] }>(buildUrlWithParams(`${API_BASE}/ingested-posts`, params)),
};

// ============================================================================
// CONVERSATIONS API
// ============================================================================

export const conversationsApi = {
  list: (params?: { platform?: string; status?: string; limit?: number; offset?: number }) =>
    apiClient.get<{ conversations: Conversation[]; total: number }>(buildUrlWithParams(`${API_BASE}/conversations`, params)),

  get: (id: string) => apiClient.get<Conversation>(`${API_BASE}/conversations/${id}`),

  update: (id: string, updates: Partial<Conversation>) =>
    apiClient.patch<Conversation>(`${API_BASE}/conversations/${id}`, updates),

  reply: (id: string, message: string) =>
    apiClient.post<Conversation>(`${API_BASE}/conversations/${id}/reply`, { message }),

  markRead: (id: string) => apiClient.post<void>(`${API_BASE}/conversations/${id}/read`),

  archive: (id: string) => apiClient.post<void>(`${API_BASE}/conversations/${id}/archive`),
};

// ============================================================================
// ALERTS API
// ============================================================================

export const alertsApi = {
  list: (params?: { platform?: string; isActive?: boolean }) =>
    apiClient.get<{ alerts: Alert[] }>(buildUrlWithParams(`${API_BASE}/alerts`, params)),

  get: (id: string) => apiClient.get<Alert>(`${API_BASE}/alerts/${id}`),

  create: (alert: Omit<Alert, 'id' | 'triggerCount' | 'lastTriggered'>) =>
    apiClient.post<Alert>(`${API_BASE}/alerts`, alert),

  update: (id: string, updates: Partial<Alert>) =>
    apiClient.patch<Alert>(`${API_BASE}/alerts/${id}`, updates),

  delete: (id: string) => apiClient.delete<void>(`${API_BASE}/alerts/${id}`),

  toggle: (id: string, isActive: boolean) =>
    apiClient.patch<Alert>(`${API_BASE}/alerts/${id}`, { isActive }),
};

// ============================================================================
// ORGANIZATIONS API
// ============================================================================

export const organizationsApi = {
  list: () => apiClient.get<{ organizations: Organization[] }>(`${API_BASE}/organizations`),

  get: (id: string) => apiClient.get<Organization>(`${API_BASE}/organizations/${id}`),

  create: (org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiClient.post<Organization>(`${API_BASE}/organizations`, org),

  update: (id: string, updates: Partial<Organization>) =>
    apiClient.patch<Organization>(`${API_BASE}/organizations/${id}`, updates),

  delete: (id: string) => apiClient.delete<void>(`${API_BASE}/organizations/${id}`),

  switch: (id: string) => apiClient.post<Organization>(`${API_BASE}/organizations/${id}/switch`),
};

// ============================================================================
// ORGANIZATION MEMBERS API
// ============================================================================

export const membersApi = {
  list: (organizationId: string) =>
    apiClient.get<{ members: OrganizationMember[] }>(`${API_BASE}/organizations/${organizationId}/members`),

  get: (organizationId: string, memberId: string) =>
    apiClient.get<OrganizationMember>(`${API_BASE}/organizations/${organizationId}/members/${memberId}`),

  invite: (organizationId: string, email: string, role: OrganizationMember['role']) =>
    apiClient.post<OrganizationMember>(`${API_BASE}/organizations/${organizationId}/members/invite`, {
      email,
      role,
    }),

  update: (organizationId: string, memberId: string, updates: Partial<OrganizationMember>) =>
    apiClient.patch<OrganizationMember>(
      `${API_BASE}/organizations/${organizationId}/members/${memberId}`,
      updates,
    ),

  remove: (organizationId: string, memberId: string) =>
    apiClient.delete<void>(`${API_BASE}/organizations/${organizationId}/members/${memberId}`),
};

// ============================================================================
// OAUTH CONNECTIONS API
// ============================================================================

export const oauthApi = {
  list: (organizationId?: string) =>
    apiClient.get<{ connections: OAuthConnection[] }>(
      organizationId ? `${API_BASE}/organizations/${organizationId}/oauth/connections` : `${API_BASE}/oauth/connections`,
    ),

  get: (id: string) => apiClient.get<OAuthConnection>(`${API_BASE}/oauth/connections/${id}`),

  initiate: (platform: string, organizationId: string) =>
    apiClient.post<{ authUrl: string; state: string }>(`${API_BASE}/oauth/initiate`, {
      platform,
      organizationId,
    }),

  callback: (state: string, code: string) =>
    apiClient.post<OAuthConnection>(`${API_BASE}/oauth/callback`, { state, code }),

  refresh: (id: string) => apiClient.post<OAuthConnection>(`${API_BASE}/oauth/connections/${id}/refresh`),

  disconnect: (id: string) => apiClient.delete<void>(`${API_BASE}/oauth/connections/${id}`),

  update: (id: string, updates: Partial<OAuthConnection>) =>
    apiClient.patch<OAuthConnection>(`${API_BASE}/oauth/connections/${id}`, updates),

  toggleAutopost: (id: string, enabled: boolean) =>
    apiClient.patch<OAuthConnection>(`${API_BASE}/oauth/connections/${id}/autopost`, { enabled }),
};

// ============================================================================
// PUBLISH JOBS API
// ============================================================================

export const publishJobsApi = {
  list: (params?: { organizationId?: string; status?: string; limit?: number; offset?: number }) =>
    apiClient.get<{ jobs: PublishJob[]; total: number }>(buildUrlWithParams(`${API_BASE}/publish-jobs`, params)),

  get: (id: string) => apiClient.get<PublishJob>(`${API_BASE}/publish-jobs/${id}`),

  create: (job: Omit<PublishJob, 'id' | 'createdAt' | 'updatedAt' | 'attemptCount'>) =>
    apiClient.post<PublishJob>(`${API_BASE}/publish-jobs`, job),

  retry: (id: string) => apiClient.post<PublishJob>(`${API_BASE}/publish-jobs/${id}/retry`),

  cancel: (id: string) => apiClient.post<PublishJob>(`${API_BASE}/publish-jobs/${id}/cancel`),
};

// ============================================================================
// QUOTA API
// ============================================================================

export const quotaApi = {
  getUsage: (organizationId: string) =>
    apiClient.get<{ usage: QuotaUsage[] }>(`${API_BASE}/organizations/${organizationId}/quota/usage`),

  getWarnings: (organizationId: string) =>
    apiClient.get<{ warnings: QuotaWarning[] }>(`${API_BASE}/organizations/${organizationId}/quota/warnings`),

  acknowledgeWarning: (organizationId: string, warningId: string) =>
    apiClient.post<void>(`${API_BASE}/organizations/${organizationId}/quota/warnings/${warningId}/acknowledge`),
};

// ============================================================================
// AUTOPILOT API
// ============================================================================

export const autopilotApi = {
  getBrandProfile: (organizationId: string) =>
    apiClient.get<BrandProfile>(`${API_BASE}/organizations/${organizationId}/autopilot/brand-profile`),

  updateBrandProfile: (organizationId: string, profile: Partial<BrandProfile>) =>
    apiClient.patch<BrandProfile>(`${API_BASE}/organizations/${organizationId}/autopilot/brand-profile`, profile),

  getSettings: (organizationId: string) =>
    apiClient.get<AutopilotSettings>(`${API_BASE}/organizations/${organizationId}/autopilot/settings`),

  updateSettings: (organizationId: string, settings: Partial<AutopilotSettings>) =>
    apiClient.patch<AutopilotSettings>(`${API_BASE}/organizations/${organizationId}/autopilot/settings`, settings),

  getScheduledSlots: (organizationId: string, params?: { weekStart?: Date; weekEnd?: Date }) => {
    const queryParams: Record<string, string> = {};
    if (params?.weekStart) queryParams.weekStart = params.weekStart.toISOString();
    if (params?.weekEnd) queryParams.weekEnd = params.weekEnd.toISOString();
    return apiClient.get<{ slots: ScheduledSlot[] }>(buildUrlWithParams(`${API_BASE}/organizations/${organizationId}/autopilot/slots`, queryParams));
  },

  getWeeklySchedule: (organizationId: string, weekStart: Date) =>
    apiClient.get<WeeklySchedule>(`${API_BASE}/organizations/${organizationId}/autopilot/schedule`, {
      headers: {
        'Content-Type': 'application/json',
      },
    }),

  approveSlot: (organizationId: string, slotId: string) =>
    apiClient.post<ScheduledSlot>(`${API_BASE}/organizations/${organizationId}/autopilot/slots/${slotId}/approve`),

  denySlot: (organizationId: string, slotId: string, reason?: string) =>
    apiClient.post<ScheduledSlot>(`${API_BASE}/organizations/${organizationId}/autopilot/slots/${slotId}/deny`, {
      reason,
    }),

  regenerateSchedule: (organizationId: string) =>
    apiClient.post<WeeklySchedule>(`${API_BASE}/organizations/${organizationId}/autopilot/schedule/regenerate`),
};

// ============================================================================
// ASSETS API
// ============================================================================

export const assetsApi = {
  list: (params?: { type?: string; search?: string; tags?: string | string[] }) => {
    // Convert tags array to query params if needed
    const queryParams: Record<string, string | number | boolean | undefined> = {};
    if (params) {
      if (params.type) queryParams.type = params.type;
      if (params.search) queryParams.search = params.search;
      if (params.tags) {
        // Handle tags as array - backend will handle parsing
        queryParams.tags = Array.isArray(params.tags) ? params.tags.join(',') : params.tags;
      }
    }
    return apiClient.get<{ assets: Asset[]; total: number }>(buildUrlWithParams(`${API_BASE}/assets`, queryParams));
  },

  get: (id: string) => apiClient.get<Asset>(`${API_BASE}/assets/${id}`),

  create: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiClient.post<Asset>(`${API_BASE}/assets`, asset),

  upload: (files: File[], tags?: string[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (tags && tags.length > 0) {
      formData.append('tags', tags.join(','));
    }
    return apiRequest<{ assets: Asset[] }>(`${API_BASE}/assets/upload`, {
      method: 'POST',
      body: formData,
    });
  },

  update: (id: string, updates: Partial<Asset>) =>
    apiClient.patch<Asset>(`${API_BASE}/assets/${id}`, updates),

  delete: (id: string) => apiClient.delete<void>(`${API_BASE}/assets/${id}`),
};

// ============================================================================
// HASHTAG RECOMMENDATIONS API
// ============================================================================

export const hashtagsApi = {
  getRecommendations: (content: string, platform?: string) =>
    apiClient.get<{ recommendations: HashtagRecommendation[]; total: number }>(
      buildUrlWithParams(`${API_BASE}/hashtags/recommendations`, { content, platform })
    ),
};

// ============================================================================
// RSS FEED IMPORT API
// ============================================================================

export const rssFeedsApi = {
  list: () => apiClient.get<{ feeds: RSSFeed[]; total: number }>(`${API_BASE}/rss-feeds`),

  get: (id: string) => apiClient.get<RSSFeed>(`${API_BASE}/rss-feeds/${id}`),

  create: (feed: Omit<RSSFeed, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiClient.post<RSSFeed>(`${API_BASE}/rss-feeds`, feed),

  update: (id: string, updates: Partial<RSSFeed>) =>
    apiClient.patch<RSSFeed>(`${API_BASE}/rss-feeds/${id}`, updates),

  delete: (id: string) => apiClient.delete<void>(`${API_BASE}/rss-feeds/${id}`),

  import: (id: string) =>
    apiClient.post<{ items: RSSFeedItem[]; count: number }>(`${API_BASE}/rss-feeds/${id}/import`),

  getItems: (id: string) =>
    apiClient.get<{ items: RSSFeedItem[]; total: number }>(`${API_BASE}/rss-feeds/${id}/items`),
};

// ============================================================================
// ANALYTICS API
// ============================================================================

export const analyticsApi = {
  getBestTimeToPost: (platform?: string) =>
    apiClient.get<{ bestTimes: BestTimeToPost[]; total: number }>(
      buildUrlWithParams(`${API_BASE}/analytics/best-time-to-post`, platform ? { platform } : undefined)
    ),
};

// ============================================================================
// SCHEDULING API
// ============================================================================

export const schedulingApi = {
  getTimezoneOptimization: (platform: string, timezone: string, audienceTimezone?: string) =>
    apiClient.get<TimeZoneOptimization>(
      buildUrlWithParams(`${API_BASE}/scheduling/timezone-optimization`, { platform, timezone, audienceTimezone })
    ),
};

// ============================================================================
// CONTENT RECYCLING API
// ============================================================================

export const recyclingApi = {
  recyclePost: (postId: string) =>
    apiClient.post<{ recycledPost: RecycledPost; newPost: Post; recycleCount: number }>(
      `${API_BASE}/posts/${postId}/recycle`
    ),

  getRecycledPosts: () =>
    apiClient.get<{ recycledPosts: RecycledPost[]; total: number }>(`${API_BASE}/posts/recycled`),
};

// ============================================================================
// EVENTS API
// ============================================================================

export const eventsApi = {
  list: (params?: { from?: string; to?: string }) =>
    apiClient.get<{ events: Event[]; total: number }>(buildUrlWithParams(`${API_BASE}/events`, params)),

  get: (id: string) => apiClient.get<Event>(`${API_BASE}/events/${id}`),

  create: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>) =>
    apiClient.post<Event>(`${API_BASE}/events`, event),

  generateDrafts: (id: string) =>
    apiClient.post<{ posts: Post[]; count: number }>(`${API_BASE}/events/${id}/generate-drafts`),
};

// ============================================================================
// AUTOPILOT BRIEF API
// ============================================================================

export const autopilotBriefApi = {
  get: () => apiClient.get<AutopilotBrief>(`${API_BASE}/autopilot/brief`),

  update: (brief: Partial<AutopilotBrief>) =>
    apiClient.put<AutopilotBrief>(`${API_BASE}/autopilot/brief`, brief),

  generatePlan: () =>
    apiClient.post<StrategyPlan>(`${API_BASE}/autopilot/plan`),

  generate: (params: { from?: string; to?: string }) =>
    apiClient.post<import('@/types/app').AutopilotGenerateResponse>(`${API_BASE}/autopilot/generate`, params),
};

// ============================================================================
// BRANDS API
// ============================================================================

export const brandsApi = {
  list: () => apiClient.get<{ brands: Brand[] }>(`${API_BASE}/brands`),

  get: (id: string) => apiClient.get<Brand>(`${API_BASE}/brands/${id}`),

  create: (brand: Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiClient.post<Brand>(`${API_BASE}/brands`, brand),

  update: (id: string, updates: Partial<Brand>) =>
    apiClient.put<Brand>(`${API_BASE}/brands/${id}`, updates),

  delete: (id: string) => apiClient.delete<void>(`${API_BASE}/brands/${id}`),

  getCurrent: () => apiClient.get<Brand>(`${API_BASE}/brands/current`),

  setCurrent: (brandId: string) =>
    apiClient.put<Brand>(`${API_BASE}/brands/current`, { brandId }),

  uploadAvatar: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest<{ avatarUrl: string }>(`${API_BASE}/brands/${id}/avatar`, {
      method: 'POST',
      body: formData,
    });
  },

  deleteAvatar: (id: string) =>
    apiClient.delete<{ avatarUrl?: string }>(`${API_BASE}/brands/${id}/avatar`),
};

// ============================================================================
// GOOGLE INTEGRATION API
// ============================================================================

export const googleIntegrationApi = {
  list: () => apiClient.get<{ integrations: GoogleIntegration[] }>(`${API_BASE}/integrations/google`),

  delete: (id: string) => apiClient.delete<void>(`${API_BASE}/integrations/google/${id}`),
};

// ============================================================================
// EMAIL API
// ============================================================================

export const emailApi = {
  getAccounts: () => apiClient.get<{ accounts: EmailAccount[] }>(`${API_BASE}/email/accounts`),

  deleteAccount: (id: string) => apiClient.delete(`${API_BASE}/email/accounts/${id}`),

  getThreads: (params?: { limit?: number; unreadOnly?: boolean }) =>
    apiClient.get<{ threads: EmailThread[]; total: number }>(buildUrlWithParams(`${API_BASE}/email/threads`, params)),

  getMessage: (id: string) => apiClient.get<EmailMessage>(`${API_BASE}/email/messages/${id}`),

  setTriage: (messageId: string, status: TriageStatus) =>
    apiClient.put<{ messageId: string; status: TriageStatus; brandId: string }>(
      `${API_BASE}/email/triage/${messageId}`,
      { status }
    ),

  getTriage: () => apiClient.get<{ triage: Record<string, TriageStatus> }>(`${API_BASE}/email/triage`),
};

// ============================================================================
// SCHEDULE TEMPLATES API
// ============================================================================

export interface BusinessScheduleTemplate {
  id: string;
  brandId: string;
  title: string;
  daysOfWeek: number[]; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  durationMinutes: number;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarItem {
  id: string;
  kind: 'business_event' | 'post';
  title: string;
  startAt: string; // ISO string
  endAt?: string; // ISO string (optional)
  platform?: Platform; // Only for kind=post
  postId?: string; // Only for kind=post
  meta?: Record<string, unknown>;
}

export const scheduleTemplatesApi = {
  list: () => apiClient.get<{ templates: BusinessScheduleTemplate[] }>(`${API_BASE}/schedule/templates`),

  create: (template: Omit<BusinessScheduleTemplate, 'id' | 'brandId' | 'createdAt' | 'updatedAt'>) =>
    apiClient.post<BusinessScheduleTemplate>(`${API_BASE}/schedule/templates`, template),

  update: (id: string, updates: Partial<BusinessScheduleTemplate>) =>
    apiClient.put<BusinessScheduleTemplate>(`${API_BASE}/schedule/templates/${id}`, updates),

  delete: (id: string) => apiClient.delete<void>(`${API_BASE}/schedule/templates/${id}`),
};

export const calendarApi = {
  getItems: (params: { from: string; to: string }) =>
    apiClient.get<{ items: CalendarItem[] }>(buildUrlWithParams(`${API_BASE}/calendar`, params)),
};