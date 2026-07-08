/**
 * Steward schema API routes (Supabase-backed, additive to existing shim).
 */

import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import {
  createAiJob,
  createAssetMetadata,
  createAutomationRule,
  createPostDraft,
  createPostVariant,
  createPublishJob,
  getBrandProfile,
  ingestMetricsSnapshot,
  isSupabaseServiceConfigured,
  scheduleContentCalendarEntry,
  seedKineticGrapplingDemo,
  upsertBrandProfile,
} from '../services/steward-db.js';

function supabaseRequired(res: Response): boolean {
  if (!isSupabaseServiceConfigured()) {
    res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Supabase service role is not configured.' });
    return false;
  }
  return true;
}

function getBrandId(req: AuthenticatedRequest): string | undefined {
  return (req.headers['x-brand-id'] as string | undefined) ?? req.body?.brandId;
}

export async function getBrandProfileHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!supabaseRequired(res)) return;
  const brandId = req.params.brandId ?? getBrandId(req);
  if (!brandId) {
    res.status(400).json({ code: 'BRAND_ID_REQUIRED', message: 'brandId is required' });
    return;
  }
  try {
    const profile = await getBrandProfile(brandId);
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ code: 'BRAND_PROFILE_ERROR', message: String(err) });
  }
}

export async function patchBrandProfileHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!supabaseRequired(res)) return;
  const brandId = req.params.brandId;
  if (!brandId) {
    res.status(400).json({ code: 'BRAND_ID_REQUIRED', message: 'brandId is required' });
    return;
  }
  try {
    const profile = await upsertBrandProfile(brandId, req.body ?? {});
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ code: 'BRAND_PROFILE_UPDATE_ERROR', message: String(err) });
  }
}

export async function createAssetMetadataHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!supabaseRequired(res)) return;
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    return;
  }
  try {
    const asset = await createAssetMetadata({
      organizationId: req.body.organizationId,
      brandId: req.body.brandId ?? getBrandId(req),
      uploadedBy: userId,
      type: req.body.type,
      storageBucket: req.body.storageBucket,
      storagePath: req.body.storagePath,
      fileName: req.body.fileName,
      mimeType: req.body.mimeType,
      fileSize: req.body.fileSize,
      publicUrl: req.body.publicUrl,
      tags: req.body.tags,
      contentCategory: req.body.contentCategory,
      metadata: req.body.metadata,
    });
    res.status(201).json({ asset });
  } catch (err) {
    res.status(500).json({ code: 'ASSET_METADATA_ERROR', message: String(err) });
  }
}

export async function createPostDraftHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!supabaseRequired(res)) return;
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    return;
  }
  try {
    const post = await createPostDraft({
      organizationId: req.body.organizationId,
      brandId: req.body.brandId ?? getBrandId(req),
      authorId: userId,
      content: req.body.content,
      platform: req.body.platform,
      status: req.body.status,
      title: req.body.title,
      hook: req.body.hook,
      cta: req.body.cta,
      campaignId: req.body.campaignId,
      contentPillarId: req.body.contentPillarId,
      hashtags: req.body.hashtags,
      mediaAssetIds: req.body.mediaAssetIds,
      scheduledTime: req.body.scheduledTime ? new Date(req.body.scheduledTime) : undefined,
      metadata: req.body.metadata,
    });
    res.status(201).json({ post });
  } catch (err) {
    res.status(500).json({ code: 'POST_DRAFT_ERROR', message: String(err) });
  }
}

export async function createPostVariantHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!supabaseRequired(res)) return;
  try {
    const variant = await createPostVariant({
      postId: req.body.postId,
      organizationId: req.body.organizationId,
      brandId: req.body.brandId ?? getBrandId(req),
      platform: req.body.platform,
      caption: req.body.caption,
      hook: req.body.hook,
      hashtags: req.body.hashtags,
      title: req.body.title,
      description: req.body.description,
      firstComment: req.body.firstComment,
      mediaAssetIds: req.body.mediaAssetIds,
      metadata: req.body.metadata,
    });
    res.status(201).json({ variant });
  } catch (err) {
    res.status(500).json({ code: 'POST_VARIANT_ERROR', message: String(err) });
  }
}

