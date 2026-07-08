/**
 * Frontend Steward schema helper types.
 * Keep in sync with server/src/types/steward-schema.ts
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
  | 'needs_review'
  | 'needs_approval'
  | 'approved'
  | 'scheduled'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'archived';

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
  brand_voice: string | null;
  hashtag_bank: unknown[];
  ai_system_instructions: string | null;
  metadata: Record<string, unknown>;
}

export interface PostDraftRow {
  id: string;
  organization_id: string | null;
  brand_id: string | null;
  title: string | null;
  content: string;
  status: StewardPostStatus | string;
  platform: StewardPlatform | string;
  scheduled_time: string | null;
}

export interface PostVariantRow {
  id: string;
  post_id: string;
  platform: StewardPlatform;
  caption: string | null;
  hashtags: unknown[];
}
