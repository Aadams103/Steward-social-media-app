import { create } from 'zustand';
import {
  type Platform,
  type PostStatus,
  type CalendarView,
  type Post,
  type Campaign,
  type SocialAccount,
  type Conversation,
  type Alert,
  type BrandProfile,
  type AutopilotSettings,
  type ScheduledSlot,
  type AutopilotNotification,
  type AuditLogEntry,
  type WeeklySchedule,
  type OperatingMode,
  type ApprovalWindow,
  type Organization,
  type OrganizationMember,
  type OAuthConnection,
  type OAuthPlatform,
  type OAuthFlowState,
  type PublishJob,
  type QuotaUsage,
  type QuotaWarning,
  type BillingPlan,
  type Brand,
  PLAN_QUOTAS,
} from '@/types/app';

interface AppState {
  // Navigation
  activeView: string;
  setActiveView: (view: string) => void;

  // Calendar
  calendarView: CalendarView;
  setCalendarView: (view: CalendarView) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;

  // Post composer
  composerOpen: boolean;
  setComposerOpen: (open: boolean) => void;
  editingPost: Post | null;
  setEditingPost: (post: Post | null) => void;

  // Filters
  platformFilter: Platform | 'all';
  setPlatformFilter: (platform: Platform | 'all') => void;
  statusFilter: PostStatus | 'all';
  setStatusFilter: (status: PostStatus | 'all') => void;
  campaignFilter: string | 'all';
  setCampaignFilter: (campaignId: string | 'all') => void;

  // Selected items
  selectedPosts: string[];
  setSelectedPosts: (ids: string[]) => void;
  togglePostSelection: (id: string) => void;
  clearSelection: () => void;

  // Inbox
  inboxFilter: 'all' | 'unread' | 'assigned';
  setInboxFilter: (filter: 'all' | 'unread' | 'assigned') => void;
  selectedConversation: Conversation | null;
  setSelectedConversation: (conversation: Conversation | null) => void;

  // UI state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Demo data (in real app, this would come from API)
  posts: Post[];
  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  updatePost: (id: string, updates: Partial<Post>) => void;
  deletePost: (id: string) => void;

  campaigns: Campaign[];
  setCampaigns: (campaigns: Campaign[]) => void;

  socialAccounts: SocialAccount[];
  setSocialAccounts: (accounts: SocialAccount[]) => void;

  conversations: Conversation[];
  setConversations: (conversations: Conversation[]) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;

  alerts: Alert[];
  setAlerts: (alerts: Alert[]) => void;

  // ==========================================
  // AUTOPILOT STATE
  // ==========================================

  // Brand Profile
  brandProfile: BrandProfile | null;
  setBrandProfile: (profile: BrandProfile) => void;
  updateBrandProfile: (updates: Partial<BrandProfile>) => void;

  // Autopilot Settings
  autopilotSettings: AutopilotSettings;
  setAutopilotSettings: (settings: AutopilotSettings) => void;
  updateAutopilotSettings: (updates: Partial<AutopilotSettings>) => void;
  setOperatingMode: (mode: OperatingMode) => void;
  setApprovalWindow: (window: ApprovalWindow) => void;
  pauseAutopilot: (reason?: string) => void;
  resumeAutopilot: () => void;
  emergencyStop: () => void;

  // Scheduled Slots (Queue)
  scheduledSlots: ScheduledSlot[];
  setScheduledSlots: (slots: ScheduledSlot[]) => void;
  addScheduledSlot: (slot: ScheduledSlot) => void;
  updateScheduledSlot: (id: string, updates: Partial<ScheduledSlot>) => void;
  deleteScheduledSlot: (id: string) => void;
  approveSlot: (id: string) => void;
  denySlot: (id: string, reason?: string) => void;

  // Weekly Schedule
  weeklySchedule: WeeklySchedule | null;
  setWeeklySchedule: (schedule: WeeklySchedule) => void;
  lockWeek: () => void;
  unlockWeek: () => void;
  regenerateSchedule: () => void;

  // Notifications
  autopilotNotifications: AutopilotNotification[];
  setAutopilotNotifications: (notifications: AutopilotNotification[]) => void;
  addNotification: (notification: AutopilotNotification) => void;
  markNotificationRead: (id: string) => void;
  markNotificationActioned: (id: string, action: AutopilotNotification['actionTaken']) => void;
  dismissNotification: (id: string) => void;

  // Audit Log
  auditLog: AuditLogEntry[];
  setAuditLog: (log: AuditLogEntry[]) => void;
  addAuditEntry: (entry: AuditLogEntry) => void;

  // Autopilot Status
  isAutopilotRunning: boolean;
  lastScheduleGeneration: Date | null;
  nextScheduledPost: ScheduledSlot | null;

  // ==========================================
  // MULTI-TENANT OAUTH STATE
  // ==========================================

