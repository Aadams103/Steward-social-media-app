// Application-level types for the Social Media Marketing Platform
// Autopilot AI Social Media Manager

// Operating Modes
export type OperatingMode = 'manual' | 'approval' | 'autopilot';

export const OPERATING_MODES: { id: OperatingMode; label: string; description: string }[] = [
  { id: 'manual', label: 'Manual Mode', description: 'User requests generation and manually publishes/schedules' },
  { id: 'approval', label: 'Approval Mode', description: 'AI runs automatically, but every post requires user approval' },
  { id: 'autopilot', label: 'Autopilot Mode', description: 'AI runs and publishes automatically on schedule' },
];

// Approval Window Options
export type ApprovalWindow = '30m' | '2h' | '12h' | '24h';

export const APPROVAL_WINDOWS: { id: ApprovalWindow; label: string; minutes: number }[] = [
  { id: '30m', label: '30 minutes', minutes: 30 },
  { id: '2h', label: '2 hours', minutes: 120 },
  { id: '12h', label: '12 hours', minutes: 720 },
  { id: '24h', label: '24 hours', minutes: 1440 },
];

// Platform types
export type Platform = 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'pinterest';

export const PLATFORMS: { id: Platform; label: string; color: string }[] = [
  { id: 'facebook', label: 'Facebook', color: 'bg-blue-600' },
  { id: 'instagram', label: 'Instagram', color: 'bg-pink-500' },
  { id: 'linkedin', label: 'LinkedIn', color: 'bg-blue-700' },
  { id: 'tiktok', label: 'TikTok', color: 'bg-black' },
  { id: 'pinterest', label: 'Pinterest', color: 'bg-red-600' },
];

// Post status types
export type PostStatus = 'draft' | 'needs_approval' | 'approved' | 'scheduled' | 'published' | 'failed';

export const POST_STATUSES: { id: PostStatus; label: string; color: string }[] = [
  { id: 'draft', label: 'Draft', color: 'bg-gray-500' },
  { id: 'needs_approval', label: 'Needs Approval', color: 'bg-yellow-500' },
  { id: 'approved', label: 'Approved', color: 'bg-green-500' },
  { id: 'scheduled', label: 'Scheduled', color: 'bg-blue-500' },
  { id: 'published', label: 'Published', color: 'bg-emerald-500' },
  { id: 'failed', label: 'Failed', color: 'bg-red-500' },
];

// User roles
export type UserRole = 'owner' | 'admin' | 'manager' | 'publisher' | 'analyst';

export const USER_ROLES: { id: UserRole; label: string; permissions: string[] }[] = [
  { id: 'owner', label: 'Owner', permissions: ['all'] },
  { id: 'admin', label: 'Admin', permissions: ['manage_users', 'manage_accounts', 'publish', 'approve', 'analytics'] },
  { id: 'manager', label: 'Manager', permissions: ['approve', 'publish', 'analytics'] },
  { id: 'publisher', label: 'Publisher', permissions: ['publish', 'analytics'] },
  { id: 'analyst', label: 'Analyst', permissions: ['analytics'] },
];

// Conversation types
export type MessageType = 'comment' | 'mention' | 'dm';
export type ConversationStatus = 'unread' | 'read' | 'replied' | 'archived';

// View types for calendar
export type CalendarView = 'day' | 'week' | 'month';

// Navigation items
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

// Platform-specific character limits
export const PLATFORM_LIMITS: Record<Platform, { maxChars: number; maxMedia: number; videoAllowed: boolean }> = {
  facebook: { maxChars: 63206, maxMedia: 10, videoAllowed: true },
  instagram: { maxChars: 2200, maxMedia: 10, videoAllowed: true },
  linkedin: { maxChars: 3000, maxMedia: 9, videoAllowed: true },
  tiktok: { maxChars: 2200, maxMedia: 1, videoAllowed: true },
  pinterest: { maxChars: 500, maxMedia: 5, videoAllowed: true },
};

// Post interface for UI
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
  mediaUrls?: string[];
  hashtags?: string[];
  metrics?: PostMetrics;
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

// Campaign interface
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
}

// Social account interface
export interface SocialAccount {
  id: string;
  platform: Platform;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isConnected: boolean;
  lastSync?: Date;
  followerCount?: number;
}

