/**
 * AI Social Media Agent — HTTP routes.
 *
 * POST /api/agent/run              — trigger a cycle (supports dryRun)
 * GET  /api/agent/status           — last cycle summary + due automation rules
 * GET  /api/agent/decisions        — agent decision history
 * GET  /api/agent/rules            — list agent automation rules
 * POST /api/agent/rules            — create/enable a recurring agent rule
 * PATCH /api/agent/rules/:id       — enable/disable a rule
 */

import type { Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { getSupabaseClient } from '../supabase.js';
import { isSupabaseServiceConfigured } from '../services/steward-db.js';
import { verifyOrgMembership } from '../services/ai-jobs-db.js';
import { getPermissions } from '../services/permissions.js';
import { assertWorkspaceAccess } from '../services/workspace.js';
import { runAgentCycle } from '../agent/orchestrator.js';

const runSchema = z.object({
  organizationId: z.string().uuid(),
  brandId: z.string().uuid(),
  dryRun: z.boolean().optional(),
  maxDraftsPerCycle: z.number().int().min(0).max(5).optional(),
});

const createRuleSchema = z.object({
  organizationId: z.string().uuid(),
  brandId: z.string().uuid(),
  name: z.string().min(1).max(200).default('Steward agent cycle'),
  intervalMinutes: z.number().int().min(15).max(24 * 60).default(60),
  maxDraftsPerCycle: z.number().int().min(0).max(5).default(2),
});

const patchRuleSchema = z.object({
  organizationId: z.string().uuid(),
  enabled: z.boolean(),
});

function guard(res: Response): boolean {
  if (!isSupabaseServiceConfigured()) {
    res.status(503).json({ code: 'SUPABASE_NOT_CONFIGURED', message: 'Supabase not configured' });
    return false;
  }
  return true;
}

function handleError(res: Response, err: unknown): void {
  if (err instanceof z.ZodError) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: err.issues.map((i) => i.message).join('; ') });
    return;
  }
  if (err instanceof Error) {
    if (err.message === 'ORG_ACCESS_DENIED') {
      res.status(403).json({ code: 'FORBIDDEN', message: 'You are not a member of this organization.' });
      return;
    }
    const code = (err as Error & { code?: string }).code;
    if (code === 'FORBIDDEN' || code === 'BRAND_ACCESS_DENIED') {
      res.status(403).json({ code: 'FORBIDDEN', message: err.message });
      return;
    }
    // AiGatewayError carries a status
    const status = (err as Error & { status?: number }).status;
    if (typeof status === 'number' && status >= 400 && status < 600) {
      res.status(status).json({ code: (err as Error & { code?: string }).code ?? 'AGENT_ERROR', message: err.message });
      return;
    }
  }
  res.status(500).json({ code: 'AGENT_ERROR', message: 'Agent operation failed.' });
}

export async function runAgentHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!guard(res)) return;
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return;
  }

  try {
    const body = runSchema.parse(req.body);
    const role = await assertWorkspaceAccess(userId, body.organizationId, body.brandId);
    const perms = getPermissions(role);
    if (!perms.canEditPosts) {
      res.status(403).json({ code: 'FORBIDDEN', message: 'Your role cannot run agent cycles.' });
      return;
    }

    const report = await runAgentCycle({
      organizationId: body.organizationId,
      brandId: body.brandId,
      userId,
      config: {
        dryRun: body.dryRun ?? false,
        maxDraftsPerCycle: body.maxDraftsPerCycle,
      },
    });

    res.json({ report });
  } catch (err) {
    handleError(res, err);
  }
}

