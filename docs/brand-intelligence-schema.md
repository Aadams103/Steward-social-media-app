# Steward Brand Intelligence Schema

Brand Intelligence is Steward's structured memory layer. Every AI operation pulls from these tables before generating content.

## Core tables

| Table | Purpose |
|-------|---------|
| `brand_profiles` | Deep business identity: voice, goals, compliance, safety notes |
| `user_brand_preferences` | Per-user AI behavior: tone, approval strictness, auto-publish |
| `audience_segments` | Who the brand speaks to |
| `content_pillars` | Strategic content categories |
| `brand_hashtags` | Hashtag bank (brand, local, campaign, personal) |
| `brand_ctas` | Reusable calls to action |
| `business_locations` | Physical / service locations |
| `recurring_schedules` | Classes, hours, events, content anchors |
| `brand_offers` / `offers` | Promotions and lead-gen offers |
| `reusable_snippets` | Approved language blocks |
| `brand_rules` | Required, forbidden, safety, and approval rules |
| `platform_strategy` | Per-platform posting strategy |

## AI audit & learning tables

| Table | Purpose |
|-------|---------|
| `ai_memory_facts` | Approved long-term facts (source + approval required) |
| `ai_context_snapshots` | Exact context JSON used for each serious AI job |
| `ai_jobs` | Extended with `context_snapshot_id`, validation fields |
| `ai_decision_logs` | Recommendations and user accept/reject |
| `content_feedback` | User likes/dislikes and quality signals |
| `content_safety_reviews` | Moderation and brand-safety results |

## Migrations

Applied in order:

1. `20260708000001_brand_intelligence_core.sql`
2. `20260708000002_brand_intelligence_ai_memory.sql`
3. `20260708000003_brand_intelligence_extend_existing.sql`
4. `20260708000004_brand_intelligence_rls.sql`
5. `20260708000005_kinetic_grappling_brand_intelligence_seed.sql`

## RLS summary

- Org members can **read** brand intelligence for their organization.
- Editors can **manage** profiles, hashtags, CTAs, rules, platform strategy.
- Users manage their own `user_brand_preferences` row.
- Memory facts: editors propose; admins approve (`approved` field).
- `ai_context_snapshots` writes are service-role only (no client insert policy).
- OAuth tokens are never stored in brand intelligence tables.

## Demo seed

Optional function: `seed_kinetic_grappling_brand_intelligence(org_id, brand_id, user_id)`.

Not hardcoded in product logic — call via API or SQL for demo orgs only.
