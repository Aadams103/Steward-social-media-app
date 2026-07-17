/**
 * Supabase-backed post approval mutations.
 */

import type { Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { getSupabaseClient } from '../supabase.js';
import { assertPermission } from '../services/permissions.js';
import { assertWorkspaceAccess, logAuditEvent } from '../services/workspace.js';
import { isSupabaseServiceConfigured } from '../services/steward-db.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const reasonSchema = z.object({
  organizationId: z.string().uuid(),
  reason: z.string().min(1).max(2000).optional(),
  comment: z.string().min(1).max(2000).optional(),
});

const editDraftSchema = z.object({
  organizationId: z.string().uuid(),
  content: z.string().trim().min(1).max(20_000),
  platform: z.enum(['facebook', 'instagram']),
  title: z.string().trim().max(300).optional(),
  mediaAssetIds: z.array(z.string().uuid()).max(10).default([]),
  aiJobId: z.string().uuid().optional(),
});

async function getSupabasePost(postId: string, organizationId: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error('SUPABASE_NOT_CONFIGURED');
  const { data, error } = await client
    .from('posts')
    .select('*')
    .eq('id', postId)
    .eq('organization_id', organizationId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function mapPostSummary(row: Record<string, unknown>) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    brandId: row.brand_id,
    platform: row.platform,
    status: row.status,
    approvalState: row.approval_state,
    content: row.content,
    title: row.title,
    scheduledTime: row.scheduled_time,
    updatedAt: row.updated_at,
  };
}

