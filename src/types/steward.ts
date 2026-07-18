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

export interface BrandContextV1 {
  version: '1.0';
  identity: {
    businessName: string;
    publicBrandName: string;
    businessType?: string;
    industry?: string;
    websiteUrl?: string;
    shortDescription?: string;
    missionStatement?: string;
    values: string[];
  };
  audience: Array<{
    name: string;
    description?: string;
    painPoints: string[];
    interests: string[];
    preferredPlatforms: Array<'facebook' | 'instagram'>;
    isPrimary: boolean;
  }>;
  voice: {
    summary: string;
    defaultTone?: string;
    personalityTraits: string[];
    wordsToUse: string[];
    wordsToAvoid: string[];
  };
  pillars: Array<{ name: string; description?: string }>;
  offers: Array<{ name: string; headline?: string; description?: string; ctaText?: string; ctaUrl?: string }>;
  ctas: Array<{ label: string; text: string; destinationUrl?: string; platform?: 'facebook' | 'instagram' }>;
  rules: { prohibitedClaims: string[]; complianceNotes: string; safetyNotes: string };
  platformStrategies: Array<{
    platform: 'facebook' | 'instagram';
    enabled: boolean;
    postingFrequencyGoal: number;
    targetAudience?: string;
    contentTypes: string[];
    notes?: string;
  }>;
  visualKit: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fonts: string[];
    styleNotes?: string;
    logoAssetId?: string;
    brandDocumentAssetIds: string[];
  };
  examples: Array<{ platform: 'facebook' | 'instagram'; content: string; whyItWorks?: string }>;
  postingGoals: string[];
  approvedMemory?: Record<string, unknown>[];
  missingContext?: string[];
  updatedAt?: string;
}

export interface AssetUploadIntent {
  bucket: 'brand-assets' | 'content-media' | 'imports';
  path: string;
  token: string;
  signedUrl: string;
  expiresAt: string;
  requiredHeaders: Record<string, string>;
}

export interface AssetRecord {
  id: string;
  organizationId: string;
  brandId: string | null;
  storageBucket: string;
  storagePath: string;
  checksumSha256: string;
  analysisStatus: string;
  safeUrl?: string | null;
  safeUrlExpiresAt?: string | null;
}

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

export interface SocialConnectionSafe {
  id: string;
  provider: 'meta';
  platform: 'facebook' | 'instagram';
  accountId: string;
  accountName: string;
  username?: string;
  status: 'connected' | 'expired' | 'error' | 'disconnected';
  tokenExpiresAt?: string | null;
  scopes: string[];
}
