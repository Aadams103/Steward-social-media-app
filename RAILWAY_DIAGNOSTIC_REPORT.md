# Railway Full Diagnostic Report — Hostess (Steward) App

**Date:** 2026-01-30  
**Scope:** Frontend + Backend readiness for Railway deployment

---

## Executive summary

| Area | Status | Notes |
|------|--------|------|
| **Backend build** | ✅ Pass | After ESM import fix (see below) |
| **Backend start & health** | ✅ Pass | `/health`, `/api/health`, `/api/posts` return 200 |
| **Frontend build** | ✅ Pass | `npm run build` (check:safe + vite build) succeeds |
| **Railway config** | ✅ Correct | Root and `server/` both valid; health check path set |
| **Fix applied** | ✅ | Server ESM imports use `.js` extensions for Node |

---

## 1. Backend (Railway service)

### 1.1 Build

- **Root repo as Root Directory:**  
  `buildCommand = "npm ci && npm run build:server"`  
  Runs `cd server && npm ci && npm run build` → compiles TS to `server/dist/`.
- **`server/` as Root Directory:**  
  `buildCommand = "npm ci && npm run build"`  
  Runs in `server/` → `dist/` contains `server.js`, `seed.js`, `types.js`, `supabase.js`, etc.

Both flows were run locally; backend build completes successfully.

### 1.2 Start command

- **Root repo:** `startCommand = "cd server && node dist/server.js"`
- **`server/` as root:** `startCommand = "npm start"` → `node dist/server.js`

Server binds to `process.env.PORT || 3000` and `0.0.0.0` (correct for Railway).

### 1.3 Health & API

- `GET /health` → `200`, `{"ok":true}`
- `GET /api/health` → `200`, `{"ok":true,"time":"...","version":"1.0.0"}`
- `GET /api/posts` → `200`, `{"posts":[],"total":0}`

Health check path in `railway.toml`: `/api/health` (matches implementation).

### 1.4 Bug found and fix (required for Railway)

**Issue:** With Root Directory = `server`, running `node dist/server.js` failed with:

```text
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../server/dist/seed' imported from .../server/dist/server.js
```

**Cause:** Node ESM requires explicit file extensions for relative imports. The compiled `server.js` still had `from './seed'` and `from './types'` (no `.js`).

**Change in `server/src/server.ts`:**

- `from './types'` → `from './types.js'`
- `from './seed'` → `from './seed.js'`

(`from './supabase.js'` was already correct.)

After this change, backend build and `node dist/server.js` succeed and all above endpoints respond.

---

## 2. Frontend

### 2.1 Build

- Command: `npm run build` → `npm run check:safe && vite build`
- `check:safe`: runs `check` (tsgo, eslint, format) with a 20s timeout.
- Result: Frontend build completed successfully (Vite/Rolldown, assets under `dist/`).

### 2.2 Railway vs frontend hosting

- **Backend on Railway:** One Railway service runs the Node server (this repo’s backend). It does **not** serve the frontend SPA; it only exposes `/`, `/health`, `/api/*`, `/uploads`, `/ws`.
- **Frontend:** Intended to be deployed elsewhere (e.g. Vercel or Railway static) with:
  - `VITE_API_BASE_PATH=https://<your-railway-service>.up.railway.app/api`
  - `VITE_WS_BASE_URL=wss://<your-railway-service>.up.railway.app/ws`

So “full app” = backend on Railway + frontend on another host pointing at that backend.

### 2.3 API base and WebSocket

- Default `VITE_API_BASE_PATH` is `"/api"` (same-origin). For a separate frontend host, set the env vars above so the app talks to the Railway backend.
- `request.ts` normalizes relative base to `window.location.origin + base`; absolute URLs are used as-is.

---

## 3. Railway configuration summary

| Setting | Repo root as Root Directory | `server/` as Root Directory |
|--------|-----------------------------|-----------------------------|
| **Build** | `npm ci && npm run build:server` | `npm ci && npm run build` |
| **Start** | `cd server && node dist/server.js` | `npm start` → `node dist/server.js` |
| **Health** | `/api/health` | `/api/health` |
| **Health timeout** | 300 | 300 |

Both options are valid; the ESM fix ensures the server starts in both cases.

---

## 4. Environment variables (Railway backend)

- **Required:** Railway sets `PORT`; do not set it manually.
- **Recommended:** `NODE_ENV=production`
- **Optional (features):**  
  `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_*`, `META_*`, `INGEST_SECRET` / `CRON_SECRET` — see `RAILWAY_READINESS.md` and `.env.example`.

---

## 5. Checks performed

1. Backend: `npm run build:server` (from repo root) — **pass**
2. Backend: `cd server && npm run build` — **pass**
3. Backend: `cd server && node dist/server.js` with `PORT=3999` — **pass** (after ESM fix)
4. Backend: `GET /health`, `GET /api/health`, `GET /api/posts` — **all 200**
5. Frontend: `npm run build` — **pass**
6. Railway: Root and `server/` `railway.toml` — **consistent and correct**

---

## 6. Conclusion and next steps

- **Backend and frontend are in good shape for Railway.** The only code change required was adding `.js` to local ESM imports in `server/src/server.ts`.
- For production:
  - Deploy backend to Railway (root or `server/` as Root Directory).
  - Deploy frontend to Vercel (or another host) with `VITE_API_BASE_PATH` and `VITE_WS_BASE_URL` pointing at the Railway backend.
  - Optionally add Postgres/Redis and replace in-memory storage (see `RAILWAY_READINESS.md`).