  // Current Organization
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization | null) => void;
  updateOrganization: (updates: Partial<Organization>) => void;

  // Organizations List
  organizations: Organization[];
  setOrganizations: (orgs: Organization[]) => void;
  addOrganization: (org: Organization) => void;
  removeOrganization: (id: string) => void;

  // Organization Members
  organizationMembers: OrganizationMember[];
  setOrganizationMembers: (members: OrganizationMember[]) => void;
  addOrganizationMember: (member: OrganizationMember) => void;
  updateOrganizationMember: (id: string, updates: Partial<OrganizationMember>) => void;
  removeOrganizationMember: (id: string) => void;

  // OAuth Connections
  oauthConnections: OAuthConnection[];
  setOAuthConnections: (connections: OAuthConnection[]) => void;
  addOAuthConnection: (connection: OAuthConnection) => void;
  updateOAuthConnection: (id: string, updates: Partial<OAuthConnection>) => void;
  removeOAuthConnection: (id: string) => void;
  toggleAutopost: (id: string, enabled: boolean) => void;
  refreshConnectionToken: (id: string) => void;

  // OAuth Flow State
  oauthFlowState: OAuthFlowState | null;
  setOAuthFlowState: (state: OAuthFlowState | null) => void;
  startOAuthFlow: (platform: OAuthPlatform, organizationId: string, userId: string) => void;
  completeOAuthFlow: (connection: OAuthConnection) => void;
  cancelOAuthFlow: () => void;

  // Publish Jobs
  publishJobs: PublishJob[];
  setPublishJobs: (jobs: PublishJob[]) => void;
  addPublishJob: (job: PublishJob) => void;
  updatePublishJob: (id: string, updates: Partial<PublishJob>) => void;
  retryPublishJob: (id: string) => void;
  cancelPublishJob: (id: string) => void;

  // Quota Management
  quotaUsage: QuotaUsage[];
  setQuotaUsage: (usage: QuotaUsage[]) => void;
  updateQuotaUsage: (orgId: string, metric: QuotaUsage['metric'], used: number) => void;

  quotaWarnings: QuotaWarning[];
  setQuotaWarnings: (warnings: QuotaWarning[]) => void;
  acknowledgeQuotaWarning: (id: string, userId: string) => void;

  // Helper Functions
  getConnectionsByOrg: (orgId: string) => OAuthConnection[];
  getConnectionCapabilities: (connectionId: string) => string[];
  canPublish: (connectionId: string) => boolean;
  isQuotaExceeded: (orgId: string, metric: QuotaUsage['metric']) => boolean;
  getQuotaPercentage: (orgId: string, metric: QuotaUsage['metric']) => number;

  // ==========================================
  // BRAND MANAGEMENT STATE
  // ==========================================
  activeBrandId: string | 'all' | null;
  setActiveBrandId: (brandId: string | 'all' | null) => void;
  brands: Brand[];
  setBrands: (brands: Brand[]) => void;
  addBrand: (brand: Brand) => void;
  updateBrand: (id: string, updates: Partial<Brand>) => void;
  removeBrand: (id: string) => void;
}

