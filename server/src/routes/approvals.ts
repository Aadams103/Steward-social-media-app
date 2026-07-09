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
    res.status(500).json({ code: 'APPROVE_ERROR', message: String(err) });
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
        status: 'needs_review',
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
        status: 'needs_review',
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