// Conversation interface
export interface Conversation {
  id: string;
  platform: Platform;
  messageType: MessageType;
  content: string;
  authorName: string;
  authorAvatar?: string;
  status: ConversationStatus;
  assignedTo?: string;
  threadId?: string;
  createdAt: Date;
  postId?: string;
}

// Alert interface for social listening
export interface Alert {
  id: string;
  keyword: string;
  platform: Platform;
  triggerCount: number;
  isActive: boolean;
  lastTriggered?: Date;
}

// Analytics summary
export interface AnalyticsSummary {
  totalImpressions: number;
  totalReach: number;
  totalEngagement: number;
  totalClicks: number;
  avgEngagementRate: number;
  topPosts: Post[];
  platformBreakdown: Record<Platform, PostMetrics>;
}

// ==========================================
// AUTOPILOT AI SOCIAL MEDIA MANAGER TYPES
// ==========================================

// Brand/Business Profile - Source of truth for AI
export interface BrandProfile {
  id: string;
  brandName: string;
  industry: string;
  audience: string;
  location: string;

  // Voice & Writing Rules
  brandVoice: string;
  writingDos: string[];
  writingDonts: string[];

  // Business Details
  offers: string[];
  services: string[];
  prices?: string;
  ctaLinks: { label: string; url: string }[];

  // Visual Style
  primaryColors: string[];
  secondaryColors: string[];
  visualVibe: string;
  doNotUseImagery: string[];

  // Goals
  postingGoals: PostingGoal[];
  contentPillars: string[]; // 3-6 themes

  // Compliance
  bannedWords: string[];
  bannedClaims: string[];
  complianceNotes: string;

  updatedAt: Date;
}

export type PostingGoal = 'growth' | 'leads' | 'community' | 'sales' | 'hiring' | 'awareness';

export const POSTING_GOALS: { id: PostingGoal; label: string; icon: string }[] = [
  { id: 'growth', label: 'Audience Growth', icon: 'TrendingUp' },
  { id: 'leads', label: 'Lead Generation', icon: 'Target' },
  { id: 'community', label: 'Community Building', icon: 'Users' },
  { id: 'sales', label: 'Drive Sales', icon: 'DollarSign' },
  { id: 'hiring', label: 'Hiring/Recruitment', icon: 'Briefcase' },
  { id: 'awareness', label: 'Brand Awareness', icon: 'Eye' },
];

// Autopilot Settings
export interface AutopilotSettings {
  operatingMode: OperatingMode;
  approvalWindow: ApprovalWindow;
  noResponseAction: 'auto_post' | 'hold'; // Autopilot = auto_post, Approval = hold

  // Scheduling preferences
  timezone: string;
  quietHoursStart: string; // HH:mm
  quietHoursEnd: string;
  blackoutDates: Date[];

  // Platform cadence (posts per week)
  platformCadence: Record<Platform, number>;

  // Content preferences
  enableWebResearch: boolean;
  enableImageGeneration: boolean;

  // Notification channels
  notificationChannels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    slack: boolean;
  };

  // Safety
  isPaused: boolean;
  pausedAt?: Date;
  pauseReason?: string;
}

// Scheduled Post Slot in Queue
export interface ScheduledSlot {
  id: string;
  platform: Platform;
  scheduledTime: Date;
  contentPillar: string;

  // Generated content
  generatedPostId?: string;
  primaryCaption?: string;
  hashtagsGenerated?: string[];
  ctaLink?: string;

  // Variants
  variantA?: PostVariant; // Conversion focused
  variantB?: PostVariant; // Story/Community focused

  // Media
  mediaSource: 'uploaded' | 'generated' | 'none';
  mediaUrl?: string;

  // Status
  status: 'pending_generation' | 'generated' | 'pending_approval' | 'approved' | 'denied' | 'published' | 'failed';
  approvalDeadline?: Date;

  // Feedback
  denialReason?: string;
  editedContent?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface PostVariant {
  id: string;
  type: 'conversion' | 'story';
  caption: string;
  hashtags: string[];
  cta?: string;
}

// Notification for approval workflow
export interface AutopilotNotification {
  id: string;
  type: 'pending_approval' | 'published' | 'failed' | 'denied' | 'reminder';
  slotId: string;
  platform: Platform;

  // Preview data
  caption: string;
  mediaPreviewUrl?: string;
  scheduledTime: Date;

  // Actions available
  actions: NotificationAction[];

  // Status
  isRead: boolean;
  isActioned: boolean;
  actionTaken?: 'approved' | 'denied' | 'edited' | 'rescheduled' | 'posted_now';