async function upsertContentApproval(input: {
  organizationId: string;
  brandId: string | null;
  postId: string;
  status: string;
  userId: string;
  revisionNotes?: string;
}) {
  const client = getSupabaseClient();
  if (!client) return;

  const { data: existing } = await client
    .from('content_approvals')
    .select('id')
    .eq('post_id', input.postId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const patch = {
    organization_id: input.organizationId,
    brand_id: input.brandId,
    post_id: input.postId,
    status: input.status,
    approved_by: input.status === 'approved' ? input.userId : null,
    approved_at: input.status === 'approved' ? new Date().toISOString() : null,
    revision_notes: input.revisionNotes ?? null,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    await client.from('content_approvals').update(patch).eq('id', existing.id);
  } else {
    await client.from('content_approvals').insert({
      ...patch,
      requested_by: input.userId,
    });
  }
}

async function createPublishJobsForPost(input: {
  post: Record<string, unknown>;
  organizationId: string;
  userId: string;
  scheduledAt: string;
  socialAccountIds?: string[];
}): Promise<Record<string, unknown>[]> {
  const client = getSupabaseClient()!;
  const brandId = input.post.brand_id as string | null;
  if (!brandId) throw new Error('BRAND_REQUIRED');
  let accountsQuery = client
    .from('social_accounts')
    .select('id, platform')
    .eq('organization_id', input.organizationId)
    .eq('brand_id', brandId)
    .eq('platform', input.post.platform as string)
    .eq('connection_status', 'connected')
    .is('archived_at', null);
  if (input.socialAccountIds?.length) accountsQuery = accountsQuery.in('id', input.socialAccountIds);
  const { data: accounts, error: accountsError } = await accountsQuery;
  if (accountsError) throw accountsError;
  if (!accounts?.length) return [];

  const jobs: Record<string, unknown>[] = [];
  for (const account of accounts) {
    const idempotencyKey = `${input.post.id}:${account.id}:${input.scheduledAt}`;
    const payload = {
      organization_id: input.organizationId,
      brand_id: brandId,
      post_id: input.post.id,
      social_account_id: account.id,
      connection_id: account.id,
      platform: account.platform,
      status: 'queued',
      scheduled_at: input.scheduledAt,
      scheduled_for: input.scheduledAt,
      created_by_user_id: input.userId,
      idempotency_key: idempotencyKey,
      post_content: {
        postId: input.post.id,
        text: input.post.main_caption ?? input.post.content,
        hashtags: input.post.hashtags ?? [],
        mediaAssetIds: input.post.media_asset_ids ?? [],
        format: (input.post.metadata as Record<string, unknown> | null)?.format ?? undefined,
      },
      metadata: { approvalFirst: true },
    };
    const { data: job, error } = await client.from('publish_jobs').insert(payload).select('*').single();
    if (error?.code === '23505') {
      const { data: existing, error: existingError } = await client
        .from('publish_jobs')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .single();
      if (existingError) throw existingError;
      jobs.push(existing as Record<string, unknown>);
    } else if (error) {
      throw error;
    } else if (job) {
      jobs.push(job as Record<string, unknown>);
    }
  }
  return jobs;
}

function approvalGuard(res: Response): boolean {
  if (!isSupabaseServiceConfigured()) {
    res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Supabase not configured' });
    return false;
  }
  return true;
}

export async function approvePostHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!approvalGuard(res)) return;
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return;
  }

  try {
    const body = reasonSchema.parse(req.body);
    const role = await assertWorkspaceAccess(userId, body.organizationId);
    assertPermission(role, 'canApprovePosts');

    const post = await getSupabasePost(req.params.id, body.organizationId);
    if (!post) {
      res.status(404).json({ code: 'POST_NOT_FOUND', message: 'Post not found' });
      return;
    }

    const reviewStatuses = ['draft', 'pending', 'pending_approval', 'needs_review', 'in_review'];
    if (!reviewStatuses.includes(String(post.status)) && String(post.approval_state) !== 'pending') {
      res.status(400).json({ code: 'INVALID_STATUS', message: `Post cannot be approved from status: ${post.status}` });
      return;
    }

    const client = getSupabaseClient()!;
    const { data: updated, error } = await client
      .from('posts')
      .update({
        status: 'approved',
        approval_state: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', post.id)
      .select('*')
      .single();

    if (error) throw error;

    await upsertContentApproval({
      organizationId: body.organizationId,
      brandId: post.brand_id as string | null,
      postId: post.id as string,
      status: 'approved',
      userId,
    });

    await logAuditEvent({
      organizationId: body.organizationId,
      brandId: post.brand_id as string | undefined,
      actorUserId: userId,
      action: 'post.approve',
      entityType: 'post',
      entityId: post.id as string,
      beforeState: { status: post.status, approval_state: post.approval_state },
      afterState: { status: 'approved', approval_state: 'approved' },
    });

    let finalPost = updated as Record<string, unknown>;
    let jobs: Record<string, unknown>[] = [];
    if (post.scheduled_time) {
      jobs = await createPublishJobsForPost({
        post: updated as Record<string, unknown>,
        organizationId: body.organizationId,
        userId,
        scheduledAt: String(post.scheduled_time),
      });
      if (jobs.length > 0) {
        const { data: scheduledPost, error: scheduledError } = await client
          .from('posts')
          .update({ status: 'scheduled', updated_at: new Date().toISOString() })
          .eq('id', post.id)
          .select('*')
          .single();
        if (scheduledError) throw scheduledError;
        finalPost = scheduledPost as Record<string, unknown>;
      }
    }

    res.json({
      post: mapPostSummary(finalPost),
      publishJobs: jobs,
      warning: post.scheduled_time && jobs.length === 0 ? 'Connect a matching social account before this post can publish.' : undefined,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ code: 'VALIDATION_ERROR', message: err.message });
      return;
    }
    if (err instanceof Error && (err as Error & { code?: string }).code === 'FORBIDDEN') {
      res.status(403).json({ code: 'FORBIDDEN', message: err.message });
      return;
    }
    res.status(500).json({ code: 'APPROVE_ERROR', message: String(err) });
  }
}

