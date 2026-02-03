# Status: Real Data & Social Upload (Facebook, Google, Instagram)

**Goal:** Get real data flowing and be able to upload/post from Facebook, Google, and Instagram.

---

## 1. Where things run (Vercel, Railway, Supabase)

| Platform   | Role        | What runs |
|-----------|-------------|-----------|
| **Vercel**   | Frontend    | React/Vite SPA. Build: `npm run build` → `dist/`. Does **not** run API or WebSockets. |
| **Railway**  | Backend     | Express in `server/`. Serves `/api/*`, `/ws`, `/uploads`, `/health`. Set **Root Directory** to `server`. |
| **Supabase** | Data/Auth   | Postgres, Auth, Storage. Backend uses **service role** for OAuth state, social_accounts, ingested_posts. Frontend uses **anon key** for Supabase Auth (optional). |

**Data flow:** Browser (Vercel) → `VITE_API_BASE_PATH` / `VITE_WS_BASE_URL` → Railway → (when configured) Supabase.

- **Frontend env (Vercel):** `VITE_API_BASE_PATH=https://<your-app>.up.railway.app/api`, `VITE_WS_BASE_URL=wss://<your-app>.up.railway.app/ws`, and optionally `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- **Backend env (Railway):** `PORT` (set by Railway), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `META_APP_ID`, `META_APP_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_BASE`, `META_OAUTH_REDIRECT_BASE` (both = your Railway URL), and for ingest cron: `INGEST_SECRET` or `CRON_SECRET`.

---

## 2. Frontend status

- **API usage:** App uses both **real API hooks** (`usePosts`, `useCampaigns`, `useSocialAccounts`, etc. from `use-api.ts` → `api-services.ts`) and **mock store** (`useAppStore`) in different views. Dashboard and some flows use real API; others (alerts, scheduled slots, some lists) still use mock.
- **Auth:** Requests use Supabase session token when available (`request.ts`), else legacy auth store; backend validates via `authMiddleware` (Supabase JWT when configured).
- **OAuth in production:** The Connect Account dialog currently uses `fetch('/api/oauth/...')`, which is **relative**. When the app is served from Vercel, that hits Vercel (no backend), so OAuth would fail. It must use the same base as the rest of the API (`VITE_API_BASE_PATH`), i.e. call Railway. **Fix:** Use `platformRequest` or build URL from `import.meta.env.VITE_API_BASE_PATH` for all OAuth calls.

---

## 3. Backend status

- **Storage:** Posts, campaigns, social accounts, assets, etc. are held **in-memory** (Maps in `server.ts`). Seed data and OAuth callbacks populate these. When Supabase is set:
  - OAuth **state** is stored in Supabase (`oauth_states`).
  - **Social accounts** are upserted to Supabase `social_accounts` on connect (Facebook/Instagram/Google).
  - **Ingested posts** (Instagram) are written to Supabase `ingested_posts` by the cron ingest.
- **Gap:** `GET /api/social-accounts` and `GET /api/posts` read from **in-memory** Maps only. So after a restart, OAuth-connected accounts that exist only in Supabase are not returned unless the backend hydrates from Supabase or serves from Supabase. For “real data,” the backend should either load social accounts (and optionally posts) from Supabase when configured, or merge Supabase data into responses.
- **Publish:** `POST /api/posts/:id/publish` is a **simulation** (setTimeout, fake job completion). It does **not** call Facebook Graph API or Instagram Content Publishing API. Real publish requires:
  - **Facebook:** Graph API Page feed post (e.g. `POST /{page-id}/feed`) with Page access token.
  - **Instagram:** Content Publishing API (create media container, then publish container) with Instagram Business Account token.
  - **Google:** Depends on product (e.g. YouTube upload via YouTube Data API); OAuth is already set up for YouTube.
- **Ingest:** `POST /api/cron/ingest` is **real** for Instagram: it uses Graph API `/{ig-user-id}/media` with tokens from Supabase (or in-memory social accounts), and upserts into Supabase `ingested_posts`. There is **no** `GET /api/ingested-posts` (or similar) for the frontend to show this data yet.

---

## 4. What’s already in place for “real” flows

| Feature              | Status | Notes |
|----------------------|--------|--------|
| Meta OAuth (FB + IG) | ✅     | Connect Facebook Page & Instagram Business; tokens stored in Supabase when configured. |
| Google OAuth         | ✅     | YouTube (and Gmail/GBP) connect; tokens stored. |
| Instagram ingest     | ✅     | Cron calls Graph API, writes to `ingested_posts` in Supabase. No UI/API to read them yet. |
| Facebook ingest      | ❌     | Not implemented (only Instagram in cron). |
| Show ingested in UI  | ❌     | No backend GET for ingested_posts; no frontend view. |
| Publish to FB/IG     | ❌     | Backend only simulates; no Graph API / Content Publishing calls. |
| Publish to Google    | ❌     | No YouTube (or other) upload implementation. |

---

## 5. Checklist to get real data and upload from Facebook, Google, Instagram

1. **OAuth from Vercel**  
   - Use Railway URL for OAuth: in the Connect Account dialog, call `VITE_API_BASE_PATH` + `/oauth/...` (e.g. via `platformRequest` or a shared API base) instead of `fetch('/api/oauth/...')`.

2. **Social accounts from Supabase**  
   - On startup (or on first request), load `social_accounts` from Supabase into the in-memory Map (or serve GET /api/social-accounts from Supabase when configured) so connected accounts persist across restarts and show in the app.

3. **Expose ingested posts**  
   - **Done:** `GET /api/ingested-posts` reads from Supabase `ingested_posts` (query: `brandId` from `x-brand-id`, `platform`, `limit`). Frontend: `ingestedPostsApi.list()` and `useIngestedPosts(params)` in `api-services.ts` / `use-api.ts`.  
   - **Optional:** Add a small “Ingested” or “From Instagram” view in the app that uses `useIngestedPosts()` so users see real data from Instagram.

4. **Real publish to Facebook**  
   - In `POST /api/posts/:id/publish` (or a dedicated publish path), for `platform === 'facebook'`: get Page access token from `social_accounts`, call Graph API `POST /v18.0/{page-id}/feed` with message and optional media. Handle errors and store `publishedId` / `publishedUrl` on the post.

5. **Real publish to Instagram**  
   - For `platform === 'instagram'`: use Instagram Content Publishing API (create container with image/video URL, then publish). Use token from `social_accounts` (Instagram Business Account). Map post content and media to container fields; then mark post as published and store external id/url.

6. **Real “upload” for Google**  
   - Clarify product: e.g. “upload to YouTube” → implement upload via YouTube Data API with existing Google OAuth. If “upload” means something else (e.g. Gmail, GBP), implement the corresponding API.

7. **Optional: Facebook ingest**  
   - Add a similar cron (or extend existing) to fetch Page posts via Graph API and upsert into `ingested_posts` (or a dedicated table) so “real data” includes Facebook as well.

---

## 6. Quick reference

- **Frontend API base:** `src/sdk/core/request.ts` — `VITE_API_BASE_PATH` or `/api`.  
- **Backend:** `server/src/server.ts` — in-memory stores, OAuth routes, `/api/cron/ingest`.  
- **Supabase usage:** `server/src/supabase.ts` — OAuth state, social_accounts upsert, Instagram ingest upsert to `ingested_posts`.  
- **OAuth callback URLs (production):**  
  - Google: `https://<railway-host>/api/oauth/google/callback`  
  - Meta: `https://<railway-host>/api/oauth/meta/callback`  
  Set these in Google Cloud Console and Meta App settings, and set `GOOGLE_OAUTH_REDIRECT_BASE` / `META_OAUTH_REDIRECT_BASE` to the same Railway URL.
