/**
 * Steward schema types aligned with supabase/migrations/20260707*.
 * Source of truth until generated types are checked in.
 */

export type StewardPlatform =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'x'
  | 'threads'
  | 'pinterest'
  | 'bluesky'
  | 'google_business_profile'
  | 'reddit'
  | 'slack'
  | 'notion'
  | 'other';

export type StewardPostStatus =
  | 'idea'
  | 'draft'
  | 'generated'
  | 'in_review'
  | 'needs_review'
  | 'needs_approval'
  | 'revision_requested'
  | 'rejected'
  | 'approved'
  | 'scheduled'
  | 'publishing'
  | 'retrying'
  | 'published'
  | 'failed'
  | 'archived';

export type PostWorkflowStatus =
  | 'draft'
  | 'in_review'
  | 'revision_requested'
  | 'rejected'
  | 'approved'
  | 'scheduled'
  | 'publishing'
  | 'retrying'
  | 'published'
  | 'failed';

export type StewardPublishJobStatus =
  | 'queued'
  | 'locked'
  | 'processing'
  | 'publishing'
  | 'completed'
  | 'succeeded'
  | 'failed'
  | 'retrying'
  | 'canceled'
  | 'skipped';

export type StewardApprovalStatus =
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'revision_requested'
  | 'canceled';

export type StewardAssetType =
  | 'image'
  | 'video'
  | 'generated_image'
  | 'generated_video'
  | 'thumbnail'
  | 'raw_footage'
  | 'edited_media'
  | 'document'
  | 'note'
  | 'audio'
  | 'caption'
  | 'transcript'
  | 'ai_analysis'
  | 'template'
  | 'hashtags';

export type StewardOrganizationRole =
  | 'owner'
  | 'admin'
  | 'strategist'
  | 'editor'
  | 'approver'
  | 'viewer'
  | 'client'
  | 'service'
  | 'member'
  | 'manager'
  | 'publisher'
  | 'analyst';

export type StewardAiJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';

export type StewardAiJobType =
  | 'caption_generation'
  | 'content_repurposing'
  | 'hashtag_generation'
  | 'image_analysis'
  | 'video_analysis'
  | 'transcription'
  | 'scheduling_recommendation'
  | 'performance_analysis'
  | 'brand_voice_training'
  | 'content_scoring'
  | 'post_idea_generation'
  | 'variant_generation';

export interface BrandProfileRow {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  business_name: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  industry: string | null;
  audience_description: string | null;
  ideal_customer_profiles: unknown[];
  brand_voice: string | null;
  words_to_use: unknown[];
  words_to_avoid: unknown[];
  tone_settings: Record<string, unknown>;
  cta_preferences: unknown[];
  hashtag_bank: unknown[];
  offer_language: unknown[];
  posting_goals: unknown[];
  competitor_notes: string | null;
  platform_priorities: unknown[];
  visual_style_notes: string | null;
  logo_asset_id: string | null;
  ai_system_instructions: string | null;
  metadata: Record<string, unknown>;
  is_default: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetRow {
  id: string;
  organization_id: string;
  brand_id: string | null;
  type: StewardAssetType | string;
  uploaded_by: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  public_url: string | null;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  transcription: string | null;
  visual_analysis: Record<string, unknown>;
  approval_status: string;
  content_category: string | null;
  tags: unknown[];
  metadata: Record<string, unknown>;
  url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostDraftRow {
  id: string;
  organization_id: string | null;
  brand_id: string | null;
  campaign_id: string | null;
  content_pillar_id: string | null;
  topic_id: string | null;
  title: string | null;
  content: string;
  main_caption: string | null;
  hook: string | null;
  cta: string | null;
  platform: StewardPlatform | string;
  status: StewardPostStatus | string;
  approval_state: string;
  scheduled_time: string | null;
  published_time: string | null;
  hashtags: unknown[];
  media_asset_ids: unknown[];
  media_urls: unknown[];
  author_id: string;
  assigned_to: string | null;
  ai_generation_source: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PostVariantRow {
  id: string;
  post_id: string;
  organization_id: string;
  brand_id: string | null;
  platform: StewardPlatform;
  caption: string | null;
  hook: string | null;
  hashtags: unknown[];
  title: string | null;
  description: string | null;
  first_comment: string | null;
  thumbnail_asset_id: string | null;
  media_asset_ids: unknown[];
  character_count: number | null;
  platform_validation_status: string;
  ai_notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PublishJobRow {
  id: string;
  organization_id: string;
  post_id: string | null;
  post_variant_id: string | null;
  social_account_id: string | null;
  connection_id: string;
  platform: StewardPlatform | string;
  status: StewardPublishJobStatus | string;
  scheduled_at: string;
  scheduled_for: string | null;
  idempotency_key: string | null;
  post_content: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AiJobRow {
  id: string;
  organization_id: string;
  brand_id: string | null;
  job_type: StewardAiJobType;
  status: StewardAiJobStatus;
  model_provider: string | null;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  error_message: string | null;
  created_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AutomationRuleRow {
  id: string;
  organization_id: string;
  brand_id: string;
  name: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  action_type: string;
  action_config: Record<string, unknown>;
  enabled: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ContentCalendarEntryRow {
  id: string;
  organization_id: string;
  brand_id: string;
  post_id: string | null;
  campaign_id: string | null;
  title: string;
  scheduled_for: string;
  timezone: string;
  platform: StewardPlatform | null;
  status: string;
  requires_approval: boolean;
  queue_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PostMetricsSnapshotRow {
  id: string;
  organization_id: string;
  publication_id: string;
  collected_at: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  video_views: number;
  engagement_rate: number | null;
  metadata: Record<string, unknown>;
}