export async function scheduleCalendarEntryHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!supabaseRequired(res)) return;
  try {
    const entry = await scheduleContentCalendarEntry({
      organizationId: req.body.organizationId,
      brandId: req.body.brandId ?? getBrandId(req)!,
      title: req.body.title,
      scheduledFor: new Date(req.body.scheduledFor),
      timezone: req.body.timezone,
      platform: req.body.platform,
      postId: req.body.postId,
      campaignId: req.body.campaignId,
      requiresApproval: req.body.requiresApproval,
    });
    res.status(201).json({ entry });
  } catch (err) {
    res.status(500).json({ code: 'CALENDAR_ENTRY_ERROR', message: String(err) });
  }
}

export async function createPublishJobHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!supabaseRequired(res)) return;
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    return;
  }
  try {
    const job = await createPublishJob({
      organizationId: req.body.organizationId,
      brandId: req.body.brandId ?? getBrandId(req),
      postId: req.body.postId,
      postVariantId: req.body.postVariantId,
      socialAccountId: req.body.socialAccountId,
      platform: req.body.platform,
      scheduledAt: new Date(req.body.scheduledAt),
      createdByUserId: userId,
      postContent: req.body.postContent ?? {},
      idempotencyKey: req.body.idempotencyKey,
      metadata: req.body.metadata,
    });
    res.status(201).json({ job });
  } catch (err) {
    if (String(err).includes('PUBLISH_JOB_DUPLICATE')) {
      res.status(409).json({ code: 'PUBLISH_JOB_DUPLICATE', message: 'Publish job with this idempotency key already exists.' });
      return;
    }
    res.status(500).json({ code: 'PUBLISH_JOB_ERROR', message: String(err) });
  }
}

export async function createAutomationRuleHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!supabaseRequired(res)) return;
  try {
    const rule = await createAutomationRule({
      organizationId: req.body.organizationId,
      brandId: req.body.brandId ?? getBrandId(req)!,
      name: req.body.name,
      triggerType: req.body.triggerType,
      triggerConfig: req.body.triggerConfig,
      actionType: req.body.actionType,
      actionConfig: req.body.actionConfig,
      createdBy: req.user?.id,
      enabled: req.body.enabled,
    });
    res.status(201).json({ rule });
  } catch (err) {
    res.status(500).json({ code: 'AUTOMATION_RULE_ERROR', message: String(err) });
  }
}

export async function createAiJobHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!supabaseRequired(res)) return;
  try {
    const job = await createAiJob({
      organizationId: req.body.organizationId,
      brandId: req.body.brandId ?? getBrandId(req),
      jobType: req.body.jobType,
      createdBy: req.user?.id,
      input: req.body.input,
      relatedPostId: req.body.relatedPostId,
      relatedAssetId: req.body.relatedAssetId,
      modelProvider: req.body.modelProvider,
    });
    res.status(201).json({ job });
  } catch (err) {
    res.status(500).json({ code: 'AI_JOB_ERROR', message: String(err) });
  }
}

export async function ingestMetricsHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!supabaseRequired(res)) return;
  try {
    const snapshot = await ingestMetricsSnapshot({
      organizationId: req.body.organizationId,
      publicationId: req.body.publicationId,
      metrics: req.body.metrics ?? {},
    });
    res.status(201).json({ snapshot });
  } catch (err) {
    res.status(500).json({ code: 'METRICS_INGEST_ERROR', message: String(err) });
  }
}

export async function seedDemoBrandHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!supabaseRequired(res)) return;
  try {
    await seedKineticGrapplingDemo(req.body.organizationId, req.body.brandId, req.user?.id);
    res.json({ ok: true, message: 'Kinetic Grappling brand intelligence demo data seeded.' });
  } catch (err) {
    res.status(500).json({ code: 'SEED_DEMO_ERROR', message: String(err) });
  }
}