// Generate sample data
const generateSamplePosts = (): Post[] => {
  const now = new Date();
  return [
    {
      id: '1',
      content: 'Excited to announce our new product launch! Check it out at the link in bio. #innovation #tech',
      platform: 'facebook',
      status: 'published',
      publishedTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      authorId: 'user1',
      metrics: { impressions: 15420, reach: 12300, engagement: 3.2, clicks: 342, likes: 234, comments: 45, shares: 67 },
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: '2',
      content: 'Join us for a live Q&A session this Friday at 3 PM EST. Drop your questions below!',
      platform: 'instagram',
      status: 'scheduled',
      scheduledTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      authorId: 'user1',
      campaignId: 'camp1',
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: '3',
      content: 'What are your thoughts on AI in social media marketing? Share in the comments!',
      platform: 'linkedin',
      status: 'draft',
      authorId: 'user1',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '4',
      content: 'Behind the scenes of our latest video shoot. More coming soon!',
      platform: 'tiktok',
      status: 'needs_approval',
      authorId: 'user2',
      campaignId: 'camp1',
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
    {
      id: '5',
      content: 'Top 5 marketing tips for 2025. Thread below!',
      platform: 'pinterest',
      status: 'approved',
      scheduledTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      authorId: 'user1',
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
  ];
};

const generateSampleCampaigns = (): Campaign[] => [
  {
    id: 'camp1',
    name: 'Product Launch 2025',
    description: 'Marketing campaign for our new product line',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    goal: 'Increase awareness and drive 10k website visits',
    postCount: 12,
    totalEngagement: 45000,
    status: 'active',
  },
  {
    id: 'camp2',
    name: 'Holiday Special',
    description: 'Holiday season promotional content',
    startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    goal: 'Drive holiday sales with 25% discount campaign',
    postCount: 8,
    totalEngagement: 23000,
    status: 'active',
  },
];

const generateSampleAccounts = (): SocialAccount[] => [
  {
    id: 'acc1',
    platform: 'facebook',
    username: '@companyhandle',
    displayName: 'Company Name',
    isConnected: true,
    lastSync: new Date(),
    followerCount: 15420,
  },
  {
    id: 'acc2',
    platform: 'instagram',
    username: '@company_official',
    displayName: 'Company Official',
    isConnected: true,
    lastSync: new Date(Date.now() - 30 * 60 * 1000),
    followerCount: 8500,
  },
  {
    id: 'acc3',
    platform: 'linkedin',
    username: 'CompanyPage',
    displayName: 'Company Page',
    isConnected: true,
    lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
    followerCount: 125000,
  },
];

const generateSampleConversations = (): Conversation[] => [
  {
    id: 'conv1',
    platform: 'facebook',
    messageType: 'mention',
    content: 'Love your new product! When will it be available in Europe?',
    authorName: 'John Doe',
    status: 'unread',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: 'conv2',
    platform: 'instagram',
    messageType: 'comment',
    content: 'Great tips! Especially the one about AI tools.',
    authorName: 'Sarah M.',
    status: 'read',
    postId: '1',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'conv3',
    platform: 'linkedin',
    messageType: 'comment',
    content: 'This is really helpful. Can you share more resources?',
    authorName: 'TechEnthusiast42',
    status: 'unread',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: 'conv4',
    platform: 'tiktok',
    messageType: 'comment',
    content: 'When is the next video coming out?',
    authorName: 'VideoFan123',
    status: 'replied',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

const generateSampleAlerts = (): Alert[] => [
  {
    id: 'alert1',
    keyword: 'company name',
    platform: 'facebook',
    triggerCount: 45,
    isActive: true,
    lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'alert2',
    keyword: 'product launch',
    platform: 'instagram',
    triggerCount: 12,
    isActive: true,
    lastTriggered: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
];

// Sample Brand Profile
const generateSampleBrandProfile = (): BrandProfile => ({
  id: 'brand1',
  brandName: 'TechFlow Solutions',
  industry: 'Technology / SaaS',
  audience: 'Small to medium business owners, marketing managers, and entrepreneurs looking to streamline their social media presence',
  location: 'United States, Canada, UK',

  brandVoice: 'Professional yet approachable. We speak with confidence and clarity, using simple language to explain complex topics. Friendly but not overly casual.',
  writingDos: [
    'Use active voice',
    'Include clear CTAs',
    'Share actionable tips',
    'Be encouraging and supportive',
    'Use data when possible',
  ],
  writingDonts: [
    'Use jargon without explanation',
    'Be condescending',
    'Make unrealistic promises',
    'Use excessive exclamation marks',
    'Be negative about competitors',
  ],

  offers: ['Free trial', '20% off annual plans', 'Free consultation'],
  services: ['Social media scheduling', 'AI content generation', 'Analytics dashboard', 'Team collaboration'],
  prices: 'Starting at $29/month',
  ctaLinks: [
    { label: 'Start Free Trial', url: 'https://example.com/trial' },
    { label: 'Book a Demo', url: 'https://example.com/demo' },
    { label: 'Learn More', url: 'https://example.com/features' },
  ],

  primaryColors: ['#3B82F6', '#1E40AF'],
  secondaryColors: ['#10B981', '#F59E0B'],
  visualVibe: 'Modern, clean, tech-forward with gradients and soft shadows',
  doNotUseImagery: ['Stock photos with fake smiles', 'Cluttered backgrounds', 'Overly corporate imagery'],

  postingGoals: ['growth', 'leads', 'awareness'],
  contentPillars: [
    'Product tips & tutorials',
    'Industry insights & trends',
    'Customer success stories',
    'Behind the scenes & team culture',
    'Thought leadership',
  ],

  bannedWords: ['guarantee', 'best', '#1', 'unlimited'],
  bannedClaims: ['Results guaranteed', 'Get rich quick', 'No effort required'],
  complianceNotes: 'Always include disclaimers for promotional claims. Never promise specific ROI numbers.',

  updatedAt: new Date(),
});

// Sample Autopilot Settings
const generateDefaultAutopilotSettings = (): AutopilotSettings => ({
  operatingMode: 'approval',
  approvalWindow: '2h',
  noResponseAction: 'hold',

  timezone: 'America/New_York',
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  blackoutDates: [],

  platformCadence: {
    facebook: 7,
    instagram: 7,
    linkedin: 3,
    tiktok: 5,
    pinterest: 3,
    reddit: 3,
    slack: 5,
    notion: 2,
    youtube: 4,
    x: 5,
    google_business_profile: 3,
  },

  enableWebResearch: true,
  enableImageGeneration: false,

  notificationChannels: {
    inApp: true,
    email: true,
    sms: false,
    slack: false,
  },

  isPaused: false,
});

// Sample Scheduled Slots
const generateSampleScheduledSlots = (): ScheduledSlot[] => {
  const now = new Date();
  return [
    {
      id: 'slot1',
      platform: 'facebook',
      scheduledTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      contentPillar: 'Product tips & tutorials',
      primaryCaption: '💡 Pro tip: Use AI to draft your posts, but always add your personal touch before publishing. Authenticity wins every time! #SocialMediaTips #AI',
      hashtagsGenerated: ['#SocialMediaTips', '#AI', '#MarketingTips'],
      ctaLink: 'https://example.com/trial',
      variantA: {
        id: 'v1a',
        type: 'conversion',
        caption: '💡 Ready to 10x your social media output? Start your free trial today and see the difference AI can make.',
        hashtags: ['#FreeTrial', '#SocialMedia'],
        cta: 'Start Free Trial',
      },
      variantB: {
        id: 'v1b',
        type: 'story',
        caption: '💡 Our team uses this trick every day - let AI handle the first draft while you focus on strategy. Works like a charm!',
        hashtags: ['#TeamTips', '#BehindTheScenes'],
      },
      mediaSource: 'none',
      status: 'pending_approval',
      approvalDeadline: new Date(now.getTime() + 1.5 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 30 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 30 * 60 * 1000),
    },
    {
      id: 'slot2',
      platform: 'instagram',
      scheduledTime: new Date(now.getTime() + 26 * 60 * 60 * 1000),
      contentPillar: 'Industry insights & trends',
      primaryCaption: '📊 2025 Social Media Trend: Short-form video continues to dominate, but long-form content is making a comeback for thought leadership.',
      hashtagsGenerated: ['#SocialMediaTrends', '#2025Trends', '#ContentStrategy'],
      mediaSource: 'none',
      status: 'generated',
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    },
    {
      id: 'slot3',
      platform: 'linkedin',
      scheduledTime: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      contentPillar: 'Product tips & tutorials',
      primaryCaption: 'What tools do you use for social media scheduling? We built an AI-powered solution that generates content ideas based on your brand voice.',
      hashtagsGenerated: [],
      mediaSource: 'none',
      status: 'pending_generation',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'slot4',
      platform: 'tiktok',
      scheduledTime: new Date(now.getTime() + 50 * 60 * 60 * 1000),
      contentPillar: 'Customer success stories',
      primaryCaption: '"We saved 10 hours per week on social media management" - See how @CustomerName transformed their workflow with TechFlow.',
      hashtagsGenerated: ['#CustomerSuccess', '#CaseStudy'],
      mediaSource: 'uploaded',
      mediaUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800',
      status: 'approved',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    },
  ];
};

// Sample Notifications
const generateSampleNotifications = (): AutopilotNotification[] => {
  const now = new Date();
  return [
    {
      id: 'notif1',
      type: 'pending_approval',
      slotId: 'slot1',
      platform: 'facebook',
      caption: '💡 Pro tip: Use AI to draft your posts, but always add your personal touch before publishing.',
      scheduledTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      actions: ['approve', 'deny', 'edit', 'post_now', 'reschedule'],
      isRead: false,
      isActioned: false,
      createdAt: new Date(now.getTime() - 30 * 60 * 1000),
      expiresAt: new Date(now.getTime() + 1.5 * 60 * 60 * 1000),
    },
    {
      id: 'notif2',
      type: 'published',
      slotId: 'slot0',
      platform: 'instagram',
      caption: 'Check out our latest feature update! Now with enhanced AI capabilities.',
      scheduledTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      actions: ['dismiss'],
      isRead: true,
      isActioned: true,
      actionTaken: 'approved',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      id: 'notif3',
      type: 'reminder',
      slotId: 'slot1',
      platform: 'facebook',
      caption: '⏰ Reminder: Post scheduled in 2 hours needs your approval',
      scheduledTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      actions: ['approve', 'deny', 'edit'],
      isRead: false,
      isActioned: false,
      createdAt: new Date(now.getTime() - 10 * 60 * 1000),
    },
  ];
};

// Sample Audit Log
const generateSampleAuditLog = (): AuditLogEntry[] => {
  const now = new Date();
  return [
    {
      id: 'audit1',
      timestamp: new Date(now.getTime() - 30 * 60 * 1000),
      action: 'content_generated',
      actorType: 'autopilot',
      resourceType: 'slot',
      resourceId: 'slot1',
      details: 'Generated content for Twitter post using "Product tips & tutorials" pillar',
      success: true,
    },
    {
      id: 'audit2',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      action: 'post_approved',
      actorType: 'user',
      actorId: 'user1',
      resourceType: 'slot',
      resourceId: 'slot0',
      details: 'User approved post for publishing',
      success: true,
    },
    {
      id: 'audit3',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      action: 'post_published',
      actorType: 'autopilot',
      resourceType: 'post',
      resourceId: 'post1',
      details: 'Successfully published to Twitter',
      success: true,
    },
    {
      id: 'audit4',
      timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      action: 'schedule_generated',
      actorType: 'autopilot',
      resourceType: 'slot',
      resourceId: 'weekly',
      details: 'Generated 7-day posting schedule with 11 slots',
      success: true,
    },
  ];
};

// Sample Weekly Schedule
const generateSampleWeeklySchedule = (): WeeklySchedule => {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return {
    weekStart,
    weekEnd,
    isLocked: false,
    slots: generateSampleScheduledSlots(),
    contentPillarRotation: [
      'Product tips & tutorials',
      'Industry insights & trends',
      'Customer success stories',
      'Behind the scenes & team culture',
      'Thought leadership',
    ],
  };
};

// ==========================================
// MULTI-TENANT SAMPLE DATA GENERATORS
// ==========================================

const generateSampleOrganization = (): Organization => ({
  id: 'org1',
  name: 'TechFlow Solutions',
  slug: 'techflow-solutions',
  logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=TF',
  createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
  updatedAt: new Date(),
  ownerId: 'user1',
  billingPlan: 'professional',
  billingStatus: 'active',
  settings: {
    timezone: 'America/New_York',
    defaultApprovalWindow: '2h',
    autoEnableNewAccounts: false,
    requireMfaForPublishing: false,
  },
});

const generateSampleOrganizations = (): Organization[] => [
  generateSampleOrganization(),
  {
    id: 'org2',
    name: 'Marketing Agency Pro',
    slug: 'marketing-agency-pro',
    logoUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=MA',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    ownerId: 'user1',
    billingPlan: 'starter',
    billingStatus: 'active',
    settings: {
      timezone: 'America/Los_Angeles',
      defaultApprovalWindow: '2h',
      autoEnableNewAccounts: true,
      requireMfaForPublishing: false,
    },
  },
];

const generateSampleMembers = (): OrganizationMember[] => [
  {
    id: 'member1',
    organizationId: 'org1',
    userId: 'user1',
    email: 'owner@techflow.com',
    displayName: 'John Smith',
    role: 'owner',
    invitedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    acceptedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    lastActiveAt: new Date(),
  },
  {
    id: 'member2',
    organizationId: 'org1',
    userId: 'user2',
    email: 'admin@techflow.com',
    displayName: 'Sarah Johnson',
    role: 'admin',
    invitedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    acceptedAt: new Date(Date.now() - 59 * 24 * 60 * 60 * 1000),
    lastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'member3',
    organizationId: 'org1',
    userId: 'user3',
    email: 'member@techflow.com',
    displayName: 'Mike Chen',
    role: 'member',
    invitedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    acceptedAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
    lastActiveAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

const generateSampleOAuthConnections = (): OAuthConnection[] => [
  {
    id: 'conn1',
    organizationId: 'org1',
    platform: 'twitter',
    externalAccountId: '123456789',
    username: '@techflow_official',
    displayName: 'TechFlow Solutions',
    profileImageUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=TF',
    followerCount: 15420,
    status: 'active',
    lastSyncAt: new Date(),
    encryptedAccessToken: 'encrypted_token_xxx',
    encryptedRefreshToken: 'encrypted_refresh_xxx',
    tokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    tokenScopes: ['tweet.read', 'tweet.write', 'users.read'],
    capabilities: ['read_profile', 'read_posts', 'publish_post', 'delete_post', 'read_comments', 'post_comments'],
    connectedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    connectedByUserId: 'user1',
    updatedAt: new Date(),
    isEnabledForAutopost: true,
    publishingApprovalRequired: false,
  },
  {
    id: 'conn2',
    organizationId: 'org1',
    platform: 'facebook',
    externalAccountId: '987654321',
    username: 'TechFlowSolutions',
    displayName: 'TechFlow Solutions',
    profileImageUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=FB',
    followerCount: 8500,
    status: 'active',
    lastSyncAt: new Date(Date.now() - 30 * 60 * 1000),
    encryptedAccessToken: 'encrypted_token_yyy',
    encryptedRefreshToken: 'encrypted_refresh_yyy',
    tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    tokenScopes: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'],
    capabilities: ['read_profile', 'read_posts', 'read_analytics', 'publish_post', 'schedule_post', 'read_comments', 'post_comments'],
    connectedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    connectedByUserId: 'user1',
    updatedAt: new Date(),
    isEnabledForAutopost: true,
    publishingApprovalRequired: true,
  },
  {
    id: 'conn3',
    organizationId: 'org1',
    platform: 'instagram',
    externalAccountId: '111222333',
    username: '@techflow.solutions',
    displayName: 'TechFlow Solutions',
    profileImageUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=IG',
    followerCount: 12300,
    status: 'active',
    lastSyncAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    encryptedAccessToken: 'encrypted_token_zzz',
    tokenExpiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    tokenScopes: ['instagram_basic', 'instagram_content_publish'],
    capabilities: ['read_profile', 'read_posts', 'read_analytics', 'publish_post', 'publish_story', 'read_comments', 'post_comments'],
    connectedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    connectedByUserId: 'user2',
    updatedAt: new Date(),
    isEnabledForAutopost: false,
    publishingApprovalRequired: true,
  },
  {
    id: 'conn4',
    organizationId: 'org1',
    platform: 'linkedin',
    externalAccountId: '444555666',
    username: 'techflow-solutions',
    displayName: 'TechFlow Solutions',
    profileImageUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=LI',
    followerCount: 5200,
    status: 'expired',
    lastSyncAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    lastErrorAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    lastErrorMessage: 'Access token expired. Please reconnect.',
    encryptedAccessToken: 'encrypted_token_expired',
    tokenExpiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    tokenScopes: ['w_member_social', 'r_liteprofile'],
    capabilities: ['read_profile', 'read_posts', 'publish_post'],
    connectedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    connectedByUserId: 'user1',
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    isEnabledForAutopost: false,
    publishingApprovalRequired: false,
  },
  {
    id: 'conn5',
    organizationId: 'org1',
    platform: 'youtube',
    externalAccountId: '777888999',
    username: 'TechFlowChannel',
    displayName: 'TechFlow Solutions',
    profileImageUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=YT',
    followerCount: 25000,
    status: 'active',
    lastSyncAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    encryptedAccessToken: 'encrypted_token_aaa',
    encryptedRefreshToken: 'encrypted_refresh_aaa',
    tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    tokenScopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'],
    capabilities: ['read_profile', 'read_posts', 'read_analytics', 'publish_video', 'read_comments', 'post_comments'],
    connectedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    connectedByUserId: 'user1',
    updatedAt: new Date(),
    isEnabledForAutopost: false,
    publishingApprovalRequired: true,
  },
];

const generateSamplePublishJobs = (): PublishJob[] => {
  const now = new Date();
  return [
    {
      id: 'job1',
      organizationId: 'org1',
      connectionId: 'conn1',
      platform: 'twitter',
      postContent: {
        text: 'Exciting news! Our latest feature is now live. Check it out!',
        hashtags: ['#ProductLaunch', '#TechNews'],
      },
      status: 'completed',
      priority: 5,
      scheduledAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      processedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000 + 5000),
      attemptCount: 1,
      maxAttempts: 5,
      lastAttemptAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      retryBackoffMs: 1000,
      publishedPostId: 'tweet_12345',
      publishedUrl: 'https://twitter.com/techflow_official/status/12345',
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      createdByUserId: 'user1',
      updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      id: 'job2',
      organizationId: 'org1',
      connectionId: 'conn2',
      platform: 'facebook',
      postContent: {
        text: 'Join us for a live Q&A session this Friday!',
        linkUrl: 'https://example.com/qa-session',
      },
      status: 'queued',
      priority: 5,
      scheduledAt: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      attemptCount: 0,
      maxAttempts: 5,
      retryBackoffMs: 1000,
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      createdByUserId: 'user1',
      updatedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    },
    {
      id: 'job3',
      organizationId: 'org1',
      connectionId: 'conn1',
      platform: 'twitter',
      postContent: {
        text: 'Quick tip: Use keyboard shortcuts to boost productivity!',
        hashtags: ['#ProductivityTips'],
      },
      status: 'failed',
      priority: 3,
      scheduledAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      processedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      attemptCount: 5,
      maxAttempts: 5,
      lastAttemptAt: new Date(now.getTime() - 20 * 60 * 60 * 1000),
      retryBackoffMs: 3600000,
      errorCode: 'RATE_LIMIT_EXCEEDED',
      errorMessage: 'Rate limit exceeded. Too many requests.',
      createdAt: new Date(now.getTime() - 25 * 60 * 60 * 1000),
      createdByUserId: 'user2',
      updatedAt: new Date(now.getTime() - 20 * 60 * 60 * 1000),
    },
  ];
};

const generateSampleQuotaUsage = (): QuotaUsage[] => {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  return [
    {
      organizationId: 'org1',
      metric: 'connected_accounts',
      periodStart,
      periodEnd,
      used: 5,
      limit: PLAN_QUOTAS.professional.maxConnectedAccounts,
      lastUpdated: now,
    },
    {
      organizationId: 'org1',
      metric: 'scheduled_posts_month',
      periodStart,
      periodEnd,
      used: 145,
      limit: PLAN_QUOTAS.professional.maxScheduledPostsPerMonth,
      lastUpdated: now,
    },
    {
      organizationId: 'org1',
      metric: 'team_members',
      periodStart,
      periodEnd,
      used: 3,
      limit: PLAN_QUOTAS.professional.maxTeamMembers,
      lastUpdated: now,
    },
  ];
};

const generateSampleQuotaWarnings = (): QuotaWarning[] => [
  {
    id: 'warn1',
    organizationId: 'org1',
    metric: 'scheduled_posts_month',
    thresholdPercent: 80,
    triggeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];

export const useAppStore = create<AppState>((set, get) => {
	// #region agent log
	fetch('http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-store.ts:966',message:'Store initialization start',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'init',hypothesisId:'B'})}).catch(()=>{});
	// #endregion
	return {
  // Navigation
  activeView: 'dashboard',
  setActiveView: (view) => {
		// #region agent log
		fetch('http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-store.ts:969',message:'Store state update - activeView',data:{view},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'B'})}).catch(()=>{});
		// #endregion
		set({ activeView: view });
	},

  // Calendar
  calendarView: 'week',
  setCalendarView: (view) => set({ calendarView: view }),
  selectedDate: new Date(),
  setSelectedDate: (date) => set({ selectedDate: date }),

  // Post composer
  composerOpen: false,
  setComposerOpen: (open) => set({ composerOpen: open }),
  editingPost: null,
  setEditingPost: (post) => set({ editingPost: post }),

  // Filters
  platformFilter: 'all',
  setPlatformFilter: (platform) => set({ platformFilter: platform }),
  statusFilter: 'all',
  setStatusFilter: (status) => set({ statusFilter: status }),
  campaignFilter: 'all',
  setCampaignFilter: (campaignId) => set({ campaignFilter: campaignId }),

  // Selected items
  selectedPosts: [],
  setSelectedPosts: (ids) => set({ selectedPosts: ids }),
  togglePostSelection: (id) => set((state) => ({
    selectedPosts: state.selectedPosts.includes(id)
      ? state.selectedPosts.filter((postId) => postId !== id)
      : [...state.selectedPosts, id],
  })),
  clearSelection: () => set({ selectedPosts: [] }),

  // Inbox
  inboxFilter: 'all',
  setInboxFilter: (filter) => set({ inboxFilter: filter }),
  selectedConversation: null,
  setSelectedConversation: (conversation) => set({ selectedConversation: conversation }),

  // UI state
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  // Data
  posts: generateSamplePosts(),
  setPosts: (posts) => set({ posts }),
  addPost: (post) => set((state) => ({ posts: [...state.posts, post] })),
  updatePost: (id, updates) => set((state) => ({
    posts: state.posts.map((post) => post.id === id ? { ...post, ...updates } : post),
  })),
  deletePost: (id) => set((state) => ({
    posts: state.posts.filter((post) => post.id !== id),
  })),

  campaigns: generateSampleCampaigns(),
  setCampaigns: (campaigns) => set({ campaigns }),

  socialAccounts: generateSampleAccounts(),
  setSocialAccounts: (accounts) => set({ socialAccounts: accounts }),

  conversations: generateSampleConversations(),
  setConversations: (conversations) => set({ conversations }),
  updateConversation: (id, updates) => set((state) => ({
    conversations: state.conversations.map((conv) => conv.id === id ? { ...conv, ...updates } : conv),
  })),

  alerts: generateSampleAlerts(),
  setAlerts: (alerts) => set({ alerts }),

  // ==========================================
  // AUTOPILOT STATE IMPLEMENTATION
  // ==========================================

  // Brand Profile
  brandProfile: generateSampleBrandProfile(),
  setBrandProfile: (profile) => set({ brandProfile: profile }),
  updateBrandProfile: (updates) => set((state) => ({
    brandProfile: state.brandProfile ? { ...state.brandProfile, ...updates, updatedAt: new Date() } : null,
  })),

  // Autopilot Settings
  autopilotSettings: generateDefaultAutopilotSettings(),
  setAutopilotSettings: (settings) => set({ autopilotSettings: settings }),
  updateAutopilotSettings: (updates) => set((state) => ({
    autopilotSettings: { ...state.autopilotSettings, ...updates },
  })),
  setOperatingMode: (mode) => set((state) => ({
    autopilotSettings: {
      ...state.autopilotSettings,
      operatingMode: mode,
      noResponseAction: mode === 'autopilot' ? 'auto_post' : 'hold',
    },
  })),
  setApprovalWindow: (window) => set((state) => ({
    autopilotSettings: { ...state.autopilotSettings, approvalWindow: window },
  })),
  pauseAutopilot: (reason) => set((state) => ({
    autopilotSettings: {
      ...state.autopilotSettings,
      isPaused: true,
      pausedAt: new Date(),
      pauseReason: reason,
    },
    isAutopilotRunning: false,
  })),
  resumeAutopilot: () => set((state) => ({
    autopilotSettings: {
      ...state.autopilotSettings,
      isPaused: false,
      pausedAt: undefined,
      pauseReason: undefined,
    },
    isAutopilotRunning: state.autopilotSettings.operatingMode !== 'manual',
  })),
  emergencyStop: () => set((state) => ({
    autopilotSettings: {
      ...state.autopilotSettings,
      isPaused: true,
      pausedAt: new Date(),
      pauseReason: 'Emergency stop activated',
    },
    isAutopilotRunning: false,
    auditLog: [
      {
        id: `audit_${Date.now()}`,
        timestamp: new Date(),
        action: 'emergency_stop' as const,
        actorType: 'user' as const,
        resourceType: 'settings' as const,
        resourceId: 'autopilot',
        details: 'Emergency stop activated by user',
        success: true,
      },
      ...state.auditLog,
    ],
  })),

  // Scheduled Slots (Queue)
  scheduledSlots: generateSampleScheduledSlots(),
  setScheduledSlots: (slots) => set({ scheduledSlots: slots }),
  addScheduledSlot: (slot) => set((state) => ({
    scheduledSlots: [...state.scheduledSlots, slot],
  })),
  updateScheduledSlot: (id, updates) => set((state) => ({
    scheduledSlots: state.scheduledSlots.map((slot) =>
      slot.id === id ? { ...slot, ...updates, updatedAt: new Date() } : slot
    ),
  })),
  deleteScheduledSlot: (id) => set((state) => ({
    scheduledSlots: state.scheduledSlots.filter((slot) => slot.id !== id),
  })),
  approveSlot: (id) => set((state) => ({
    scheduledSlots: state.scheduledSlots.map((slot) =>
      slot.id === id ? { ...slot, status: 'approved' as const, updatedAt: new Date() } : slot
    ),
    autopilotNotifications: state.autopilotNotifications.map((n) =>
      n.slotId === id ? { ...n, isActioned: true, actionTaken: 'approved' as const } : n
    ),
    auditLog: [
      {
        id: `audit_${Date.now()}`,
        timestamp: new Date(),
        action: 'post_approved' as const,
        actorType: 'user' as const,
        resourceType: 'slot' as const,
        resourceId: id,
        details: 'Post approved for publishing',
        success: true,
      },
      ...state.auditLog,
    ],
  })),
  denySlot: (id, reason) => set((state) => ({
    scheduledSlots: state.scheduledSlots.map((slot) =>
      slot.id === id ? { ...slot, status: 'denied' as const, denialReason: reason, updatedAt: new Date() } : slot
    ),
    autopilotNotifications: state.autopilotNotifications.map((n) =>
      n.slotId === id ? { ...n, isActioned: true, actionTaken: 'denied' as const } : n
    ),
    auditLog: [
      {
        id: `audit_${Date.now()}`,
        timestamp: new Date(),
        action: 'post_denied' as const,
        actorType: 'user' as const,
        resourceType: 'slot' as const,
        resourceId: id,
        details: `Post denied${reason ? `: ${reason}` : ''}`,
        success: true,
      },
      ...state.auditLog,
    ],
  })),

  // Weekly Schedule
  weeklySchedule: generateSampleWeeklySchedule(),
  setWeeklySchedule: (schedule) => set({ weeklySchedule: schedule }),
  lockWeek: () => set((state) => ({
    weeklySchedule: state.weeklySchedule ? { ...state.weeklySchedule, isLocked: true } : null,
    auditLog: [
      {
        id: `audit_${Date.now()}`,
        timestamp: new Date(),
        action: 'schedule_locked' as const,
        actorType: 'user' as const,
        resourceType: 'slot' as const,
        resourceId: 'weekly',
        details: 'Weekly schedule locked',
        success: true,
      },
      ...state.auditLog,
    ],
  })),
  unlockWeek: () => set((state) => ({
    weeklySchedule: state.weeklySchedule ? { ...state.weeklySchedule, isLocked: false } : null,
  })),
  regenerateSchedule: () => set((state) => {
    const newSlots = generateSampleScheduledSlots();
    return {
      scheduledSlots: newSlots,
      weeklySchedule: state.weeklySchedule ? { ...state.weeklySchedule, slots: newSlots } : null,
      auditLog: [
        {
          id: `audit_${Date.now()}`,
          timestamp: new Date(),
          action: 'schedule_regenerated' as const,
          actorType: 'user' as const,
          resourceType: 'slot' as const,
          resourceId: 'weekly',
          details: `Regenerated schedule with ${newSlots.length} slots`,
          success: true,
        },
        ...state.auditLog,
      ],
    };
  }),

  // Notifications
  autopilotNotifications: generateSampleNotifications(),
  setAutopilotNotifications: (notifications) => set({ autopilotNotifications: notifications }),
  addNotification: (notification) => set((state) => ({
    autopilotNotifications: [notification, ...state.autopilotNotifications],
  })),
  markNotificationRead: (id) => set((state) => ({
    autopilotNotifications: state.autopilotNotifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    ),
  })),
  markNotificationActioned: (id, action) => set((state) => ({
    autopilotNotifications: state.autopilotNotifications.map((n) =>
      n.id === id ? { ...n, isActioned: true, actionTaken: action } : n
    ),
  })),
  dismissNotification: (id) => set((state) => ({
    autopilotNotifications: state.autopilotNotifications.filter((n) => n.id !== id),
  })),

  // Audit Log
  auditLog: generateSampleAuditLog(),
  setAuditLog: (log) => set({ auditLog: log }),
  addAuditEntry: (entry) => set((state) => ({
    auditLog: [entry, ...state.auditLog],
  })),

  // Autopilot Status
  isAutopilotRunning: true,
  lastScheduleGeneration: new Date(Date.now() - 24 * 60 * 60 * 1000),
  nextScheduledPost: null,

  // ==========================================
  // MULTI-TENANT OAUTH STATE IMPLEMENTATION
  // ==========================================

  // Current Organization
  currentOrganization: generateSampleOrganization(),
  setCurrentOrganization: (org) => set({ currentOrganization: org }),
  updateOrganization: (updates) => set((state) => ({
    currentOrganization: state.currentOrganization
      ? { ...state.currentOrganization, ...updates, updatedAt: new Date() }
      : null,
    organizations: state.organizations.map((org) =>
      org.id === state.currentOrganization?.id
        ? { ...org, ...updates, updatedAt: new Date() }
        : org
    ),
  })),

  // Organizations List
  organizations: generateSampleOrganizations(),
  setOrganizations: (orgs) => set({ organizations: orgs }),
  addOrganization: (org) => set((state) => ({
    organizations: [...state.organizations, org],
  })),
  removeOrganization: (id) => set((state) => ({
    organizations: state.organizations.filter((org) => org.id !== id),
  })),

  // Organization Members
  organizationMembers: generateSampleMembers(),
  setOrganizationMembers: (members) => set({ organizationMembers: members }),
  addOrganizationMember: (member) => set((state) => ({
    organizationMembers: [...state.organizationMembers, member],
  })),
  updateOrganizationMember: (id, updates) => set((state) => ({
    organizationMembers: state.organizationMembers.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    ),
  })),
  removeOrganizationMember: (id) => set((state) => ({
    organizationMembers: state.organizationMembers.filter((m) => m.id !== id),
  })),

  // OAuth Connections
  oauthConnections: generateSampleOAuthConnections(),
  setOAuthConnections: (connections) => set({ oauthConnections: connections }),
  addOAuthConnection: (connection) => set((state) => ({
    oauthConnections: [...state.oauthConnections, connection],
    auditLog: [
      {
        id: `audit_${Date.now()}`,
        timestamp: new Date(),
        action: 'account_connected' as const,
        actorType: 'user' as const,
        actorId: connection.connectedByUserId,
        resourceType: 'connection' as const,
        resourceId: connection.id,
        details: `Connected ${connection.platform} account: ${connection.username}`,
        success: true,
      },
      ...state.auditLog,
    ],
  })),
  updateOAuthConnection: (id, updates) => set((state) => ({
    oauthConnections: state.oauthConnections.map((c) =>
      c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
    ),
  })),
  removeOAuthConnection: (id) => set((state) => {
    const connection = state.oauthConnections.find((c) => c.id === id);
    return {
      oauthConnections: state.oauthConnections.filter((c) => c.id !== id),
      auditLog: connection
        ? [
            {
              id: `audit_${Date.now()}`,
              timestamp: new Date(),
              action: 'account_disconnected' as const,
              actorType: 'user' as const,
              resourceType: 'connection' as const,
              resourceId: id,
              details: `Disconnected ${connection.platform} account: ${connection.username}`,
              success: true,
            },
            ...state.auditLog,
          ]
        : state.auditLog,
    };
  }),
  toggleAutopost: (id, enabled) => set((state) => ({
    oauthConnections: state.oauthConnections.map((c) =>
      c.id === id ? { ...c, isEnabledForAutopost: enabled, updatedAt: new Date() } : c
    ),
    auditLog: [
      {
        id: `audit_${Date.now()}`,
        timestamp: new Date(),
        action: enabled ? 'autopost_enabled' as const : 'autopost_disabled' as const,
        actorType: 'user' as const,
        resourceType: 'connection' as const,
        resourceId: id,
        details: `${enabled ? 'Enabled' : 'Disabled'} autopost for connection`,
        success: true,
      },
      ...state.auditLog,
    ],
  })),
  refreshConnectionToken: (id) => set((state) => ({
    oauthConnections: state.oauthConnections.map((c) =>
      c.id === id
        ? {
            ...c,
            status: 'pending_refresh' as const,
            updatedAt: new Date(),
          }
        : c
    ),
  })),

  // OAuth Flow State
  oauthFlowState: null,
  setOAuthFlowState: (flowState) => set({ oauthFlowState: flowState }),
  startOAuthFlow: (platform, organizationId, userId) => set({
    oauthFlowState: {
      platform,
      organizationId,
      initiatedByUserId: userId,
      state: `oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      redirectUri: `${window.location.origin}/oauth/callback`,
      requestedScopes: [],
      status: 'initiated',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  }),
  completeOAuthFlow: (connection) => set((state) => ({
    oauthFlowState: state.oauthFlowState
      ? { ...state.oauthFlowState, status: 'completed' }
      : null,
    oauthConnections: [...state.oauthConnections, connection],
  })),
  cancelOAuthFlow: () => set({ oauthFlowState: null }),

  // Publish Jobs
  publishJobs: generateSamplePublishJobs(),
  setPublishJobs: (jobs) => set({ publishJobs: jobs }),
  addPublishJob: (job) => set((state) => ({
    publishJobs: [...state.publishJobs, job],
  })),
  updatePublishJob: (id, updates) => set((state) => ({
    publishJobs: state.publishJobs.map((j) =>
      j.id === id ? { ...j, ...updates, updatedAt: new Date() } : j
    ),
  })),
  retryPublishJob: (id) => set((state) => ({
    publishJobs: state.publishJobs.map((j) =>
      j.id === id
        ? {
            ...j,
            status: 'queued' as const,
            attemptCount: 0,
            errorCode: undefined,
            errorMessage: undefined,
            updatedAt: new Date(),
          }
        : j
    ),
  })),
  cancelPublishJob: (id) => set((state) => ({
    publishJobs: state.publishJobs.filter((j) => j.id !== id),
  })),

  // Quota Management
  quotaUsage: generateSampleQuotaUsage(),
  setQuotaUsage: (usage) => set({ quotaUsage: usage }),
  updateQuotaUsage: (orgId, metric, used) => set((state) => ({
    quotaUsage: state.quotaUsage.map((q) =>
      q.organizationId === orgId && q.metric === metric
        ? { ...q, used, lastUpdated: new Date() }
        : q
    ),
  })),

  quotaWarnings: generateSampleQuotaWarnings(),
  setQuotaWarnings: (warnings) => set({ quotaWarnings: warnings }),
  acknowledgeQuotaWarning: (id, userId) => set((state) => ({
    quotaWarnings: state.quotaWarnings.map((w) =>
      w.id === id
        ? { ...w, acknowledgedAt: new Date(), acknowledgedByUserId: userId }
        : w
    ),
  })),

  // Helper Functions - these access state via get() parameter
  getConnectionsByOrg: (orgId: string) => {
    const state = get();
    return state.oauthConnections.filter((c: OAuthConnection) => c.organizationId === orgId);
  },
  getConnectionCapabilities: (connectionId: string) => {
    const state = get();
    const connection = state.oauthConnections.find((c: OAuthConnection) => c.id === connectionId);
    return connection?.capabilities || [];
  },
  canPublish: (connectionId: string) => {
    const state = get();
    const connection = state.oauthConnections.find((c: OAuthConnection) => c.id === connectionId);
    if (!connection) return false;
    return (
      connection.status === 'active' &&
      connection.capabilities.includes('publish_post')
    );
  },
  isQuotaExceeded: (orgId: string, metric: QuotaUsage['metric']) => {
    const state = get();
    const quota = state.quotaUsage.find(
      (q: QuotaUsage) => q.organizationId === orgId && q.metric === metric
    );
    if (!quota) return false;
    if (quota.limit === -1) return false; // unlimited
    return quota.used >= quota.limit;
  },
  getQuotaPercentage: (orgId: string, metric: QuotaUsage['metric']) => {
    const state = get();
    const quota = state.quotaUsage.find(
      (q: QuotaUsage) => q.organizationId === orgId && q.metric === metric
    );
    if (!quota) return 0;
    if (quota.limit === -1) return 0; // unlimited
    return Math.min(100, Math.round((quota.used / quota.limit) * 100));
  },

  // ==========================================
  // BRAND MANAGEMENT STATE IMPLEMENTATION
  // ==========================================
  activeBrandId: (() => {
    // Load from localStorage on initialization
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hostess_active_brand_id');
      return stored || null;
    }
    return null;
  })(),
  setActiveBrandId: (brandId) => {
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      if (brandId === null) {
        localStorage.removeItem('hostess_active_brand_id');
      } else {
        localStorage.setItem('hostess_active_brand_id', brandId);
      }
    }
    set({ activeBrandId: brandId });
  },
  brands: [],
  setBrands: (brands) => set({ brands }),
  addBrand: (brand) => set((state) => ({ brands: [...state.brands, brand] })),
  updateBrand: (id, updates) => set((state) => ({
    brands: state.brands.map((b) => (b.id === id ? { ...b, ...updates, updatedAt: new Date() } : b)),
  })),
  removeBrand: (id) => set((state) => {
    const newBrands = state.brands.filter((b) => b.id !== id);
    // If removed brand was active, switch to first available or null
    let newActiveBrandId = state.activeBrandId;
    if (state.activeBrandId === id) {
      newActiveBrandId = newBrands.length > 0 ? newBrands[0].id : null;
      if (typeof window !== 'undefined') {
        if (newActiveBrandId) {
          localStorage.setItem('hostess_active_brand_id', newActiveBrandId);
        } else {
          localStorage.removeItem('hostess_active_brand_id');
        }
      }
    }
    return { brands: newBrands, activeBrandId: newActiveBrandId };
  }),
};
});

// Helper functions that work with the store (called externally)
export const getConnectionsByOrg = (orgId: string): OAuthConnection[] => {
  const state = useAppStore.getState();
  return state.oauthConnections.filter((c: OAuthConnection) => c.organizationId === orgId);
};

export const getConnectionCapabilities = (connectionId: string): string[] => {
  const state = useAppStore.getState();
  const connection = state.oauthConnections.find((c: OAuthConnection) => c.id === connectionId);
  return connection?.capabilities || [];
};

export const canPublish = (connectionId: string): boolean => {
  const state = useAppStore.getState();
  const connection = state.oauthConnections.find((c: OAuthConnection) => c.id === connectionId);
  if (!connection) return false;
  return (
    connection.status === 'active' &&
    connection.capabilities.includes('publish_post')
  );
};

export const isQuotaExceeded = (orgId: string, metric: QuotaUsage['metric']): boolean => {
  const state = useAppStore.getState();
  const quota = state.quotaUsage.find(
    (q: QuotaUsage) => q.organizationId === orgId && q.metric === metric
  );
  if (!quota) return false;
  if (quota.limit === -1) return false; // unlimited
  return quota.used >= quota.limit;
};

export const getQuotaPercentage = (orgId: string, metric: QuotaUsage['metric']): number => {
  const state = useAppStore.getState();
  const quota = state.quotaUsage.find(
    (q: QuotaUsage) => q.organizationId === orgId && q.metric === metric
  );
  if (!quota) return 0;
  if (quota.limit === -1) return 0; // unlimited
  return Math.min(100, Math.round((quota.used / quota.limit) * 100));
};