export async function scheduleApprovedPostHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!approvalGuard(res)) return;
  const userId = req.user?.id;
  if (!userId) return void res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
  try {
    const body = z.object({
      organizationId: z.string().uuid(),
      scheduledTime: z.string().datetime(),
      timezone: z.string().min(1).max(100).optional(),
      socialAccountIds: z.array(z.string().uuid()).max(20).optional(),
    }).parse(req.body);
    if (new Date(body.scheduledTime).getTime() <= Date.now()) {
      return void res.status(400).json({ code: 'SCHEDULE_IN_PAST', message: 'Choose a future publishing time.' });
    }
    const role = await assertWorkspaceAccess(userId, body.organizationId);
    assertPermission(role, 'canEditPosts');
    const post = await getSupabasePost(req.params.id, body.organizationId);
    if (!post) return void res.status(404).json({ code: 'POST_NOT_FOUND', message: 'Post not found' });
    if (post.status !== 'approved' || post.approval_state !== 'approved') {
      return void res.status(409).json({ code: 'APPROVAL_REQUIRED', message: 'Approve this post before scheduling it.' });
    }
    const jobs = await createPublishJobsForPost({
      post: post as Record<string, unknown>,
      organizationId: body.organizationId,
      userId,
      scheduledAt: body.scheduledTime,
      socialAccountIds: body.socialAccountIds,
    });
    if (jobs.length === 0) {
      return void res.status(409).json({ code: 'SOCIAL_ACCOUNT_REQUIRED', message: 'Connect a matching social account before scheduling.' });
    }
    const client = getSupabaseClient()!;
    const { data: updated, error } = await client.from('posts').update({
      status: 'scheduled',
      scheduled_time: body.scheduledTime,
      updated_at: new Date().toISOString(),
    }).eq('id', post.id).select('*').single();
    if (error) throw error;
    await client.from('content_calendar_entries').insert({
      organization_id: body.organizationId,
      brand_id: post.brand_id,
      post_id: post.id,
      title: post.title ?? `Scheduled ${post.platform} post`,
      scheduled_for: body.scheduledTime,
      timezone: body.timezone ?? 'UTC',
      platform: post.platform,
      status: 'scheduled',
      requires_approval: true,
      metadata: { approvalFirst: true, publishJobIds: jobs.map((job) => job.id) },
    });
    await logAuditEvent({
      organizationId: body.organizationId,
      brandId: post.brand_id as string,
      actorUserId: userId,
      action: 'post.schedule',
      entityType: 'post',
      entityId: post.id as string,
      metadata: { scheduledTime: body.scheduledTime, publishJobIds: jobs.map((job) => job.id) },
    });
    res.json({ post: mapPostSummary(updated as Record<string, unknown>), publishJobs: jobs });
  } catch (err) {
    if (err instanceof z.ZodError) return void res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Check the schedule and try again.', details: err.flatten() });
    if (err instanceof Error && (err as Error & { code?: string }).code === 'FORBIDDEN') return void res.status(403).json({ code: 'FORBIDDEN', message: err.message });
    console.error('Post schedule failed', err instanceof Error ? err.message : 'unknown error');
    res.status(500).json({ code: 'SCHEDULE_ERROR', message: 'The post could not be scheduled.' });
  }
}

export async function requestChangesPostHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!approvalGuard(res)) return;
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return;
  }

  try {
    const body = reasonSchema.extend({ comment: z.string().min(1).max(2000) }).parse(req.body);
    const role = await assertWorkspaceAccess(userId, body.organizationId);
    assertPermission(role, 'canRequestChanges');

    const post = await getSupabasePost(req.params.id, body.organizationId);
    if (!post) {
      res.status(404).json({ code: 'POST_NOT_FOUND', message: 'Post not found' });
      return;
    }

    const client = getSupabaseClient()!;
    const { data: updated, error } = await client
      .from('posts')
      .update({
        status: 'revision_requested',
        approval_state: 'revision_requested',
        updated_at: new Date().toISOString(),
        metadata: { ...(post.metadata as object), change_request_comment: body.comment },
      })
      .eq('id', post.id)
      .select('*')
      .single();

    if (error) throw error;

    await upsertContentApproval({
      organizationId: body.organizationId,
      brandId: post.brand_id as string | null,
      postId: post.id as string,
      status: 'revision_requested',
      userId,
      revisionNotes: body.comment,
    });

    await logAuditEvent({
      organizationId: body.organizationId,
      brandId: post.brand_id as string | undefined,
      actorUserId: userId,
      action: 'post.request_changes',
      entityType: 'post',
      entityId: post.id as string,
      metadata: { comment: body.comment },
    });

    res.json({ post: mapPostSummary(updated as Record<string, unknown>) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ code: 'VALIDATION_ERROR', message: err.message });
      return;
    }
    if (err instanceof Error && (err as Error & { code?: string }).code === 'FORBIDDEN') {
      res.status(403).json({ code: 'FORBIDDEN', message: err.message });
      return;
    }
    res.status(500).json({ code: 'REQUEST_CHANGES_ERROR', message: String(err) });
  }
}

