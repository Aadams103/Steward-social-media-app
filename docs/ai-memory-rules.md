# Steward AI Memory Rules

Steward learns safely — it does not silently overwrite brand facts from a single AI output.

## What can become memory

| Source | Confidence | Approval |
|--------|------------|----------|
| User says "always use this" | High | Auto-approved user preference |
| Business profile setup | High | Approved on save |
| Seed data | High | Pre-approved |
| Repeated user edits | Medium | Proposed → review |
| Inferred from behavior | Low | Proposed → review |
| Single AI output | Low | **Never auto-approved** |

## ai_memory_facts fields

- `fact_type`: business_fact, brand_preference, user_preference, etc.
- `fact_key` / `fact_value`: structured JSON value
- `confidence`: 0–1
- `source`: seed, user_explicit, behavior, ai_inference
- `approved`: must be `true` for inclusion in AI context
- `approved_by` / `approved_at`: audit trail
- `expires_at`: optional TTL for time-bound facts
- `archived_at`: soft delete wrong facts

## Conflict handling

If a proposed fact conflicts with an existing approved fact:

1. Do **not** overwrite silently.
2. Flag conflict in `ai_decision_logs`.
3. Require admin approval or user resolution.

## Content feedback loop

`content_feedback` records (liked, wrong_tone, too_generic, unsafe, etc.) feed future learning:

- Creates proposed memory facts with lower confidence.
- Updates `user_brand_preferences.learned_preferences_json` only after validation.
- Never directly changes `brand_profiles` from feedback alone.

## Gateway rule

Only `approved = true` and non-archived facts appear in `getStewardBrandContext().approvedMemoryFacts`.
