# Supabase – Steward

Migrations and config for Supabase (Auth, Postgres, Storage).  
**Service role key and `SUPABASE_SERVICE_ROLE_KEY` must stay on the backend (e.g. Railway) only; never in the frontend.**

## Migrations

- `migrations/20250127000000_initial.sql` – Core tables (profiles, organizations, brands, posts, campaigns, social_accounts, assets, publish_jobs, oauth_states) and RLS.
- `migrations/20250127000001_storage.sql` – Buckets `uploads`, `brand-icons` and storage RLS.
- `migrations/20250127000002_ingested_posts.sql` – `ingested_posts` for one-platform (Instagram) ingestion; idempotent by `(platform, external_id)`.

### Apply migrations

**Option A – Supabase CLI (recommended)**

```bash
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push
```

**Option B – SQL in Dashboard**

Run the contents of each migration file in order in the Supabase SQL Editor.

**Option C – Release / deploy job**

In Railway (or similar), add a release command or one-off job, e.g.:

```bash
npx supabase db push
```

or, if you use `DATABASE_URL` and a different migrator:

```bash
psql $DATABASE_URL -f supabase/migrations/20250127000000_initial.sql
psql $DATABASE_URL -f supabase/migrations/20250127000001_storage.sql
```

## Env (backend)

- `SUPABASE_URL` – Project URL  
- `SUPABASE_SERVICE_ROLE_KEY` – **Backend only**  
- `DATABASE_URL` – From Supabase → Settings → Database (if using external migrator or `psql`)

## Env (frontend)

- `VITE_SUPABASE_URL` – Project URL  
- `VITE_SUPABASE_ANON_KEY` – Anon/public key **only** (e.g. for Supabase Auth in the client)
