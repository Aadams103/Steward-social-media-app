/**
 * Steward Supabase service layer.
 * Uses service role when configured; returns null/empty when Supabase is unavailable
 * so existing Express shim flows continue to work.
 */

import { randomUUID } from 'node:crypto';
import { getSupabaseClient } from '../supabase.js';
import type {
  AiJobRow,
  AssetRow,
  AutomationRuleRow,
  BrandProfileRow,
  ContentCalendarEntryRow,
  PostDraftRow,
  PostMetricsSnapshotRow,
  PostVariantRow,
  PublishJobRow,
  StewardAiJobType,
  StewardPlatform,
  StewardPostStatus,
} from '../types/steward-schema.js';

function requireClient() {
  const client = getSupabaseClient();
  if (!client) throw new Error('SUPABASE_NOT_CONFIGURED');
  return client;
}

async function resolveOrgId(brandId: string): Promise<string> {
  const client = requireClient();
  const { data, error } = await client.from('brands').select('organization_id').eq('id', brandId).single();
  if (error || !data?.organization_id) throw new Error('BRAND_NOT_FOUND');
  return data.organization_id as string;
}

export async function getBrandProfile(brandId: string): Promise<BrandProfileRow | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('brands').select('*').eq('id', brandId).maybeSingle();
  if (error) throw error;
  return (data as BrandProfileRow | null) ?? null;
}

export async function upsertBrandProfile(
  brandId: string,
  patch: Partial<BrandProfileRow>
): Promise<BrandProfileRow> {
  const client = requireClient();
  const { data, error } = await client.from('brands').update(patch).eq('id', brandId).select('*').single();
  if (error) throw error;
  return data as BrandProfileRow;
}

