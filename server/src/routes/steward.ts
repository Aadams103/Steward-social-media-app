/**
 * Steward schema API routes (Supabase-backed, additive to existing shim).
 */

import type { Response } from 'express';
import { z } from 'zod';
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
import { verifyOrgMembership } from '../services/ai-jobs-db.js';
import { getSupabaseClient } from '../supabase.js';

function supabaseRequired(res: Response): boolean {
  if (!isSupabaseServiceConfigured()) {
    res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Supabase service role is not configured.' });
    return false;
  }
  return true;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getBrandId(req: AuthenticatedRequest): string | undefined {
  const raw = (req.headers['x-brand-id'] as string | undefined) ?? req.body?.brandId;
  // The frontend sends "all" when no specific brand is selected — never treat
  // that (or any non-UUID) as a real brand id.
  return raw && UUID_RE.test(raw) ? raw : undefined;
}

/**
 * Security guard: these routes run with the service-role client, which
 * bypasses RLS. Every handler must verify the caller is a member of the
 * target organization and (when applicable) that the brand belongs to it.
 * Sends the error response and returns false on failure.
 */
async function requireOrgAccess(
  req: AuthenticatedRequest,
  res: Response,
  organizationId: string | undefined,
  brandId?: string
): Promise<boolean> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return false;
  }
  if (!organizationId) {
    res.status(400).json({ code: 'ORG_REQUIRED', message: 'organizationId is required' });
    return false;
  }
  try {
    await verifyOrgMembership(userId, organizationId);
  } catch {
    res.status(403).json({ code: 'FORBIDDEN', message: 'You are not a member of this organization.' });
    return false;
  }
  if (brandId && UUID_RE.test(brandId)) {
    const client = getSupabaseClient();
    if (client) {
      const { data } = await client
        .from('brands')
        .select('id')
        .eq('id', brandId)
        .eq('organization_id', organizationId)
        .maybeSingle();
      if (!data) {
        res.status(403).json({ code: 'FORBIDDEN', message: 'Brand does not belong to this organization.' });
        return false;
      }
    }
  }
  return true;
}

/** Resolve a brand's organization and verify caller membership (for brand-scoped routes). */
async function requireBrandAccess(
  req: AuthenticatedRequest,
  res: Response,
  brandId: string
): Promise<boolean> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return false;
  }
  const client = getSupabaseClient();
  if (!client) {
    res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Supabase not configured' });
    return false;
  }
  const { data: brand } = await client
    .from('brands')
    .select('organization_id')
    .eq('id', brandId)
    .maybeSingle();
  if (!brand) {
    res.status(404).json({ code: 'BRAND_NOT_FOUND', message: 'Brand not found' });
    return false;
  }
  try {
    await verifyOrgMembership(userId, brand.organization_id as string);
    return true;
  } catch {
    res.status(403).json({ code: 'FORBIDDEN', message: 'You are not a member of this organization.' });
    return false;
  }
}

export async function getBrandProfileHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!supabaseRequired(res)) return;
  const brandId = req.params.brandId ?? getBrandId(req);
  if (!brandId) {
    res.status(400).json({ code: 'BRAND_ID_REQUIRED', message: 'brandId is required' });
    return;
  }
  if (!(await requireBrandAccess(req, res, brandId))) return;
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
  if (!(await requireBrandAccess(req, res, brandId))) return;
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
  if (!(await requireOrgAccess(req, res, req.body.organizationId, req.body.brandId ?? getBrandId(req)))) return;
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
    const body = z.object({
      organizationId: z.string().uuid(),
      brandId: z.string().uuid(),
      content: z.string().trim().min(1).max(20_000),
      platform: z.enum(['facebook', 'instagram']),
      title: z.string().trim().max(300).optional(),
      hook: z.string().trim().max(1000).optional(),
      cta: z.string().trim().max(1000).optional(),
      campaignId: z.string().uuid().optional(),
      contentPillarId: z.string().uuid().optional(),
      hashtags: z.array(z.string().trim().max(100)).max(40).optional(),
      mediaAssetIds: z.array(z.string().uuid()).max(10).optional(),
      scheduledTime: z.string().datetime().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }).parse(req.body);
    if (!(await requireOrgAccess(req, res, body.organizationId, body.brandId))) return;
    const post = await createPostDraft({
      organizationId: body.organizationId,
      brandId: body.brandId,
      authorId: userId,
      content: body.content,
      platform: body.platform,
      title: body.title,
      hook: body.hook,
      cta: body.cta,
      campaignId: body.campaignId,
      contentPillarId: body.contentPillarId,
      hashtags: body.hashtags,
      mediaAssetIds: body.mediaAssetIds,
      scheduledTime: body.scheduledTime ? new Date(body.scheduledTime) : undefined,
      metadata: { ...(body.metadata ?? {}), requiresApproval: true },
    });
    res.status(201).json({ post });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Check the draft details and try again.', details: err.flatten() });
      return;
    }
    res.status(500).json({ code: 'POST_DRAFT_ERROR', message: String(err) });
  }
}

export async function createPostVariantHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!supabaseRequired(res)) return;
  if (!(await requireOrgAccess(req, res, req.body.organizationId, req.body.brandId ?? getBrandId(req)))) return;
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
  if (!(await requireOrgAccess(req, res, req.body.organizationId, req.body.brandId ?? getBrandId(req)))) return;
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
  if (!(await requireOrgAccess(req, res, req.body.organizationId, req.body.brandId ?? getBrandId(req)))) return;
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
  if (!(await requireOrgAccess(req, res, req.body.organizationId, req.body.brandId ?? getBrandId(req)))) return;
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
  if (!(await requireOrgAccess(req, res, req.body.organizationId, req.body.brandId ?? getBrandId(req)))) return;
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
  if (!(await requireOrgAccess(req, res, req.body.organizationId))) return;
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
  if (!(await requireOrgAccess(req, res, req.body.organizationId, req.body.brandId))) return;
  try {
    await seedKineticGrapplingDemo(req.body.organizationId, req.body.brandId, req.user?.id);
    res.json({ ok: true, message: 'Kinetic Grappling brand intelligence demo data seeded.' });
  } catch (err) {
    res.status(500).json({ code: 'SEED_DEMO_ERROR', message: String(err) });
  }
}