export async function getAgentStatusHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!guard(res)) return;
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return;
  }

  const organizationId = req.query.organizationId as string;
  const brandId = req.query.brandId as string | undefined;

  try {
    if (!organizationId) {
      res.status(400).json({ code: 'ORG_REQUIRED', message: 'organizationId is required' });
      return;
    }
    await verifyOrgMembership(userId, organizationId);
    const client = getSupabaseClient()!;

    let lastRunQuery = client
      .from('ai_decision_logs')
      .select('id, brand_id, recommendation, reasoning_summary, created_at')
      .eq('organization_id', organizationId)
      .eq('decision_type', 'agent_cycle')
      .order('created_at', { ascending: false })
      .limit(1);
    if (brandId) lastRunQuery = lastRunQuery.eq('brand_id', brandId);

    let rulesQuery = client
      .from('automation_rules')
      .select('id, brand_id, name, enabled, trigger_type, trigger_config, action_type, action_config, last_run_at, next_run_at')
      .eq('organization_id', organizationId)
      .eq('action_type', 'run_ai_job');
    if (brandId) rulesQuery = rulesQuery.eq('brand_id', brandId);

    const [lastRun, rules] = await Promise.all([lastRunQuery.maybeSingle(), rulesQuery]);

    res.json({
      status: {
        worker_enabled: process.env.AGENT_WORKER_ENABLED === 'true',
        last_run: lastRun.data ?? null,
        rules: rules.data ?? [],
      },
    });
  } catch (err) {
    handleError(res, err);
  }
}

export async function listAgentDecisionsHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!guard(res)) return;
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return;
  }

  const organizationId = req.query.organizationId as string;
  const brandId = req.query.brandId as string | undefined;
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  try {
    if (!organizationId) {
      res.status(400).json({ code: 'ORG_REQUIRED', message: 'organizationId is required' });
      return;
    }
    await verifyOrgMembership(userId, organizationId);
    const client = getSupabaseClient()!;

    let query = client
      .from('ai_decision_logs')
      .select('id, brand_id, decision_type, recommendation, reasoning_summary, confidence, accepted_by_user, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (brandId) query = query.eq('brand_id', brandId);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ decisions: data ?? [] });
  } catch (err) {
    handleError(res, err);
  }
}

export async function createAgentRuleHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!guard(res)) return;
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return;
  }

  try {
    const body = createRuleSchema.parse(req.body);
    const role = await assertWorkspaceAccess(userId, body.organizationId, body.brandId);
    const perms = getPermissions(role);
    if (!perms.canManageWorkspace) {
      res.status(403).json({ code: 'FORBIDDEN', message: 'Only owners/admins can configure agent rules.' });
      return;
    }

    const client = getSupabaseClient()!;
    const { data, error } = await client
      .from('automation_rules')
      .insert({
        organization_id: body.organizationId,
        brand_id: body.brandId,
        name: body.name,
        trigger_type: 'schedule_cron',
        trigger_config: { interval_minutes: body.intervalMinutes },
        action_type: 'run_ai_job',
        action_config: { max_drafts_per_cycle: body.maxDraftsPerCycle, agent: 'steward_social_agent' },
        enabled: true,
        next_run_at: new Date().toISOString(),
        created_by: userId,
      })
      .select('*')
      .single();
    if (error) throw error;

    res.status(201).json({ rule: data });
  } catch (err) {
    handleError(res, err);
  }
}

export async function patchAgentRuleHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!guard(res)) return;
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });
    return;
  }

  try {
    const body = patchRuleSchema.parse(req.body);
    const role = await verifyOrgMembership(userId, body.organizationId);
    const perms = getPermissions(role);
    if (!perms.canManageWorkspace) {
      res.status(403).json({ code: 'FORBIDDEN', message: 'Only owners/admins can configure agent rules.' });
      return;
    }

    const client = getSupabaseClient()!;
    const { data, error } = await client
      .from('automation_rules')
      .update({ enabled: body.enabled })
      .eq('id', req.params.id)
      .eq('organization_id', body.organizationId)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      res.status(404).json({ code: 'RULE_NOT_FOUND', message: 'Automation rule not found in this organization.' });
      return;
    }

    res.json({ rule: data });
  } catch (err) {
    handleError(res, err);
  }
}
