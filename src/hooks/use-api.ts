/**
 * React Query hooks for API services
 * Replaces mock data with real API calls
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import {
  postsApi,
  campaignsApi,
  socialAccountsApi,
  conversationsApi,
  alertsApi,
  organizationsApi,
  membersApi,
  oauthApi,
  publishJobsApi,
  quotaApi,
  autopilotApi,
  assetsApi,
  hashtagsApi,
  rssFeedsApi,
  analyticsApi,
  schedulingApi,
  recyclingApi,
  eventsApi,
  autopilotBriefApi,
  brandsApi,
  scheduleTemplatesApi,
  calendarApi,
  googleIntegrationApi,
  emailApi,
  type BusinessScheduleTemplate,
  type CalendarItem,
} from '@/sdk/services/api-services';
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
} from '@/types/app';

// ============================================================================
// POSTS HOOKS
// ============================================================================

export function usePosts(
  params?: { platform?: string; status?: string; campaignId?: string },
  options?: UseQueryOptions<{ posts: Post[]; total: number }, Error>,
) {
  return useQuery({
    queryKey: ['posts', params],
    queryFn: () => postsApi.list(params),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

export function usePost(id: string, options?: UseQueryOptions<Post, Error>) {
  return useQuery({
    queryKey: ['posts', id],
    queryFn: () => postsApi.get(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreatePost(options?: UseMutationOptions<Post, Error, Omit<Post, 'id' | 'createdAt' | 'updatedAt'>>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    ...options,
  });
}

export function useUpdatePost(options?: UseMutationOptions<Post, Error, { id: string; updates: Partial<Post> }>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) => postsApi.update(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts', variables.id] });
    },
    ...options,
  });
}

export function useDeletePost(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    ...options,
  });
}

export function useBulkCreatePosts(
  options?: UseMutationOptions<
    { results: Array<{ success: boolean; post?: Post; error?: string; index: number }>; summary: { total: number; successful: number; failed: number } },
    Error,
    Array<Omit<Post, 'id' | 'createdAt' | 'updatedAt'>>
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postsApi.bulkCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    ...options,
  });
}

export function usePublishPost(options?: UseMutationOptions<PublishJob, Error, string>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postsApi.publish,
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts', id] });
      queryClient.invalidateQueries({ queryKey: ['publish-jobs'] });
    },
    ...options,
  });
}

// ============================================================================
// CAMPAIGNS HOOKS
// ============================================================================

export function useCampaigns(params?: { status?: string }, options?: UseQueryOptions<{ campaigns: Campaign[]; total: number }, Error>) {
  return useQuery({
    queryKey: ['campaigns', params],
    queryFn: () => campaignsApi.list(params),
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
}

export function useCampaign(id: string, options?: UseQueryOptions<Campaign, Error>) {
  return useQuery({
    queryKey: ['campaigns', id],
    queryFn: () => campaignsApi.get(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateCampaign(
  options?: UseMutationOptions<Campaign, Error, Omit<Campaign, 'id' | 'postCount' | 'totalEngagement'>>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: campaignsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    ...options,
  });
}

// ============================================================================
// SOCIAL ACCOUNTS HOOKS
// ============================================================================

export function useSocialAccounts(
  params?: { platform?: string; isConnected?: boolean },
  options?: UseQueryOptions<{ accounts: SocialAccount[] }, Error>,
) {
  return useQuery({
    queryKey: ['social-accounts', params],
    queryFn: () => socialAccountsApi.list(params),
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
}

export function useCreateSocialAccount(
  options?: UseMutationOptions<SocialAccount, Error, Omit<SocialAccount, 'id' | 'createdAt' | 'updatedAt'>>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: socialAccountsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
    },
    ...options,
  });
}

export function useSyncSocialAccount(options?: UseMutationOptions<SocialAccount, Error, string>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: socialAccountsApi.sync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
    },
    ...options,
  });
}

export function useDeleteSocialAccount(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: socialAccountsApi.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
    },
    ...options,
  });
}

// ============================================================================
// CONVERSATIONS HOOKS
// ============================================================================

export function useConversations(
  params?: { platform?: string; status?: string },
  options?: UseQueryOptions<{ conversations: Conversation[]; total: number }, Error>,
) {
  return useQuery({
    queryKey: ['conversations', params],
    queryFn: () => conversationsApi.list(params),
    staleTime: 10 * 1000, // 10 seconds (more frequent updates)
    ...options,
  });
}

export function useUpdateConversation(
  options?: UseMutationOptions<Conversation, Error, { id: string; updates: Partial<Conversation> }>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) => conversationsApi.update(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversations', variables.id] });
    },
    ...options,
  });
}

// ============================================================================
// ALERTS HOOKS
// ============================================================================

export function useAlerts(
  params?: { platform?: string; isActive?: boolean },
  options?: UseQueryOptions<{ alerts: Alert[] }, Error>,
) {
  return useQuery({
    queryKey: ['alerts', params],
    queryFn: () => alertsApi.list(params),
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
}

// ============================================================================
// ORGANIZATIONS HOOKS
// ============================================================================

export function useOrganizations(options?: UseQueryOptions<{ organizations: Organization[] }, Error>) {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationsApi.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

export function useOrganization(id: string, options?: UseQueryOptions<Organization, Error>) {
  return useQuery({
    queryKey: ['organizations', id],
    queryFn: () => organizationsApi.get(id),
    enabled: !!id,
    ...options,
  });
}

// ============================================================================
// OAUTH HOOKS
// ============================================================================

export function useOAuthConnections(
  organizationId?: string,
  options?: UseQueryOptions<{ connections: OAuthConnection[] }, Error>,
) {
  return useQuery({
    queryKey: ['oauth-connections', organizationId],
    queryFn: () => oauthApi.list(organizationId),
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
}

export function useRefreshOAuthToken(options?: UseMutationOptions<OAuthConnection, Error, string>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: oauthApi.refresh,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oauth-connections'] });
    },
    ...options,
  });
}

// ============================================================================
// PUBLISH JOBS HOOKS
// ============================================================================

export function usePublishJobs(
  params?: { organizationId?: string; status?: string },
  options?: UseQueryOptions<{ jobs: PublishJob[]; total: number }, Error>,
) {
  return useQuery({
    queryKey: ['publish-jobs', params],
    queryFn: () => publishJobsApi.list(params),
    staleTime: 10 * 1000, // 10 seconds
    ...options,
  });
}

export function useRetryPublishJob(options?: UseMutationOptions<PublishJob, Error, string>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: publishJobsApi.retry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publish-jobs'] });
    },
    ...options,
  });
}

// ============================================================================
// QUOTA HOOKS
// ============================================================================

export function useQuotaUsage(organizationId: string, options?: UseQueryOptions<{ usage: QuotaUsage[] }, Error>) {
  return useQuery({
    queryKey: ['quota-usage', organizationId],
    queryFn: () => quotaApi.getUsage(organizationId),
    enabled: !!organizationId,
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
}

// ============================================================================
// AUTOPILOT HOOKS
// ============================================================================

export function useBrandProfile(organizationId: string, options?: UseQueryOptions<BrandProfile, Error>) {
  return useQuery({
    queryKey: ['brand-profile', organizationId],
    queryFn: () => autopilotApi.getBrandProfile(organizationId),
    enabled: !!organizationId,
    ...options,
  });
}

export function useAutopilotSettings(organizationId: string, options?: UseQueryOptions<AutopilotSettings, Error>) {
  return useQuery({
    queryKey: ['autopilot-settings', organizationId],
    queryFn: () => autopilotApi.getSettings(organizationId),
    enabled: !!organizationId,
    ...options,
  });
}

export function useUpdateAutopilotSettings(
  organizationId: string,
  options?: UseMutationOptions<AutopilotSettings, Error, Partial<AutopilotSettings>>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates) => autopilotApi.updateSettings(organizationId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autopilot-settings', organizationId] });
    },
    ...options,
  });
}

export function useScheduledSlots(
  organizationId: string,
  params?: { weekStart?: Date; weekEnd?: Date },
  options?: UseQueryOptions<{ slots: ScheduledSlot[] }, Error>,
) {
  return useQuery({
    queryKey: ['scheduled-slots', organizationId, params],
    queryFn: () => autopilotApi.getScheduledSlots(organizationId, params),
    enabled: !!organizationId,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

// ============================================================================
// ASSETS HOOKS
// ============================================================================

export function useAssets(
  params?: { type?: string; search?: string; tags?: string | string[] },
  options?: UseQueryOptions<{ assets: Asset[]; total: number }, Error>,
) {
  return useQuery({
    queryKey: ['assets', params],
    queryFn: () => assetsApi.list(params),
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
}

export function useAsset(id: string, options?: UseQueryOptions<Asset, Error>) {
  return useQuery({
    queryKey: ['assets', id],
    queryFn: () => assetsApi.get(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateAsset(options?: UseMutationOptions<Asset, Error, Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assetsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    ...options,
  });
}

export function useUploadAssets(
  options?: UseMutationOptions<{ assets: Asset[] }, Error, { files: File[]; tags?: string[] }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ files, tags }) => assetsApi.upload(files, tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    ...options,
  });
}

export function useUpdateAsset(options?: UseMutationOptions<Asset, Error, { id: string; updates: Partial<Asset> }>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) => assetsApi.update(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['assets', variables.id] });
    },
    ...options,
  });
}

export function useDeleteAsset(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assetsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    ...options,
  });
}

// ============================================================================
// HASHTAG RECOMMENDATIONS HOOKS
// ============================================================================

export function useHashtagRecommendations(
  content: string,
  platform?: string,
  options?: UseQueryOptions<{ recommendations: HashtagRecommendation[]; total: number }, Error>
) {
  return useQuery({
    queryKey: ['hashtag-recommendations', content, platform],
    queryFn: () => hashtagsApi.getRecommendations(content, platform),
    enabled: content.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

// ============================================================================
// RSS FEED HOOKS
// ============================================================================

export function useRSSFeeds(options?: UseQueryOptions<{ feeds: RSSFeed[]; total: number }, Error>) {
  return useQuery({
    queryKey: ['rss-feeds'],
    queryFn: () => rssFeedsApi.list(),
    staleTime: 30 * 1000,
    ...options,
  });
}

export function useRSSFeed(id: string, options?: UseQueryOptions<RSSFeed, Error>) {
  return useQuery({
    queryKey: ['rss-feeds', id],
    queryFn: () => rssFeedsApi.get(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateRSSFeed(
  options?: UseMutationOptions<RSSFeed, Error, Omit<RSSFeed, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rssFeedsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rss-feeds'] });
    },
    ...options,
  });
}

export function useUpdateRSSFeed(
  options?: UseMutationOptions<RSSFeed, Error, { id: string; updates: Partial<RSSFeed> }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) => rssFeedsApi.update(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rss-feeds'] });
      queryClient.invalidateQueries({ queryKey: ['rss-feeds', variables.id] });
    },
    ...options,
  });
}

export function useDeleteRSSFeed(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rssFeedsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rss-feeds'] });
    },
    ...options,
  });
}

export function useImportRSSFeed(
  options?: UseMutationOptions<{ items: RSSFeedItem[]; count: number }, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rssFeedsApi.import,
    onSuccess: (data, feedId) => {
      queryClient.invalidateQueries({ queryKey: ['rss-feeds'] });
      queryClient.invalidateQueries({ queryKey: ['rss-feeds', feedId] });
      queryClient.invalidateQueries({ queryKey: ['rss-feed-items', feedId] });
    },
    ...options,
  });
}

export function useRSSFeedItems(feedId: string, options?: UseQueryOptions<{ items: RSSFeedItem[]; total: number }, Error>) {
  return useQuery({
    queryKey: ['rss-feed-items', feedId],
    queryFn: () => rssFeedsApi.getItems(feedId),
    enabled: !!feedId,
    staleTime: 30 * 1000,
    ...options,
  });
}

// ============================================================================
// ANALYTICS HOOKS
// ============================================================================

export function useBestTimeToPost(
  platform?: string,
  options?: UseQueryOptions<{ bestTimes: BestTimeToPost[]; total: number }, Error>
) {
  return useQuery({
    queryKey: ['best-time-to-post', platform],
    queryFn: () => analyticsApi.getBestTimeToPost(platform),
    staleTime: 60 * 60 * 1000, // 1 hour
    ...options,
  });
}

// ============================================================================
// SCHEDULING HOOKS
// ============================================================================

export function useTimezoneOptimization(
  platform: string,
  timezone: string,
  audienceTimezone?: string,
  options?: UseQueryOptions<TimeZoneOptimization, Error>
) {
  return useQuery({
    queryKey: ['timezone-optimization', platform, timezone, audienceTimezone],
    queryFn: () => schedulingApi.getTimezoneOptimization(platform, timezone, audienceTimezone),
    enabled: !!platform && !!timezone,
    staleTime: 60 * 60 * 1000, // 1 hour
    ...options,
  });
}

// ============================================================================
// CONTENT RECYCLING HOOKS
// ============================================================================

export function useRecyclePost(
  options?: UseMutationOptions<{ recycledPost: RecycledPost; newPost: Post; recycleCount: number }, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recyclingApi.recyclePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['recycled-posts'] });
    },
    ...options,
  });
}

export function useRecycledPosts(
  options?: UseQueryOptions<{ recycledPosts: RecycledPost[]; total: number }, Error>
) {
  return useQuery({
    queryKey: ['recycled-posts'],
    queryFn: () => recyclingApi.getRecycledPosts(),
    staleTime: 30 * 1000,
    ...options,
  });
}

// ============================================================================
// EVENTS HOOKS
// ============================================================================

export function useEvents(
  params?: { from?: string; to?: string },
  options?: UseQueryOptions<{ events: Event[]; total: number }, Error>
) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: () => eventsApi.list(params),
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
}

export function useEvent(id: string, options?: UseQueryOptions<Event, Error>) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: () => eventsApi.get(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateEvent(
  options?: UseMutationOptions<Event, Error, Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    ...options,
  });
}

export function useGenerateEventDrafts(
  options?: UseMutationOptions<{ posts: Post[]; count: number }, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: eventsApi.generateDrafts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    ...options,
  });
}

// ============================================================================
// AUTOPILOT BRIEF HOOKS
// ============================================================================

export function useAutopilotBrief(
  options?: UseQueryOptions<AutopilotBrief, Error>
) {
  return useQuery({
    queryKey: ['autopilot', 'brief'],
    queryFn: () => autopilotBriefApi.get(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

export function useUpdateAutopilotBrief(
  options?: UseMutationOptions<AutopilotBrief, Error, Partial<AutopilotBrief>>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: autopilotBriefApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autopilot', 'brief'] });
    },
    ...options,
  });
}

export function useGenerateStrategyPlan(
  options?: UseMutationOptions<StrategyPlan, Error, void>
) {
  return useMutation({
    mutationFn: () => autopilotBriefApi.generatePlan(),
    ...options,
  });
}

export function useAutopilotGenerate(
  options?: UseMutationOptions<import('@/types/app').AutopilotGenerateResponse, Error, { from?: string; to?: string }>
) {
  return useMutation({
    mutationFn: (params: { from?: string; to?: string }) => autopilotBriefApi.generate(params),
    ...options,
  });
}

// ============================================================================
// BRANDS HOOKS
// ============================================================================

export function useBrands(
  options?: UseQueryOptions<{ brands: Brand[] }, Error>
) {
  return useQuery({
    queryKey: ['brands'],
    queryFn: () => brandsApi.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

export function useCurrentBrand(
  options?: UseQueryOptions<Brand, Error>
) {
  return useQuery({
    queryKey: ['brands', 'current'],
    queryFn: () => brandsApi.getCurrent(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

export function useCreateBrand(
  options?: UseMutationOptions<Brand, Error, Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: brandsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
    ...options,
  });
}

export function useUpdateBrand(
  options?: UseMutationOptions<Brand, Error, { id: string; updates: Partial<Brand> }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) => brandsApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      queryClient.invalidateQueries({ queryKey: ['current-brand'] });
    },
    ...options,
  });
}

export function useUploadBrandAvatar(
  options?: UseMutationOptions<{ avatarUrl: string }, Error, { id: string; file: File }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }) => brandsApi.uploadAvatar(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      queryClient.invalidateQueries({ queryKey: ['current-brand'] });
    },
    ...options,
  });
}

export function useDeleteBrandAvatar(
  options?: UseMutationOptions<{ avatarUrl?: string }, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => brandsApi.deleteAvatar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      queryClient.invalidateQueries({ queryKey: ['current-brand'] });
    },
    ...options,
  });
}

export function useDeleteBrand(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: brandsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
    ...options,
  });
}

export function useSetCurrentBrand(
  options?: UseMutationOptions<Brand, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: brandsApi.setCurrent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands', 'current'] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
    ...options,
  });
}

// ============================================================================
// SCHEDULE TEMPLATES HOOKS
// ============================================================================

export function useScheduleTemplates(
  options?: UseQueryOptions<{ templates: BusinessScheduleTemplate[] }, Error>
) {
  return useQuery({
    queryKey: ['schedule-templates'],
    queryFn: () => scheduleTemplatesApi.list(),
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
}

export function useCreateScheduleTemplate(
  options?: UseMutationOptions<BusinessScheduleTemplate, Error, Omit<BusinessScheduleTemplate, 'id' | 'brandId' | 'createdAt' | 'updatedAt'>>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scheduleTemplatesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-templates'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
    ...options,
  });
}

export function useUpdateScheduleTemplate(
  options?: UseMutationOptions<BusinessScheduleTemplate, Error, { id: string; updates: Partial<BusinessScheduleTemplate> }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) => scheduleTemplatesApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-templates'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
    ...options,
  });
}

export function useDeleteScheduleTemplate(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scheduleTemplatesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-templates'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
    ...options,
  });
}

// ============================================================================
// CALENDAR HOOKS
// ============================================================================

export function useCalendar(
  params: { from: string; to: string },
  options?: UseQueryOptions<{ items: CalendarItem[] }, Error>
) {
  return useQuery({
    queryKey: ['calendar', params],
    queryFn: () => calendarApi.getItems(params),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

// ============================================================================
// GOOGLE INTEGRATION HOOKS
// ============================================================================

export function useGoogleIntegrations(
  options?: UseQueryOptions<{ integrations: import('@/types/app').GoogleIntegration[] }, Error>
) {
  return useQuery({
    queryKey: ['google-integrations'],
    queryFn: () => googleIntegrationApi.list(),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

export function useDeleteGoogleIntegration(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => googleIntegrationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-integrations'] });
      queryClient.invalidateQueries({ queryKey: ['email-threads'] });
    },
    ...options,
  });
}

// ============================================================================
// EMAIL HOOKS
// ============================================================================

export function useEmailAccounts(
  options?: UseQueryOptions<{ accounts: import('@/types/app').EmailAccount[] }, Error>
) {
  return useQuery({
    queryKey: ['email-accounts'],
    queryFn: () => emailApi.getAccounts(),
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
}

export function useDeleteEmailAccount(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emailApi.deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['email-threads'] });
    },
    ...options,
  });
}

export function useEmailThreads(
  params?: { limit?: number; unreadOnly?: boolean },
  options?: UseQueryOptions<{ threads: import('@/types/app').EmailThread[]; total: number }, Error>
) {
  return useQuery({
    queryKey: ['email-threads', params],
    queryFn: () => emailApi.getThreads(params),
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

export function useEmailMessage(
  id: string,
  options?: UseQueryOptions<import('@/types/app').EmailMessage, Error>
) {
  return useQuery({
    queryKey: ['email-message', id],
    queryFn: () => emailApi.getMessage(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}

export function useSetEmailTriage(
  options?: UseMutationOptions<{ messageId: string; status: import('@/types/app').TriageStatus; brandId: string }, Error, { messageId: string; status: import('@/types/app').TriageStatus }>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, status }) => emailApi.setTriage(messageId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-threads'] });
      queryClient.invalidateQueries({ queryKey: ['email-message'] });
      queryClient.invalidateQueries({ queryKey: ['email-triage'] });
    },
    ...options,
  });
}