export async function rejectPostHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!approvalGuard(res)) return;
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return;
  }

  try {
    const body = reasonSchema.extend({ reason: z.string().min(1).max(2000) }).parse(req.body);
    const role = await assertWorkspaceAccess(userId, body.organizationId);
    assertPermission(role, 'canRejectPosts');

    const post = await getSupabasePost(req.params.id, body.organizationId);
    if (!post) {
      res.status(404).json({ code: 'POST_NOT_FOUND', message: 'Post not found' });
      return;
    }

    const client = getSupabaseClient()!;
    const { data: updated, error } = await client
      .from('posts')
      .update({
        status: 'rejected',
        approval_state: 'rejected',
        updated_at: new Date().toISOString(),
        metadata: { ...(post.metadata as object), rejection_reason: body.reason },
      })
      .eq('id', post.id)
      .select('*')
      .single();

    if (error) throw error;

    await upsertContentApproval({
      organizationId: body.organizationId,
      brandId: post.brand_id as string | null,
      postId: post.id as string,
      status: 'rejected',
      userId,
      revisionNotes: body.reason,
    });

    await logAuditEvent({
      organizationId: body.organizationId,
      brandId: post.brand_id as string | undefined,
      actorUserId: userId,
      action: 'post.reject',
      entityType: 'post',
      entityId: post.id as string,
      metadata: { reason: body.reason },
    });

    res.json({ post: mapPostSummary(updated as Record<string, unknown>) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ code: 'VALIDATION_ERROR', message: err.message });
      return;
    }
    if (err instanceof Error && (err as Error & { code?: string }).code === 'FORBIDDEN') {
      res.status(403).json({ code: 'FORBIDDEN', message: err.message });
      return;
    }
    res.status(500).json({ code: 'REJECT_ERROR', message: String(err) });
  }
}

export async function sendToReviewPostHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!approvalGuard(res)) return;
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return;
  }

  try {
    const body = reasonSchema.parse(req.body);
    const role = await assertWorkspaceAccess(userId, body.organizationId);
    assertPermission(role, 'canSendToReview');

    const post = await getSupabasePost(req.params.id, body.organizationId);
    if (!post) {
      res.status(404).json({ code: 'POST_NOT_FOUND', message: 'Post not found' });
      return;
    }

    if (String(post.status) !== 'draft' && String(post.approval_state) !== 'pending') {
      res.status(400).json({ code: 'INVALID_STATUS', message: 'Only drafts can be sent to review' });
      return;
    }

    const client = getSupabaseClient()!;
    const { data: updated, error } = await client
      .from('posts')
      .update({
        status: 'in_review',
        approval_state: 'in_review',
        updated_at: new Date().toISOString(),
      })
      .eq('id', post.id)
      .select('*')
      .single();

    if (error) throw error;

    await upsertContentApproval({
      organizationId: body.organizationId,
      brandId: post.brand_id as string | null,
      postId: post.id as string,
      status: 'in_review',
      userId,
    });

    await logAuditEvent({
      organizationId: body.organizationId,
      brandId: post.brand_id as string | undefined,
      actorUserId: userId,
      action: 'post.send_to_review',
      entityType: 'post',
      entityId: post.id as string,
    });

    res.json({ post: mapPostSummary(updated as Record<string, unknown>) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ code: 'VALIDATION_ERROR', message: err.message });
      return;
    }
    if (err instanceof Error && (err as Error & { code?: string }).code === 'FORBIDDEN') {
      res.status(403).json({ code: 'FORBIDDEN', message: err.message });
      return;
    }
    res.status(500).json({ code: 'SEND_TO_REVIEW_ERROR', message: String(err) });
  }
}