export async function createAssetMetadata(input: {
  organizationId: string;
  brandId?: string;
  uploadedBy: string;
  type: string;
  storageBucket: string;
  storagePath: string;
  fileName: string;
  mimeType?: string;
  fileSize?: number;
  publicUrl?: string;
  tags?: string[];
  contentCategory?: string;
  metadata?: Record<string, unknown>;
}): Promise<AssetRow> {
  const client = requireClient();
  const { data, error } = await client
    .from('assets')
    .insert({
      organization_id: input.organizationId,
      brand_id: input.brandId ?? null,
      uploaded_by: input.uploadedBy,
      type: input.type,
      storage_bucket: input.storageBucket,
      storage_path: input.storagePath,
      file_name: input.fileName,
      mime_type: input.mimeType ?? null,
      file_size: input.fileSize ?? null,
      public_url: input.publicUrl ?? null,
      url: input.publicUrl ?? null,
      tags: input.tags ?? [],
      content_category: input.contentCategory ?? null,
      metadata: input.metadata ?? {},
      approval_status: 'pending',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as AssetRow;
}

export async function createPostDraft(input: {
  organizationId?: string;
  brandId?: string;
  authorId: string;
  content: string;
  platform: StewardPlatform | string;
  status?: StewardPostStatus | string;
  title?: string;
  hook?: string;
  cta?: string;
  campaignId?: string;
  contentPillarId?: string;
  hashtags?: string[];
  mediaAssetIds?: string[];
  scheduledTime?: Date;
  metadata?: Record<string, unknown>;
}): Promise<PostDraftRow> {
  const client = requireClient();
  const organizationId = input.organizationId ?? (input.brandId ? await resolveOrgId(input.brandId) : null);
  const { data, error } = await client
    .from('posts')
    .insert({
      organization_id: organizationId,
      brand_id: input.brandId ?? null,
      author_id: input.authorId,
      content: input.content,
      main_caption: input.content,
      platform: input.platform,
      status: input.status ?? 'draft',
      title: input.title ?? null,
      hook: input.hook ?? null,
      cta: input.cta ?? null,
      campaign_id: input.campaignId ?? null,
      content_pillar_id: input.contentPillarId ?? null,
      hashtags: input.hashtags ?? [],
      media_asset_ids: input.mediaAssetIds ?? [],
      scheduled_time: input.scheduledTime?.toISOString() ?? null,
      metadata: input.metadata ?? {},
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as PostDraftRow;
}

export async function createPostVariant(input: {
  postId: string;
  organizationId: string;
  brandId?: string;
  platform: StewardPlatform;
  caption?: string;
  hook?: string;
  hashtags?: string[];
  title?: string;
  description?: string;
  firstComment?: string;
  mediaAssetIds?: string[];
  metadata?: Record<string, unknown>;
}): Promise<PostVariantRow> {
  const client = requireClient();
  const caption = input.caption ?? '';
  const { data, error } = await client
    .from('post_variants')
    .upsert(
      {
        post_id: input.postId,
        organization_id: input.organizationId,
        brand_id: input.brandId ?? null,
        platform: input.platform,
        caption,
        hook: input.hook ?? null,
        hashtags: input.hashtags ?? [],
        title: input.title ?? null,
        description: input.description ?? null,
        first_comment: input.firstComment ?? null,
        media_asset_ids: input.mediaAssetIds ?? [],
        character_count: caption.length,
        metadata: input.metadata ?? {},
      },
      { onConflict: 'post_id,platform' }
    )
    .select('*')
    .single();
  if (error) throw error;
  return data as PostVariantRow;
}

export async function scheduleContentCalendarEntry(input: {
  organizationId: string;
  brandId: string;
  title: string;
  scheduledFor: Date;
  timezone?: string;
  platform?: StewardPlatform;
  postId?: string;
  campaignId?: string;
  requiresApproval?: boolean;
}): Promise<ContentCalendarEntryRow> {
  const client = requireClient();
  const { data, error } = await client
    .from('content_calendar_entries')
    .insert({
      organization_id: input.organizationId,
      brand_id: input.brandId,
      post_id: input.postId ?? null,
      campaign_id: input.campaignId ?? null,
      title: input.title,
      scheduled_for: input.scheduledFor.toISOString(),
      timezone: input.timezone ?? 'America/New_York',
      platform: input.platform ?? null,
      requires_approval: input.requiresApproval ?? true,
      status: 'planned',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as ContentCalendarEntryRow;
}

export async function createPublishJob(input: {
  organizationId: string;
  brandId?: string;
  postId?: string;
  postVariantId?: string;
  socialAccountId: string;
  platform: StewardPlatform | string;
  scheduledAt: Date;
  createdByUserId: string;
  postContent: Record<string, unknown>;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}): Promise<PublishJobRow> {
  const client = requireClient();
  const idempotencyKey = input.idempotencyKey ?? randomUUID();
  const { data, error } = await client
    .from('publish_jobs')
    .insert({
      organization_id: input.organizationId,
      brand_id: input.brandId ?? null,
      post_id: input.postId ?? null,
      post_variant_id: input.postVariantId ?? null,
      social_account_id: input.socialAccountId,
      connection_id: input.socialAccountId,
      platform: input.platform,
      scheduled_at: input.scheduledAt.toISOString(),
      scheduled_for: input.scheduledAt.toISOString(),
      status: 'queued',
      post_content: input.postContent,
      created_by_user_id: input.createdByUserId,
      idempotency_key: idempotencyKey,
      metadata: input.metadata ?? {},
    })
    .select('*')
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('PUBLISH_JOB_DUPLICATE');
    throw error;
  }
  return data as PublishJobRow;
}

export async function createAutomationRule(input: {
  organizationId: string;
  brandId: string;
  name: string;
  triggerType: string;
  triggerConfig?: Record<string, unknown>;
  actionType: string;
  actionConfig?: Record<string, unknown>;
  createdBy?: string;
  enabled?: boolean;
}): Promise<AutomationRuleRow> {
  const client = requireClient();
  const { data, error } = await client
    .from('automation_rules')
    .insert({
      organization_id: input.organizationId,
      brand_id: input.brandId,
      name: input.name,
      trigger_type: input.triggerType,
      trigger_config: input.triggerConfig ?? {},
      action_type: input.actionType,
      action_config: input.actionConfig ?? {},
      created_by: input.createdBy ?? null,
      enabled: input.enabled ?? true,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as AutomationRuleRow;
}

export async function createAiJob(input: {
  organizationId: string;
  brandId?: string;
  jobType: StewardAiJobType;
  createdBy?: string;
  input?: Record<string, unknown>;
  relatedPostId?: string;
  relatedAssetId?: string;
  modelProvider?: string;
}): Promise<AiJobRow> {
  const client = requireClient();
  const { data, error } = await client
    .from('ai_jobs')
    .insert({
      organization_id: input.organizationId,
      brand_id: input.brandId ?? null,
      job_type: input.jobType,
      created_by: input.createdBy ?? null,
      input: input.input ?? {},
      model_provider: input.modelProvider ?? null,
      status: 'queued',
      related_post_id: input.relatedPostId ?? null,
      related_asset_id: input.relatedAssetId ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as AiJobRow;
}

export async function ingestMetricsSnapshot(input: {
  organizationId: string;
  publicationId: string;
  metrics: Partial<PostMetricsSnapshotRow>;
}): Promise<PostMetricsSnapshotRow> {
  const client = requireClient();
  const { data, error } = await client
    .from('post_metrics_snapshots')
    .insert({
      organization_id: input.organizationId,
      publication_id: input.publicationId,
      impressions: input.metrics.impressions ?? 0,
      reach: input.metrics.reach ?? 0,
      likes: input.metrics.likes ?? 0,
      comments: input.metrics.comments ?? 0,
      shares: input.metrics.shares ?? 0,
      saves: input.metrics.saves ?? 0,
      clicks: input.metrics.clicks ?? 0,
      video_views: input.metrics.video_views ?? 0,
      engagement_rate: input.metrics.engagement_rate ?? null,
      metadata: input.metrics.metadata ?? {},
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as PostMetricsSnapshotRow;
}

export async function seedKineticGrapplingDemo(
  organizationId: string,
  brandId: string,
  userId?: string | null
): Promise<void> {
  const client = requireClient();
  const { error } = await client.rpc('seed_kinetic_grappling_brand_intelligence', {
    p_organization_id: organizationId,
    p_brand_id: brandId,
    p_user_id: userId ?? null,
  });
  if (error) throw error;
}

export function isSupabaseServiceConfigured(): boolean {
  return getSupabaseClient() !== null;
}
