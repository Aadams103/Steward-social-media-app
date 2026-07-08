# Steward Schema Foundation

Discovery summary and migration notes for the Steward social media OS database layer.

## Phase 1 — Existing system (before this work)

### Architecture
- **Frontend:** Vite + React 19, TanStack Router/Query, Supabase Auth
- **Backend:** Express shim (in-memory CRUD for posts/assets/brands/campaigns)
- **Supabase (partial):** Auth/profiles, billing, OAuth state, social account tokens, ingested posts, publish worker queue

### Existing public tables (13)
`profiles`, `organization_members`, `organizations`, `brands`, `posts`, `campaigns`, `social_accounts`, `assets`, `publish_jobs`, `oauth_states`, `ingested_posts`, `subscriptions`, `stripe_events`

### Prior repo migrations (7 files)
See `supabase/migrations/20250127*` through `20260609000002_*`.

### Key gaps discovered
- Most product CRUD still in-memory (`org1`, `user1`, `conn1` hardcoded)
- Supabase Storage buckets defined but unused by upload code
- Generated DB types not checked in
- `profiles.username` / `profiles.bio` referenced in frontend but missing from DB (now added)

## Phase 2 — New migrations (9 files)

| Migration | Purpose |
|-----------|---------|
| `20260707000001_steward_enums_and_rls_helpers.sql` | Enums + RLS helper functions |
| `20260707000002_steward_extend_core_tables.sql` | Extend organizations, brands, members, profiles |
| `20260707000003_steward_extend_content_tables.sql` | Extend assets, posts, social_accounts, publish_jobs, ingested_posts |
| `20260707000004_steward_strategy_intake_variants.sql` | Strategy, intake, variants, calendar tables |
| `20260707000005_steward_ai_approval_analytics.sql` | AI jobs, approvals, analytics, insights |
| `20260707000006_steward_business_ops_automation.sql` | Business ops, automation, audit, notifications |
| `20260707000007_steward_rls_policies.sql` | RLS for all new tables + safe social account view |
| `20260707000008_steward_storage_buckets.sql` | Org-scoped storage buckets/policies |
| `20260707000009_steward_seed_kinetic_grappling.sql` | Demo seed function |

## New tables (27)

`content_pillars`, `content_topics`, `audience_segments`, `brand_offers`, `content_goals`, `content_intake_items`, `post_variants`, `content_calendar_entries`, `recurring_content_rules`, `blackout_dates`, `ai_jobs`, `content_approvals`, `approval_steps`, `approval_comments`, `social_post_publications`, `post_metrics_snapshots`, `platform_account_metrics`, `audience_growth_snapshots`, `content_insights`, `business_locations`, `recurring_schedules`, `events`, `offers`, `testimonials`, `team_members`, `reusable_snippets`, `automation_rules`, `audit_logs`, `notifications`

## Modified tables

All 13 existing tables extended where needed (additive columns/constraints only).

## Apply to Steward-prod

```bash
cd repo
npx supabase login
npx supabase link --project-ref bffuipcmtlfatvxkcpeq
npx supabase db push
```

Run verification:

```bash
psql $DATABASE_URL -f supabase/tests/schema_verification.sql
```

Seed demo (after creating org + brand):

```sql
select public.seed_kinetic_grappling_demo('<org_uuid>', '<brand_uuid>');
```

## TypeScript

- Server types: `server/src/types/steward-schema.ts`
- Frontend types: `src/types/steward.ts`
- Regenerate from DB when linked:
  ```bash
  npx supabase gen types typescript --project-id bffuipcmtlfatvxkcpeq > server/src/supabase-db-types.generated.ts
  ```

## Service layer

- `server/src/services/steward-db.ts`
- Routes: `/api/steward/*` in `server/src/routes/steward.ts`
- Frontend client: `stewardApi` in `src/sdk/services/api-services.ts`

## Manual setup still required

1. Apply migrations to Steward-prod (`bffuipcmtlfatvxkcpeq`)
2. Migrate OAuth tokens from `social_accounts.oauth_*` columns to Vault (`token_secret_id`) — columns preserved for backward compatibility
3. Wire Express CRUD to Supabase (replace in-memory Maps)
4. Connect upload flow to Supabase Storage (`content-media` bucket)
5. Wire publish UI to `/api/steward/publish-jobs` instead of simulated shim
6. Run seed function after real org/brand onboarding

## Risks / TODOs

- Dual persistence (shim + Supabase) until CRUD migration completes
- `claim_due_publish_jobs` still uses legacy statuses (`processing`, `completed`) — mapped alongside new statuses
- Storage policies assume path prefix `{organization_id}/...`
- Viewer role can read but publish enforcement is primarily API/worker-side

## Next best phase

1. Org onboarding creates real UUID org/brand in Supabase
2. Replace in-memory post/asset CRUD with steward-db service
3. Asset upload → Storage + `createAssetMetadata`
4. AI pipeline writes to `ai_jobs` + `content_intake_items`
5. Approval UI on `content_approvals`
6. Analytics cron → `post_metrics_snapshots`
