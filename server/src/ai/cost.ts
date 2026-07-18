/**
 * Steward AI Gateway — token cost estimation.
 */

import { getSupabaseClient } from '../supabase.js';
import { AiGatewayError } from './errors.js';
import type { AiGatewayConfig } from './config.js';

/** Standard-processing USD per 1M tokens, with environment overrides for pricing changes. */
const MODEL_PRICING_USD_PER_M: Record<string, { input: number; output: number }> = {
  'gpt-5.6-luna': { input: 1, output: 6 },
  'gpt-5.6-terra': { input: 2.5, output: 15 },
};

function pricingFor(model: string): { input: number; output: number } {
  const known = MODEL_PRICING_USD_PER_M[model] ?? MODEL_PRICING_USD_PER_M['gpt-5.6-terra']!;
  const key = model.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  const inputOverride = Number(process.env[`OPENAI_PRICE_${key}_INPUT_USD_PER_M`]);
  const outputOverride = Number(process.env[`OPENAI_PRICE_${key}_OUTPUT_USD_PER_M`]);
  return {
    input: Number.isFinite(inputOverride) && inputOverride >= 0 ? inputOverride : known.input,
    output: Number.isFinite(outputOverride) && outputOverride >= 0 ? outputOverride : known.output,
  };
}

export function estimateCostCents(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = pricingFor(model);
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
