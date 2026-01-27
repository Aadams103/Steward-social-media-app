# Deploy Vercel + Railway + Supabase – Steward

Run this to validate and prepare a deploy of Steward: Vercel (frontend), Railway (backend), and Supabase (Auth/DB/Storage).

## 1. Detect layout

- **Frontend root**: `.` (root `package.json` with `vite`).
- **Backend**: `server/` (`server/package.json`, `server/src/index.ts`).

## 2. Env

### Frontend (Vercel)

| Variable | Required | Notes |
|----------|----------|-------|
| `VITE_API_BASE_PATH` | Yes | e.g. `https://<railway>/api` |
| `VITE_WS_BASE_URL` | Yes | e.g. `wss://<railway>/ws` |
| `VITE_MCP_API_BASE_PATH` | No | Optional; e.g. `/api` or `/api/mcp` |
| `VITE_SUPABASE_URL` | When using Supabase Auth | Project URL |
| `VITE_SUPABASE_ANON_KEY` | When using Supabase Auth | **Anon only**; never service role |

### Backend (Railway)

| Variable | Required | Notes |
|----------|----------|-------|
| `NODE_ENV` | Yes | `production` |
| `PORT` | No | Railway sets it |
| `GOOGLE_CLIENT_ID` | If using Google OAuth | |
| `GOOGLE_CLIENT_SECRET` | If using Google OAuth | |
| `GOOGLE_OAUTH_REDIRECT_BASE` | If using Google OAuth | `https://<railway>` (no /api) |
| `META_APP_ID` | If using Meta OAuth | |
| `META_APP_SECRET` | If using Meta OAuth | |
| `META_OAUTH_REDIRECT_BASE` | If using Meta OAuth | `https://<railway>` |
| `SUPABASE_URL` | When using Supabase | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | When using Supabase | **Backend only**; never in frontend |
| `DATABASE_URL` | When using Supabase Postgres | From Supabase → Settings → Database |
| `INGEST_SECRET` / `CRON_SECRET` | Optional | Guard `/api/cron/ingest` |

**Validate**: `SUPABASE_SERVICE_ROLE_KEY` and `*_SECRET` must **not** appear in frontend env.

## 3. Commands (pre-deploy)

Run at repo root:

```bash
npm run build
npm run test
npm run check:branding
```

Run in `server/`:

```bash
cd server && npm run build
```

## 4. Output – Deploy checklist

- **Vercel**
  - Build: `npm run build`
  - Output: `dist`
  - Framework: Vite (from `vercel.json`)
- **Railway**
  - Root: `server` (service Root Directory)
  - Build: `npm ci && npm run build` (or per `server/railway.toml`)
  - Start: `npm start`
  - Health: `/api/health`
- **DB migrations** (when using Supabase): `supabase db push` or run SQL from `supabase/migrations/` in order.
- **Env**: Set the variables above per platform; ensure no service role or `*_SECRET` in frontend.
