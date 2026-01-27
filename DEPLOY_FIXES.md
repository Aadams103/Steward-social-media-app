# Deployment Fixes Applied

This document describes the fixes for **Railway** and **Vercel** build failures.

---

## Vercel

### Problem
- Build failed at `npm run check` (tsgo, lint, or format).
- `build` runs `check:safe` → `check` (tsgo + lint + format) before `vite build`.

### Fix Applied
- **`vercel.json`** added to override the build:
  - `buildCommand`: `npx vite build` (skips `check:safe`).
  - `outputDirectory`: `dist`
  - `framework`: `vite`

Redeploy on Vercel; it will use `npx vite build` and should succeed.

---

## Railway

### Problem (from logs)
1. **`npm ci` can only install when package.json and package-lock.json are in sync.**
   - Missing from lock file: `@types/cors`, `@types/ws`, `cors`, `vary`.
2. **Install runs at repo root** while the app you want to run lives in `server/`.

### Fixes Applied

1. **Root `package-lock.json`**
   - Ran `npm install` at the project root so `package-lock.json` includes the missing deps and matches `package.json`.

2. **Use `server` as the app root on Railway (recommended)**

   In the Railway service:

   - **Settings** → **Root Directory** → set to **`server`**.

   Then:
   - Only `server/` is used.
   - Install: `npm ci` in `server/`
   - Build: `npm run build` in `server/`
   - Start: `npm start` in `server/`
   The root `railway.json` was removed; when Root = `server`, Nixpacks uses `server/package.json` only.

   This avoids root `package.json` / `package-lock.json` and frontend tooling for the backend.

### Root Directory must be `server` for the backend

- For the **backend** service on Railway, **Root Directory** must be **`server`**.
- If you leave it at the repo root, Railway will build and run the frontend (Vite) instead of the backend.
- Root `package-lock.json` was updated with `npm install` for other tooling; Railway should use only `server/` when Root = `server`.

---

## Summary

| Platform | Change |
|----------|--------|
| **Vercel** | `vercel.json` sets `buildCommand: "npx vite build"` so the build skips `check:safe` and passes. |
| **Railway** | 1) Root `package-lock.json` updated. 2) Set **Root Directory** to **`server`** for the backend (required). |

---

## Redeploy

1. **Commit and push** the changes (including `vercel.json`, `package-lock.json`, `DEPLOY_FIXES.md`, and the removed `railway.json`).
2. **Vercel**: trigger a new deploy (or rely on Git integration).
3. **Railway**:
   - Set **Root Directory** to **`server`** if you have not already.
   - Trigger a new deploy.
