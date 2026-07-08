/**
 * Steward AI Gateway — token cost estimation.
 */

import { getSupabaseClient } from '../supabase.js';
import { AiGatewayError } from './errors.js';
import type { AiGatewayConfig } from './config.js';

/** Approximate USD per 1M tokens — update as OpenAI pricing changes. */
const MODEL_PRICING_USD_PER_M: Record<string, { input: number; output: number }> = {
  'gpt-4.1-mini': { input: 0.4, output: 1.6 },
  'gpt-4.1': { input: 2.0, output: 8.0 },
  'gpt-4o': { input: 2.5, output: 10.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
};

export function estimateCostCents(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING_USD_PER_M[model] ?? MODEL_PRICING_USD_PER_M['gpt-4.1-mini']!;
  const usd =
    (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
  return Math.max(1, Math.ceil(usd * 100));
}

export async function enforceOrgBudget(
  organizationId: string,
  cfg: AiGatewayConfig
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const monthStart = new Date(Date.UTC(dayStart.getUTCFullYear(), dayStart.getUTCMonth(), 1));

  const { data: dayRows } = await client
    .from('ai_jobs')
    .select('estimated_cost_cents')
    .eq('organization_id', organizationId)
    .gte('created_at', dayStart.toISOString());

  const { data: monthRows } = await client
    .from('ai_jobs')
    .select('estimated_cost_cents')
    .eq('organization_id', organizationId)
    .gte('created_at', monthStart.toISOString());

  const daySpend = (dayRows ?? []).reduce((sum, r) => sum + (r.estimated_cost_cents ?? 0), 0);
  const monthSpend = (monthRows ?? []).reduce((sum, r) => sum + (r.estimated_cost_cents ?? 0), 0);

  if (daySpend >= cfg.dailyOrgBudgetCents) {
    throw new AiGatewayError(
      'BUDGET_EXCEEDED',
      'Daily AI budget exceeded for this organization.',
      402,
      { daySpendCents: daySpend, limitCents: cfg.dailyOrgBudgetCents }
    );
  }
  if (monthSpend >= cfg.monthlyOrgBudgetCents) {
    throw new AiGatewayError(
      'BUDGET_EXCEEDED',
      'Monthly AI budget exceeded for this organization.',
      402,
      { monthSpendCents: monthSpend, limitCents: cfg.monthlyOrgBudgetCents }
    );
  }
}