  createdAt: Date;
  expiresAt?: Date;
}

export type NotificationAction = 'approve' | 'deny' | 'edit' | 'post_now' | 'reschedule' | 'dismiss';

// Audit Log Entry
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: AuditAction;
  actorType: 'user' | 'autopilot';
  actorId?: string;

  // Details
  resourceType: 'post' | 'slot' | 'brand_profile' | 'settings' | 'notification' | 'connection' | 'organization' | 'publish_job';
  resourceId: string;
  details: string;
  metadata?: Record<string, unknown>;

  // Result
  success: boolean;
  errorMessage?: string;
}

export type AuditAction =
  | 'content_generated'
  | 'post_approved'
  | 'post_denied'
  | 'post_edited'
  | 'post_published'
  | 'post_failed'
  | 'post_rescheduled'
  | 'schedule_generated'
  | 'schedule_locked'
  | 'schedule_regenerated'
  | 'settings_changed'
  | 'brand_profile_updated'
  | 'autopilot_paused'
  | 'autopilot_resumed'
  | 'emergency_stop'
  | 'account_connected'
  | 'account_disconnected'
  | 'autopost_enabled'
  | 'autopost_disabled'
  | 'token_refreshed'
  | 'token_expired'
  | 'publish_job_queued'
  | 'publish_job_completed'
  | 'publish_job_failed';

// Weekly Schedule View
export interface WeeklySchedule {
  weekStart: Date;
  weekEnd: Date;
  isLocked: boolean;
  slots: ScheduledSlot[];
  contentPillarRotation: string[];
}

// Content Generation Request
export interface ContentGenerationRequest {
  slotId: string;
  platform: Platform;
  contentPillar: string;
  brandProfile: BrandProfile;

  // Optional inputs
  uploadedMediaUrls?: string[];
  trendHooks?: string[];
  seasonalAngles?: string[];

  // Generation preferences
  includeHashtags: boolean;
  includeCta: boolean;
  generateVariants: boolean;
  generateImage: boolean;
}

// Campaign Window for promos/events
export interface CampaignWindow {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  priority: 'high' | 'normal';
  contentPillarOverride?: string;
  notes: string;
}

// ==========================================
// MULTI-TENANT OAUTH TYPES
// ==========================================

// Supported OAuth platforms
export type OAuthPlatform = 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'youtube' | 'linkedin' | 'pinterest';

export const OAUTH_PLATFORMS: { id: OAuthPlatform; label: string; color: string; icon: string }[] = [
  { id: 'facebook', label: 'Facebook', color: 'bg-blue-600', icon: 'Facebook' },
  { id: 'instagram', label: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500', icon: 'Instagram' },
  { id: 'tiktok', label: 'TikTok', color: 'bg-black', icon: 'TikTok' },
  { id: 'twitter', label: 'Twitter/X', color: 'bg-blue-500', icon: 'Twitter' },
  { id: 'youtube', label: 'YouTube', color: 'bg-red-500', icon: 'Youtube' },
  { id: 'linkedin', label: 'LinkedIn', color: 'bg-blue-700', icon: 'Linkedin' },
  { id: 'pinterest', label: 'Pinterest', color: 'bg-red-600', icon: 'Pin' },
];

// Organization (tenant)
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  billingPlan: BillingPlan;
  billingStatus: 'active' | 'past_due' | 'canceled' | 'trialing';
  trialEndsAt?: Date;
  settings: OrganizationSettings;
}

export interface OrganizationSettings {
  timezone: string;
  defaultApprovalWindow: ApprovalWindow;
  autoEnableNewAccounts: boolean;
  requireMfaForPublishing: boolean;
}

// Organization membership
export type OrganizationRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  email: string;
  displayName: string;
  role: OrganizationRole;
  invitedAt: Date;
  acceptedAt?: Date;
  lastActiveAt?: Date;
}

// Billing plans
export type BillingPlan = 'free' | 'starter' | 'professional' | 'enterprise';

export interface PlanQuotas {
  maxConnectedAccounts: number;
  maxScheduledPostsPerMonth: number;
  maxTeamMembers: number;
  maxBrandProfiles: number;
  enabledFeatures: PlanFeature[];
}

export type PlanFeature =
  | 'autopilot'
  | 'ai_content_generation'
  | 'bulk_scheduling'
  | 'analytics_advanced'
  | 'custom_approval_workflows'
  | 'api_access'
  | 'white_label'
  | 'priority_support';

