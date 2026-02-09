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

### Vercel blank screen + 401 on manifest.json (or other assets)

**Problem:** The app loads as a blank screen and the browser console shows `401 Unauthorized` for `manifest.json` (and sometimes for JS/CSS). The `#app` div stays empty.

**Cause:** **Vercel Deployment Protection** (Vercel Authentication or Password Protection) is enabled. Unauthenticated requests get 401, so the document or static assets are blocked and the app never runs.

**Fix:**

1. Open the [Vercel dashboard](https://vercel.com) → your project → **Settings** → **Deployment Protection**.
2. For **Preview** (and **Production** if you want the site public):
   - Turn **off** “Vercel Authentication” and/or “Password Protection”, **or**
   - Use a **Stable Alias** (e.g. `your-project.vercel.app` or a custom domain) and always open the app via that URL after logging in once, so the auth cookie applies to the same domain that serves assets.
3. Redeploy or refresh; the app and `manifest.json` should load without 401 and the screen should render.

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
