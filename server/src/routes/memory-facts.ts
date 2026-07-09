/**
 * AI memory fact approve / reject / archive mutations.
 */

import type { Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { getSupabaseClient } from '../supabase.js';
import { assertPermission } from '../services/permissions.js';
import { assertWorkspaceAccess, logAuditEvent } from '../services/workspace.js';
import { isSupabaseServiceConfigured } from '../services/steward-db.js';

const actionBodySchema = z.object({
  organizationId: z.string().uuid(),
  reason: z.string().max(2000).optional(),
});

async function getMemoryFact(factId: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error('SUPABASE_NOT_CONFIGURED');
  const { data, error } = await client
    .from('ai_memory_facts')
    .select('*')
    .eq('id', factId)
    .is('archived_at', null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function findConflictingFact(brandId: string, factType: string, factKey: string, excludeId: string) {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client
    .from('ai_memory_facts')
    .select('id, fact_key, fact_value, approved')
    .eq('brand_id', brandId)
    .eq('fact_type', factType)
    .eq('fact_key', factKey)
    .eq('approved', true)
    .neq('id', excludeId)
    .is('archived_at', null)
    .maybeSingle();
  return data;
}

function guard(res: Response): boolean {
  if (!isSupabaseServiceConfigured()) {
    res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Supabase not configured' });
    return false;
  }
  return true;
}

export async function approveMemoryFactHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!guard(res)) return;
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return;
  }

  try {
    const body = actionBodySchema.parse(req.body);
    const role = await assertWorkspaceAccess(userId, body.organizationId);
    assertPermission(role, 'canApproveMemory');

    const fact = await getMemoryFact(req.params.id);
    if (!fact) {
      res.status(404).json({ code: 'FACT_NOT_FOUND', message: 'Memory fact not found' });
      return;
    }
    if (fact.organization_id !== body.organizationId) {
      res.status(403).json({ code: 'FORBIDDEN', message: 'Fact does not belong to organization' });
      return;
    }

    const conflict = await findConflictingFact(
      fact.brand_id as string,
      fact.fact_type as string,
      fact.fact_key as string,
      fact.id as string
    );

    if (conflict && !body.reason) {
      res.status(409).json({
        code: 'MEMORY_CONFLICT',
        message: 'An approved fact with the same key exists. Provide reason to resolve.',
        conflict: {
          existing_id: conflict.id,
          existing_value: conflict.fact_value,
          proposed_id: fact.id,
          proposed_value: fact.fact_value,
        },
      });
      return;
    }

    if (conflict && body.reason) {
      const client = getSupabaseClient()!;
      await client
        .from('ai_memory_facts')
        .update({ archived_at: new Date().toISOString(), metadata: { archived_reason: 'superseded', reason: body.reason } })
        .eq('id', conflict.id);
    }

    const client = getSupabaseClient()!;
    const { data: updated, error } = await client
      .from('ai_memory_facts')
      .update({
        approved: true,
        approved_by: userId,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', fact.id)
      .select('*')
      .single();

    if (error) throw error;

    await logAuditEvent({
      organizationId: body.organizationId,
      brandId: fact.brand_id as string,
      actorUserId: userId,
      action: 'memory_fact.approve',
      entityType: 'ai_memory_fact',
      entityId: fact.id as string,
      afterState: { approved: true },
    });

    res.json({ fact: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ code: 'VALIDATION_ERROR', message: err.message });
      return;
    }
    if (err instanceof Error && (err as Error & { code?: string }).code === 'FORBIDDEN') {
      res.status(403).json({ code: 'FORBIDDEN', message: err.message });
      return;
    }
    res.status(500).json({ code: 'MEMORY_APPROVE_ERROR', message: String(err) });
  }
}

export async function rejectMemoryFactHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!guard(res)) return;
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return;
  }

  try {
    const body = actionBodySchema.extend({ reason: z.string().min(1).max(2000) }).parse(req.body);
    const role = await assertWorkspaceAccess(userId, body.organizationId);
    assertPermission(role, 'canApproveMemory');

    const fact = await getMemoryFact(req.params.id);
    if (!fact) {
      res.status(404).json({ code: 'FACT_NOT_FOUND', message: 'Memory fact not found' });
      return;
    }
    if (fact.organization_id !== body.organizationId) {
      res.status(403).json({ code: 'FORBIDDEN', message: 'Fact does not belong to organization' });
      return;
    }

    const client = getSupabaseClient()!;
    const { data: updated, error } = await client
      .from('ai_memory_facts')
      .update({
        approved: false,
        archived_at: new Date().toISOString(),
        metadata: { ...(fact.metadata as object), rejection_reason: body.reason },
        updated_at: new Date().toISOString(),
      })
      .eq('id', fact.id)
      .select('*')
      .single();

    if (error) throw error;

    await logAuditEvent({
      organizationId: body.organizationId,
      brandId: fact.brand_id as string,
      actorUserId: userId,
      action: 'memory_fact.reject',
      entityType: 'ai_memory_fact',
      entityId: fact.id as string,
      metadata: { reason: body.reason },
    });

    res.json({ fact: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ code: 'VALIDATION_ERROR', message: err.message });
      return;
    }
    if (err instanceof Error && (err as Error & { code?: string }).code === 'FORBIDDEN') {
      res.status(403).json({ code: 'FORBIDDEN', message: err.message });
      return;
    }
    res.status(500).json({ code: 'MEMORY_REJECT_ERROR', message: String(err) });
  }
}