export const PLAN_QUOTAS: Record<BillingPlan, PlanQuotas> = {
  free: {
    maxConnectedAccounts: 3,
    maxScheduledPostsPerMonth: 30,
    maxTeamMembers: 1,
    maxBrandProfiles: 1,
    enabledFeatures: [],
  },
  starter: {
    maxConnectedAccounts: 10,
    maxScheduledPostsPerMonth: 150,
    maxTeamMembers: 3,
    maxBrandProfiles: 2,
    enabledFeatures: ['autopilot', 'ai_content_generation'],
  },
  professional: {
    maxConnectedAccounts: 25,
    maxScheduledPostsPerMonth: 500,
    maxTeamMembers: 10,
    maxBrandProfiles: 5,
    enabledFeatures: ['autopilot', 'ai_content_generation', 'bulk_scheduling', 'analytics_advanced', 'custom_approval_workflows'],
  },
  enterprise: {
    maxConnectedAccounts: -1, // unlimited
    maxScheduledPostsPerMonth: -1, // unlimited
    maxTeamMembers: -1, // unlimited
    maxBrandProfiles: -1, // unlimited
    enabledFeatures: ['autopilot', 'ai_content_generation', 'bulk_scheduling', 'analytics_advanced', 'custom_approval_workflows', 'api_access', 'white_label', 'priority_support'],
  },
};

// Usage tracking
export interface OrganizationUsage {
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  connectedAccountsCount: number;
  scheduledPostsCount: number;
  publishedPostsCount: number;
  teamMembersCount: number;
}

// OAuth Connection (connected social account)
export type OAuthConnectionStatus = 'active' | 'expired' | 'revoked' | 'error' | 'pending_refresh';

export interface OAuthConnection {
  id: string;
  organizationId: string;
  platform: OAuthPlatform;

  // Account info from OAuth provider
  externalAccountId: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  followerCount?: number;

  // Connection status
  status: OAuthConnectionStatus;
  lastSyncAt?: Date;
  lastErrorAt?: Date;
  lastErrorMessage?: string;

  // Token storage (encrypted)
  encryptedAccessToken: string;
  encryptedRefreshToken?: string;
  tokenExpiresAt?: Date;
  tokenScopes: string[];

  // Capabilities and permissions
  capabilities: AccountCapability[];

  // Metadata
  connectedAt: Date;
  connectedByUserId: string;
  updatedAt: Date;

  // Publishing settings
  isEnabledForAutopost: boolean;
  publishingApprovalRequired: boolean;
}

// Account capabilities (what actions can be performed)
export type AccountCapability =
  | 'read_profile'
  | 'read_posts'
  | 'read_analytics'
  | 'publish_post'
  | 'publish_story'
  | 'publish_reel'
  | 'publish_video'
  | 'schedule_post'
  | 'delete_post'
  | 'read_comments'
  | 'post_comments'
  | 'read_messages'
  | 'send_messages';

// Capability matrix per platform
export const PLATFORM_CAPABILITIES: Record<OAuthPlatform, { available: AccountCapability[]; requiresBusinessAccount: AccountCapability[] }> = {
  facebook: {
    available: ['read_profile', 'read_posts', 'read_analytics', 'publish_post', 'schedule_post', 'delete_post', 'read_comments', 'post_comments'],
    requiresBusinessAccount: ['publish_post', 'schedule_post', 'read_analytics'],
  },
  instagram: {
    available: ['read_profile', 'read_posts', 'read_analytics', 'publish_post', 'publish_story', 'publish_reel', 'read_comments', 'post_comments'],
    requiresBusinessAccount: ['publish_post', 'publish_story', 'publish_reel', 'read_analytics'],
  },
  tiktok: {
    available: ['read_profile', 'read_posts', 'read_analytics', 'publish_video', 'read_comments', 'post_comments'],
    requiresBusinessAccount: ['read_analytics'],
  },
  twitter: {
    available: ['read_profile', 'read_posts', 'publish_post', 'delete_post', 'read_comments', 'post_comments', 'read_messages', 'send_messages'],
    requiresBusinessAccount: [],
  },
  youtube: {
    available: ['read_profile', 'read_posts', 'read_analytics', 'publish_video', 'read_comments', 'post_comments'],
    requiresBusinessAccount: [],
  },
  linkedin: {
    available: ['read_profile', 'read_posts', 'publish_post', 'read_comments', 'post_comments', 'read_analytics'],
    requiresBusinessAccount: ['read_analytics'],
  },
  pinterest: {
    available: ['read_profile', 'read_posts', 'publish_post', 'read_analytics'],
    requiresBusinessAccount: ['read_analytics'],
  },
};

