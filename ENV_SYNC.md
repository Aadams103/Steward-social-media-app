# Environment variable sync (Vercel, Railway, Supabase)

Use the same Supabase project URL and keys across frontend and backend so auth and API work in production.

## Canonical values (Supabase Dashboard)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Project Settings** → **API**.
2. Copy:
   - **Project URL** → use as `SUPABASE_URL` / `VITE_SUPABASE_URL`.
   - **anon public** key → use as `VITE_SUPABASE_ANON_KEY` (frontend only).
   - **service_role** secret key → use as `SUPABASE_SERVICE_ROLE_KEY` (backend only; never in frontend).

Current project URL: `https://bffuipcmtlfatvxkcpeq.supabase.co`

## Vercel (frontend)

In **Vercel** → project **steward-social-media-app** → **Settings** → **Environment Variables**, set for **Production** (and Preview if needed):

| Name | Value |
|------|--------|
| `VITE_SUPABASE_URL` | `https://bffuipcmtlfatvxkcpeq.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | (Supabase anon key from dashboard) |

Redeploy after changing env vars if Vercel does not auto-redeploy.

## Railway (backend)

In **Railway** → your backend service → **Variables**, set:

| Name | Value |
|------|--------|
| `SUPABASE_URL` | `https://bffuipcmtlfatvxkcpeq.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | (Supabase service_role key from dashboard) |

Redeploy the service after saving variables.

## Health check (after deploy)

- **Backend liveness**: `GET /health` returns `{ "ok": true }` (no auth). Use for load balancers and quick checks.
  - Example: `curl https://<your-railway-backend-domain>/health`
- **Backend detailed**: `GET /api/health` returns `ok`, `time`, `version`, and optional `supabase` status (requires auth).
- In the browser on the Vercel app, open DevTools → Network and confirm API requests to the Railway backend return 2xx (no CORS or 5xx errors).

## Local development

- **Frontend**: copy `.env.example` to `.env` and fill `VITE_SUPABASE_ANON_KEY` (and Railway URLs if hitting deployed backend).
- **Backend**: copy `server/.env.example` to `server/.env` and fill `SUPABASE_SERVICE_ROLE_KEY`.