export async function updatePostDraftHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!approvalGuard(res)) return;
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return;
  }

  try {
    const body = editDraftSchema.parse(req.body);
    const role = await assertWorkspaceAccess(userId, body.organizationId);
    assertPermission(role, 'canEditPosts');
    const post = await getSupabasePost(req.params.id, body.organizationId);
    if (!post) {
      res.status(404).json({ code: 'POST_NOT_FOUND', message: 'Post not found' });
      return;
    }
    if (!['draft', 'revision_requested', 'rejected'].includes(String(post.status))) {
      res.status(409).json({
        code: 'POST_LOCKED',
        message: 'Only drafts or posts returned for revision can be edited.',
      });
      return;
    }

    const client = getSupabaseClient()!;
    const before = {
      content: post.content,
      platform: post.platform,
      title: post.title,
      media_asset_ids: post.media_asset_ids,
      status: post.status,
    };
    const { data: updated, error } = await client
      .from('posts')
      .update({
        content: body.content,
        main_caption: body.content,
        platform: body.platform,
        title: body.title ?? post.title,
        media_asset_ids: body.mediaAssetIds,
        status: 'draft',
        approval_state: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', post.id)
      .eq('organization_id', body.organizationId)
      .select('*')
      .single();
    if (error) throw error;

    await client.from('post_revisions').insert({
      organization_id: body.organizationId,
      brand_id: post.brand_id,
      post_id: post.id,
      edited_by: userId,
      before_state: before,
      after_state: {
        content: body.content,
        platform: body.platform,
        title: body.title ?? post.title,
        media_asset_ids: body.mediaAssetIds,
        status: 'draft',
      },
      ai_job_id: body.aiJobId ?? null,
    });

    await logAuditEvent({
      organizationId: body.organizationId,
      brandId: post.brand_id as string | undefined,
      actorUserId: userId,
      action: 'post.edit',
      entityType: 'post',
      entityId: post.id as string,
      beforeState: before,
      afterState: { content: body.content, platform: body.platform, status: 'draft' },
    });
    res.json({ post: mapPostSummary(updated as Record<string, unknown>) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ code: 'VALIDATION_ERROR', message: err.message });
      return;
    }
    if (err instanceof Error && (err as Error & { code?: string }).code === 'FORBIDDEN') {
      res.status(403).json({ code: 'FORBIDDEN', message: err.message });
      return;
    }
    res.status(500).json({ code: 'POST_EDIT_ERROR', message: 'The draft could not be saved.' });
  }
}

/** List posts from Supabase when organizationId is a UUID. */
export async function listSupabasePostsHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!approvalGuard(res)) return;
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return;
  }

  const organizationId = req.query.organizationId as string;
  const brandId = req.query.brandId as string | undefined;
  const status = req.query.status as string | undefined;

  if (!organizationId || !UUID_RE.test(organizationId)) {
    res.status(400).json({ code: 'ORG_REQUIRED', message: 'Valid organizationId is required' });
    return;
  }

  try {
    await assertWorkspaceAccess(userId, organizationId, brandId);
    const client = getSupabaseClient()!;

    let q = client.from('posts').select('*', { count: 'exact' }).eq('organization_id', organizationId);
    if (brandId && UUID_RE.test(brandId)) q = q.eq('brand_id', brandId);
    if (status) q = q.eq('status', status);

    const { data, error, count } = await q.order('updated_at', { ascending: false }).limit(100);
    if (error) throw error;

    const posts = (data ?? []).map((row) => ({
      id: row.id,
      organizationId: row.organization_id,
      brandId: row.brand_id,
      authorId: row.author_id,
      platform: row.platform,
      content: row.content,
      title: row.title,
      status: row.status,
      approvalState: row.approval_state,
      hashtags: row.hashtags ?? [],
      scheduledTime: row.scheduled_time,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json({ posts, total: count ?? posts.length, source: 'supabase' });
  } catch (err) {
    if (err instanceof Error && (err as Error & { code?: string }).code === 'ORG_ACCESS_DENIED') {
      res.status(403).json({ code: 'FORBIDDEN', message: err.message });
      return;
    }
    res.status(500).json({ code: 'POSTS_LIST_ERROR', message: String(err) });
  }
}

export async function getSupabasePostHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!approvalGuard(res)) return;
  const userId = req.user?.id;
  if (!userId) return void res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
  const client = getSupabaseClient()!;
  try {
    const postId = z.string().uuid().parse(req.params.id);
    const { data: post, error } = await client.from('posts').select('*').eq('id', postId).maybeSingle();
    if (error) throw error;
    if (!post) return void res.status(404).json({ code: 'POST_NOT_FOUND', message: 'Post not found' });
    await assertWorkspaceAccess(userId, post.organization_id as string, post.brand_id as string | undefined);
    res.json(mapPostSummary(post as Record<string, unknown>));
  } catch (error) {
    if (error instanceof z.ZodError) return void res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Invalid post ID' });
    if (
      error instanceof Error &&
      ((error as Error & { code?: string }).code === 'FORBIDDEN' ||
        (error as Error & { code?: string }).code === 'BRAND_ACCESS_DENIED' ||
        error.message === 'ORG_ACCESS_DENIED')
    ) {
      return void res.status(403).json({ code: 'FORBIDDEN', message: 'You cannot access this post.' });
    }
    res.status(500).json({ code: 'POST_READ_ERROR', message: 'The post could not be loaded.' });
  }
}
