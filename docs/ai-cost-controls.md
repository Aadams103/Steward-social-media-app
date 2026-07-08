# AI cost controls

## Per-request tracking

Each `ai_jobs` row stores:

- `input_tokens`, `output_tokens`, `total_tokens`
- `estimated_cost_cents`

Estimates use model pricing table in `server/src/ai/cost.ts` (update when OpenAI pricing changes).

## Budget caps

Environment variables:

- `OPENAI_DAILY_ORG_BUDGET_CENTS` (default 500 = $5/day/org)
- `OPENAI_MONTHLY_ORG_BUDGET_CENTS` (default 5000 = $50/month/org)

When exceeded, gateway returns `402 BUDGET_EXCEEDED`.

## Rate limits (in-memory)

Per user, org, and heavy-operation buckets. Multipliers by subscription tier:

| Tier | Multiplier |
|------|------------|
| free | 1x |
| basic/starter | 2x |
| pro/agency/enterprise | 5x |

Production scale: replace with Redis.

## Tier defaults

Free/demo tiers get strict limits. Paid tiers get higher caps via subscription `plan_type`.