export async function archiveMemoryFactHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!guard(res)) return;
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return;
  }

  try {
    const body = actionBodySchema.parse(req.body);
    const role = await assertWorkspaceAccess(userId, body.organizationId);
    assertPermission(role, 'canApproveMemory');

    const fact = await getMemoryFact(req.params.id);
    if (!fact) {
      res.status(404).json({ code: 'FACT_NOT_FOUND', message: 'Memory fact not found' });
      return;
    }
    if (fact.organization_id !== body.organizationId) {
      res.status(403).json({ code: 'FORBIDDEN', message: 'Fact does not belong to organization' });
      return;
    }

    const client = getSupabaseClient()!;
    const { data: updated, error } = await client
      .from('ai_memory_facts')
      .update({
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', fact.id)
      .select('*')
      .single();

    if (error) throw error;

    await logAuditEvent({
      organizationId: body.organizationId,
      brandId: fact.brand_id as string,
      actorUserId: userId,
      action: 'memory_fact.archive',
      entityType: 'ai_memory_fact',
      entityId: fact.id as string,
    });

    res.json({ fact: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ code: 'VALIDATION_ERROR', message: err.message });
      return;
    }
    if (err instanceof Error && (err as Error & { code?: string }).code === 'FORBIDDEN') {
      res.status(403).json({ code: 'FORBIDDEN', message: err.message });
      return;
    }
    res.status(500).json({ code: 'MEMORY_ARCHIVE_ERROR', message: String(err) });
  }
}

export async function listMemoryFactsHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!guard(res)) return;
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return;
  }

  const organizationId = req.query.organizationId as string;
  const brandId = req.query.brandId as string;
  const approved = req.query.approved as string | undefined;

  try {
    await assertWorkspaceAccess(userId, organizationId, brandId);
    const client = getSupabaseClient()!;

    let q = client
      .from('ai_memory_facts')
      .select('id, fact_type, fact_key, fact_value, confidence, source, approved, approved_at, created_at')
      .eq('organization_id', organizationId)
      .eq('brand_id', brandId)
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    if (approved === 'true') q = q.eq('approved', true);
    if (approved === 'false') q = q.eq('approved', false);

    const { data, error } = await q;
    if (error) throw error;

    res.json({ facts: data ?? [] });
  } catch (err) {
    res.status(500).json({ code: 'MEMORY_LIST_ERROR', message: String(err) });
  }
}
