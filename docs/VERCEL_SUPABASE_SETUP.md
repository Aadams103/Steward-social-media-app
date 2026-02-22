# Vercel + Supabase Setup (Steward Social Media App)

This app uses Supabase from the browser. Vite only exposes environment variables prefixed with `VITE_`.

## Required environment variables (Vercel)

Set these in **Vercel → Project → Settings → Environment Variables**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Targets:
- ✅ Production (required)
- ✅ Preview (recommended)

After changing env vars, **redeploy** the latest Production deployment.

## Where to get values (Supabase)

Go to **Supabase → Steward-prod → Settings → API** and copy:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon public key** → `VITE_SUPABASE_ANON_KEY`

⚠️ Do NOT use `service_role` in any frontend env var. It must never be exposed to the browser.

## Local development

Create `.env` at the project root (or use `.env.local`) based on `.env.example`:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Restart the dev server after changing env vars.

## Verification checklist

After redeploying production, open:
https://hostess-social-media-app.vercel.app

Confirm:

- No "Missing Supabase configuration" screen
- No console error: supabaseUrl is required
- No Supabase config warnings in the console
- App renders normally (auth may still be unauthenticated depending on your auth flow)
