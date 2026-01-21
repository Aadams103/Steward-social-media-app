/**
 * Type definitions for backend shim
 * Simplified versions matching frontend types
 */

export type Platform = 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'pinterest' | 'reddit' | 'slack' | 'notion';
export type PostStatus = 'draft' | 'needs_approval' | 'approved' | 'scheduled' | 'published' | 'failed';
export type PublishJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'retrying';
export type OperatingMode = 'manual' | 'approval' | 'autopilot';
export type ApprovalWindow = '30m' | '2h' | '12h' | '24h';

export type RecurrencePattern = 'daily' | 'weekly' | 'monthly';

export interface RecurrenceSchedule {
  pattern: RecurrencePattern;
  interval: number;
  startDate: Date;
  endDate?: Date;
  daysOfWeek?: number[];
  dayOfMonth?: number;
}

export interface Post {
  id: string;
  content: string;
  platform: Platform;
  status: PostStatus;
  scheduledTime?: Date;
  publishedTime?: Date;
  publishedId?: string;
  campaignId?: string;
  authorId: string;
  brandId?: string; // Brand scoping
  mediaUrls?: string[];
  hashtags?: string[];
  metrics?: PostMetrics;
  recurrenceSchedule?: RecurrenceSchedule;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostMetrics {
  impressions: number;
  reach: number;
  engagement: number;
  clicks: number;
  likes: number;
  comments: number;
  shares: number;
  views?: number;
}

export interface HashtagRecommendation {
  hashtag: string;
  relevance: number;
  category?: string;
  popularity?: number;
}

export interface BestTimeToPost {
  platform: Platform;
  dayOfWeek: number;
  hour: number;
  score: number;
  engagementRate?: number;
}

export interface RSSFeed {
  id: string;
  name: string;
  url: string;
  platform: Platform;
  autoImport: boolean;
  lastFetched?: Date;
  lastItemCount?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RSSFeedItem {
  id: string;
  feedId: string;
  title: string;
  description: string;
  link: string;
  publishedAt: Date;
  author?: string;
  categories?: string[];
  imported: boolean;
  createdAt: Date;
}

export interface RecycledPost {
  id: string;
  originalPostId: string;
  content: string;
  platform: Platform;
  scheduledTime?: Date;
  publishedTime?: Date;
  recycleCount: number;
  lastRecycledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeZoneOptimization {
  platform: Platform;
  timezone: string;
  optimalTimes: Array<{
    dayOfWeek: number;
    hour: number;
    score: number;
  }>;
  audienceTimezone?: string;
  recommendedSchedule?: Date[];
}

export interface PublishJob {
  id: string;
  organizationId: string;
  connectionId: string;
  platform: Platform;
  postContent: {
    text: string;
    hashtags?: string[];
    linkUrl?: string;
  };
  status: PublishJobStatus;
  priority: number;
  scheduledAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  attemptCount: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  retryBackoffMs: number;
  publishedPostId?: string;
  publishedUrl?: string;
  errorCode?: string;
  errorMessage?: string;
  brandId?: string; // Brand scoping
  createdAt: Date;
  createdByUserId: string;
  updatedAt: Date;
}

export interface AutopilotSettings {
  operatingMode: OperatingMode;
  approvalWindow: ApprovalWindow;
  noResponseAction: 'auto_post' | 'hold';
  timezone: string;
  quietHoursStart: string;
  quietHoursEnd: string;
  blackoutDates: Date[];
  platformCadence: Record<Platform, number>;
  enableWebResearch: boolean;
  enableImageGeneration: boolean;
  notificationChannels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    slack: boolean;
  };
  isPaused: boolean;
  pausedAt?: Date;
  pauseReason?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  billingPlan: string;
  billingStatus: string;
  settings: {
    timezone: string;
    defaultApprovalWindow: string;
    autoEnableNewAccounts: boolean;
    requireMfaForPublishing: boolean;
  };
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  goal?: string;
  postCount: number;
  totalEngagement: number;
  status: 'active' | 'paused' | 'completed';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SocialAccount {
  id: string;
  brandId: string; // Brand scoping
  platform: Platform;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isConnected: boolean;
  status: 'connected' | 'disconnected' | 'error' | 'stub'; // Status field
  lastSync?: Date;
  followerCount?: number;
  organizationId: string;
  // OAuth connection fields
  providerAccountId?: string; // External provider account ID (e.g., YouTube channel ID, FB Page ID)
  oauthToken?: {
    accessToken: string; // Short-lived
    refreshToken: string; // Server-side only, never returned to client
    expiresAt: Date;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export type AssetType = 'image' | 'video' | 'template' | 'hashtags';

export interface Asset {
  id: string;
  type: AssetType;
  brandId?: string;
  url?: string;
  metadata?: {
    filename?: string;
    width?: number;
    height?: number;
    duration?: number;
    size?: number;
    mimeType?: string;
    [key: string]: unknown;
  };
  version: string;
  tags?: string[];
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  title: string;
  eventDate: string; // YYYY-MM-DD
  postWhen: 'same-day' | 'next-day' | string; // ISO datetime if custom
  notes?: string;
  assetIds: string[];
  organizationId: string;
  brandId?: string; // Brand scoping
  createdAt: Date;
  updatedAt: Date;
}

export type SubjectType = 'business' | 'creator' | 'mixed';
export type PrimaryGoal = 'brand_awareness' | 'leads' | 'sales' | 'community' | 'traffic' | 'bookings';

export interface PlatformConfig {
  platform: 'instagram' | 'tiktok' | 'facebook' | 'linkedin' | 'youtube_shorts' | 'x' | 'pinterest';
  priority: 1 | 2 | 3;
  postingCadencePerWeek: number;
}

export interface VoiceConfig {
  tone: string; // e.g., "confident, friendly, funny"
  doSay?: string[];
  dontSay?: string[];
}

export interface BrandAssets {
  colors?: string[];
  handles?: Record<string, string>; // platform -> handle
  hashtags?: string[];
}

export interface Constraints {
  complianceNotes?: string;
  noFaceKids?: boolean;
  noClientNames?: boolean;
}

export interface AutopilotBrief {
  id: string;
  orgId: string;
  brandId?: string; // Brand scoping
  brandName: string;
  subjectType: SubjectType;
  industry: string;
  primaryGoal: PrimaryGoal;
  secondaryGoals: string[];
  targetAudience: string;
  offer: string;
  location?: string;
  platforms: PlatformConfig[];
  voice: VoiceConfig;
  brandAssets: BrandAssets;
  constraints: Constraints;
  successMetrics: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentPillar {
  name: string;
  description: string;
  examples: string[];
}

export interface WeeklyCadence {
  platform: string;
  postTypes: string[];
  postsPerWeek: number;
}

export interface StarterPlanItem {
  date: string; // YYYY-MM-DD
  platform: string;
  postIdea: string;
  assetSuggestion?: string;
}

export interface StrategyPlan {
  contentPillars: ContentPillar[];
  weeklyCadence: WeeklyCadence[];
  recommendedPostTypes: string[];
  ctaGuidance: string;
  thirtyDayStarterPlan: StarterPlanItem[];
}

// Autopilot Generate Response Types
export interface AutopilotDraftPost {
  id: string;
  platform: Platform;
  contentType: string;
  caption: string;
  hashtags?: string[];
  notes?: string;
  recommendedTime?: string;
}

export interface AutopilotCalendarSuggestion {
  id: string;
  date: string; // YYYY-MM-DD
  platform: Platform;
  title: string;
  summary: string;
  contentType: string;
}

export interface AutopilotPlanSummary {
  overview: string;
  pillars: string[];
  cadence: {
    platform: Platform;
    postsPerWeek: number;
    notes?: string;
  }[];
}

export interface AutopilotGenerateResponse {
  plan: AutopilotPlanSummary;
  calendar: AutopilotCalendarSuggestion[];
  drafts: AutopilotDraftPost[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  avatarUrl?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// GOOGLE INTEGRATION TYPES
// ============================================================================

export interface GoogleIntegration {
  id: string;
  brandId: string;
  provider: 'google';
  email: string;
  scopes: string[];
  token: {
    accessToken: string;
    accessTokenExpiresAt: Date;
    refreshToken: string; // Server-side only, never returned to client
  };
  createdAt: Date;
  updatedAt: Date;
}

// Client-safe version (no tokens)
export interface GoogleIntegrationPublic {
  id: string;
  brandId: string;
  provider: 'google';
  email: string;
  scopes: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// GOOGLE BUSINESS PROFILE TYPES
// ============================================================================

export interface GoogleBusinessProfileLocation {
  locationId: string;
  locationName: string;
  address?: string;
  phoneNumber?: string;
  category?: string;
}

export interface GoogleConnection {
  id: string;
  brandId: string;
  provider: 'google';
  scopes: string[];
  accessToken: string; // Short-lived
  refreshToken: string; // Server-side only, never returned to client
  tokenExpiry: Date;
  googleAccountEmail: string;
  gbpAccounts: string[]; // Account IDs
  gbpLocations: GoogleBusinessProfileLocation[];
  selectedLocationId?: string; // Default location
  createdAt: Date;
  updatedAt: Date;
}

// Client-safe version (no tokens)
export interface GoogleConnectionPublic {
  id: string;
  brandId: string;
  provider: 'google';
  scopes: string[];
  googleAccountEmail: string;
  gbpAccounts: string[];
  gbpLocations: GoogleBusinessProfileLocation[];
  selectedLocationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoogleBusinessProfilePost {
  id: string;
  locationId: string;
  postType: 'update' | 'offer' | 'event';
  summary: string;
  mediaUrls?: string[];
  callToActionUrl?: string;
  callToActionText?: string;
  eventStartTime?: Date;
  eventEndTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// EMAIL TYPES
// ============================================================================

export interface EmailAccount {
  id: string;
  brandId: string;
  provider: 'gmail' | 'yahoo' | 'icloud' | 'imap_custom';
  emailAddress: string;
  authType: 'oauth' | 'password'; // password == app password
  imapHost?: string;
  imapPort?: number;
  imapSecure?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  // OAuth tokens (server-side only, never returned to client)
  oauthToken?: {
    accessToken: string;
    accessTokenExpiresAt: Date;
    refreshToken: string;
  };
  // IMAP password (encrypted, server-side only)
  imapPassword?: string;
  status: 'connected' | 'error' | 'disconnected';
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Client-safe version (no tokens/passwords)
export interface EmailAccountPublic {
  id: string;
  brandId: string;
  provider: 'gmail' | 'yahoo' | 'icloud' | 'imap_custom';
  emailAddress: string;
  authType: 'oauth' | 'password';
  status: 'connected' | 'error' | 'disconnected';
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailThread {
  id: string;
  accountId: string;
  from: string;
  subject: string;
  snippet: string;
  date: Date;
  isUnread: boolean;
  triageStatus?: 'needs_reply' | 'follow_up' | 'done';
}

export interface EmailMessage {
  id: string;
  accountId: string;
  threadId?: string;
  from: string;
  to: string[];
  subject: string;
  date: Date;
  bodySnippet: string;
  isUnread: boolean;
  triageStatus?: 'needs_reply' | 'follow_up' | 'done';
}

export type TriageStatus = 'needs_reply' | 'follow_up' | 'done';

// ============================================================================
// BUSINESS SCHEDULE TYPES
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