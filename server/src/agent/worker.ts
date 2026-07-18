/**
 * Agent background worker.
 *
 * Every 5 minutes, scans automation_rules with trigger_type 'schedule_cron'
 * that are enabled and due (next_run_at <= now), and runs one agent cycle
 * per matched brand. Enabled by default in production.
 *
 * Acting user: the rule creator when set, else the organization owner —
 * the agent never runs without an accountable human identity.
 */

import cron, { type ScheduledTask } from 'node-cron';
import { isWorkerEnabled } from '../config.js';
import { getSupabaseClient } from '../supabase.js';
import { runAgentCycle } from './orchestrator.js';

let task: ScheduledTask | null = null;
let cycleInProgress = false;

const DEFAULT_INTERVAL_MINUTES = 60;

interface AgentRuleRow {
  id: string;
  organization_id: string;
  brand_id: string;
  created_by: string | null;
  action_config: Record<string, unknown> | null;
  trigger_config: Record<string, unknown> | null;
}

async function resolveActingUser(rule: AgentRuleRow): Promise<string | null> {
  if (rule.created_by) return rule.created_by;
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client
    .from('organizations')
    .select('owner_id')
    .eq('id', rule.organization_id)
    .maybeSingle();
  return (data?.owner_id as string) ?? null;
}

async function markRuleRan(ruleId: string, intervalMinutes: number, errorMessage?: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const now = new Date();

  // Merge into existing metadata rather than replacing it.
  const { data: existing } = await client
    .from('automation_rules')
    .select('metadata')
    .eq('id', ruleId)
    .maybeSingle();
  const metadata = { ...((existing?.metadata as Record<string, unknown>) ?? {}) };
  if (errorMessage) {
    metadata.last_error = errorMessage.slice(0, 500);
    metadata.last_error_at = now.toISOString();
  } else {
    delete metadata.last_error;
    delete metadata.last_error_at;
  }

  await client
    .from('automation_rules')
    .update({
      last_run_at: now.toISOString(),
      next_run_at: new Date(now.getTime() + intervalMinutes * 60 * 1000).toISOString(),
      metadata,
    })
    .eq('id', ruleId);
}

async function agentTick(): Promise<void> {
  if (cycleInProgress) return;
  cycleInProgress = true;
  try {
    const client = getSupabaseClient();
    if (!client) return;

    const { data: rules, error } = await client
      .from('automation_rules')
      .select('id, organization_id, brand_id, created_by, action_config, trigger_config')
      .eq('enabled', true)
      .eq('trigger_type', 'schedule_cron')
      .eq('action_type', 'run_ai_job')
      .or(`next_run_at.is.null,next_run_at.lte.${new Date().toISOString()}`)
      .limit(10);

    if (error) {
      console.error('[agent-worker] Failed to load due rules:', error.message);
      return;
    }

    for (const rule of (rules ?? []) as AgentRuleRow[]) {
      const intervalMinutes =
        Number(rule.trigger_config?.interval_minutes) > 0
          ? Number(rule.trigger_config?.interval_minutes)
          : DEFAULT_INTERVAL_MINUTES;

      const userId = await resolveActingUser(rule);
      if (!userId) {
        console.warn(`[agent-worker] Rule ${rule.id}: no acting user resolvable; skipping.`);
        await markRuleRan(rule.id, intervalMinutes, 'NO_ACTING_USER');
        continue;
      }

      try {
        const report = await runAgentCycle({
          organizationId: rule.organization_id,
          brandId: rule.brand_id,
          userId,
          config: {
            maxDraftsPerCycle: Number(rule.action_config?.max_drafts_per_cycle) || undefined,
          },
        });
        console.log(
          `[agent-worker] Rule ${rule.id}: ${report.results.filter((r) => r.status === 'succeeded').length}/${report.plannedActions.length} actions succeeded`
        );
        await markRuleRan(rule.id, intervalMinutes);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[agent-worker] Rule ${rule.id} failed:`, message);
        await markRuleRan(rule.id, intervalMinutes, message);
      }
    }
  } finally {
    cycleInProgress = false;
  }
}

/** Starts the agent worker. Enabled by default in production. Idempotent. */
export function startAgentWorker(): void {
  if (!isWorkerEnabled('AGENT_WORKER_ENABLED')) {
    console.log('[agent-worker] Agent worker disabled by environment configuration');
    return;
  }
  if (task) return;
  if (!getSupabaseClient()) {
    console.error('[agent-worker] Cannot start: Supabase service role not configured');
    return;
  }
  task = cron.schedule('*/5 * * * *', () => {
    void agentTick();
  });
  console.log('[agent-worker] Agent worker started (every 5 minutes)');
}

export function stopAgentWorker(): void {
  if (task) {
    task.stop();
    task = null;
  }
}