// OAuth flow state
export interface OAuthFlowState {
  platform: OAuthPlatform;
  organizationId: string;
  initiatedByUserId: string;
  state: string; // CSRF token
  codeVerifier?: string; // PKCE
  redirectUri: string;
  requestedScopes: string[];
  status: 'initiated' | 'callback_received' | 'tokens_exchanged' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: Date;
  expiresAt: Date;
}

// Token refresh tracking
export interface TokenRefreshLog {
  id: string;
  connectionId: string;
  organizationId: string;
  platform: OAuthPlatform;
  refreshedAt: Date;
  success: boolean;
  errorMessage?: string;
  newExpiresAt?: Date;
}

// ==========================================
// BACKGROUND WORKER TYPES
// ==========================================

export type PublishJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'retrying';

export interface PublishJob {
  id: string;
  organizationId: string;
  connectionId: string;
  platform: OAuthPlatform;
  postContent: PublishContent;

  // Job status
  status: PublishJobStatus;
  priority: number; // 1-10, higher = more urgent

  // Scheduling
  scheduledAt: Date;
  processedAt?: Date;
  completedAt?: Date;

  // Retry handling
  attemptCount: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  retryBackoffMs: number;

  // Rate limit tracking
  rateLimitResetAt?: Date;
  rateLimitRemaining?: number;

  // Result
  publishedPostId?: string;
  publishedUrl?: string;
  errorCode?: string;
  errorMessage?: string;

  // Audit
  createdAt: Date;
  createdByUserId: string;
  updatedAt: Date;
}

export interface PublishContent {
  text?: string;
  mediaUrls?: string[];
  linkUrl?: string;
  hashtags?: string[];
  mentions?: string[];
  location?: { name: string; lat?: number; lng?: number };

  // Platform-specific options
  platformOptions?: Record<string, unknown>;
}

export interface PublishJobLog {
  id: string;
  jobId: string;
  organizationId: string;
  timestamp: Date;
  eventType: 'created' | 'started' | 'attempt' | 'retry_scheduled' | 'completed' | 'failed' | 'rate_limited';
  details: string;
  metadata?: Record<string, unknown>;
}

// Rate limit configuration per platform
export const PLATFORM_RATE_LIMITS: Record<OAuthPlatform, { requestsPerHour: number; requestsPerDay: number; minIntervalMs: number }> = {
  facebook: { requestsPerHour: 200, requestsPerDay: 4800, minIntervalMs: 60000 },
  instagram: { requestsPerHour: 25, requestsPerDay: 100, minIntervalMs: 300000 },
  tiktok: { requestsPerHour: 50, requestsPerDay: 500, minIntervalMs: 120000 },
  twitter: { requestsPerHour: 100, requestsPerDay: 2400, minIntervalMs: 60000 },
  youtube: { requestsPerHour: 10, requestsPerDay: 100, minIntervalMs: 600000 },
  linkedin: { requestsPerHour: 100, requestsPerDay: 1000, minIntervalMs: 60000 },
  pinterest: { requestsPerHour: 50, requestsPerDay: 1000, minIntervalMs: 120000 },
};

// Retry backoff configuration
export const RETRY_CONFIG = {
  initialDelayMs: 1000,
  maxDelayMs: 3600000, // 1 hour
  backoffMultiplier: 2,
  maxAttempts: 5,
  jitterFactor: 0.1,
};

// ==========================================
// QUOTA TRACKING TYPES
// ==========================================

export interface QuotaUsage {
  organizationId: string;
  metric: QuotaMetric;
  periodStart: Date;
  periodEnd: Date;
  used: number;
  limit: number;
  lastUpdated: Date;
}

export type QuotaMetric =
  | 'connected_accounts'
  | 'scheduled_posts_month'
  | 'team_members'
  | 'brand_profiles'
  | 'api_calls_day';

export interface QuotaWarning {
  id: string;
  organizationId: string;
  metric: QuotaMetric;
  thresholdPercent: number; // 80, 90, 100
  triggeredAt: Date;
  acknowledgedAt?: Date;
  acknowledgedByUserId?: string;
}
