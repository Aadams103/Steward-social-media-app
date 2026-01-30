# Hostess (Steward) — Hosting Architecture

**Production is not hosted locally.** The app runs across three managed platforms:

| Platform | Role | What it runs |
|----------|------|--------------|
| **Railway** | Backend hosting | Node/Express API, WebSockets, long-lived server. Handles `/api/*`, `/ws`, `/uploads`, health. |
| **Vercel** | Frontend hosting | Static React/Vite build + serverless if needed. Serves the SPA; does **not** run long-lived servers or WebSockets. |
| **Supabase** | Backend services | Postgres, Auth, Storage, Realtime. Used **with** Railway (and optionally Vercel frontend for auth). |

---

## How they work together

```
User → Vercel (frontend) → Railway (API) → Supabase (DB/auth/storage)
                ↓                  ↓
         VITE_* env vars     SUPABASE_* env vars
         (points to Railway) (points to Supabase)
```

- **Vercel** builds and serves the React app. At runtime the browser calls the **Railway** API using `VITE_API_BASE_PATH` and `VITE_WS_BASE_URL`.
- **Railway** runs the Express server. When `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, it uses **Supabase** for DB, OAuth state, ingested posts, etc.
- **Supabase** is the backend toolkit: hosted Postgres, auth, storage, realtime. It complements Railway (and optionally the frontend for Supabase Auth); it is not a replacement for Railway or Vercel.

---

## Platform summaries

- **Railway** — Managed backend: runs your server and (optionally) DB/Redis. Ideal for Node/Express APIs like Hostess. Think “Heroku, but modern.”
- **Vercel** — Frontend-first: great for static sites and serverless, especially React/Next.js. Not for long-lived servers or WebSockets.
- **Supabase** — Backend service toolkit: hosted Postgres plus auth, storage, and realtime APIs. Used **with** Railway or Vercel, not instead of them.

---

## Where to set what

| Where | Variables (examples) |
|-------|------------------------|
| **Vercel** (frontend) | `VITE_API_BASE_PATH`, `VITE_WS_BASE_URL` → your Railway URL; optionally `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` for Supabase Auth. |
| **Railway** (backend) | `PORT` (set by Railway); `NODE_ENV=production`; `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` when using Supabase; OAuth/ingest secrets as needed. |
| **Supabase** | Project URL and keys from dashboard; backend uses service role; frontend uses anon key only. |

See `.env.example` (frontend) and `server/.env.example` (backend), plus `DEPLOYMENT_GUIDE.md` and `RAILWAY_READINESS.md` for full steps.
