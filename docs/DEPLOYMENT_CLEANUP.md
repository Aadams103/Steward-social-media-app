# Deployment cleanup – One production backend

You have **one Vercel production** (`steward-social-media`) and **many Railway services** from earlier attempts. Use one Railway backend for production and remove the rest.

---

## 1. Which Railway service is production?

**Keep the service whose URL is in Vercel Production env:**

- In **Vercel** → your project → **Settings** → **Environment Variables** (Production)
- Note the host in `VITE_API_BASE_PATH`, e.g. `https://stunning-emotion-production-xxxx.up.railway.app` or `https://steward-backend-production-xxxx.up.railway.app`

That host is your **production backend**. The Railway service that serves it is the one to keep.

From your list, the most recent successful deploy for the Steward work is:

- **stunning-emotion / production** (edfef66, 8 hours ago)

If `VITE_API_BASE_PATH` and `VITE_WS_BASE_URL` in Vercel Production point to that service’s URL, treat **stunning-emotion** as production and remove the others.

---

## 2. Remove extra Railway services

In **Railway** → each **project**:

1. Open the project (e.g. scintillating-caring, pleasant-youthfulness, heroic-expression, etc.).
2. For each **service** that is **not** your chosen production backend:
   - Open the service → **Settings** → **Danger** (or similar) → **Remove service** / **Delete**.
3. Optional: delete **entire projects** you no longer use (after removing or migrating any needed services).

**Candidates to remove** (after you confirm they are not used by Vercel or anything else):

- heroic-expression  
- scintillating-caring  
- pleasant-youthfulness (only if it’s not the one in Vercel)  
- precious-tenderness  
- renewed-rejoicing  
- peaceful-tranquility  
- reasonable-manifestation  
- alluring-acceptance  
- noble-achievement  
- Hostess app (legacy name)

**Keep:** the single project/service that provides the URL in `VITE_API_BASE_PATH` / `VITE_WS_BASE_URL` for Vercel Production.

---

## 3. Rename the kept Railway project (optional)

To match the app name:

1. Railway project → **Settings** → **Project name**  
2. Set to e.g. **steward-social-media-app** (or **steward-backend**).

The public URL usually stays the same unless you change the service’s domain.

---

## 4. Check Vercel → Railway wiring

**Vercel Production must have:**

| Variable               | Example (replace with your real Railway URL)        |
|------------------------|-----------------------------------------------------|
| `VITE_API_BASE_PATH`   | `https://<your-railway-service>.up.railway.app/api` |
| `VITE_WS_BASE_URL`     | `wss://<your-railway-service>.up.railway.app/ws`    |

**Test:**

```bash
# 1) Health from backend
curl -s "https://<your-railway-service>.up.railway.app/api/health"
# Expect: {"ok":true,"time":"...","version":"1.0.0"}

# 2) Load the Vercel app and try login / API actions
# If 401 or CORS, check Vercel env and Railway CORS/config.
```

---

## 5. Target state

| Platform | Role        | What to have                          |
|----------|-------------|----------------------------------------|
| **Vercel** | Frontend  | 1 project, e.g. `steward-social-media`, Production from `main` |
| **Railway** | Backend   | 1 project, 1 service; env `NODE_ENV=production`, Root Directory `server`, health `/api/health` |
| **Supabase** | DB/Auth  | 1 project when you turn on DB/Auth    |

---

## 6. If Vercel build fails

Your “Update branding, settings, design system, and UI components” (7b527f7) deploy failed on both Vercel and Railway. The later **edfef66** (“Steward: Vercel + Railway + Supabase deploy, rebrand, OAuth/ingest”) is the one that **succeeded** on:

- Vercel Production  
- Railway (stunning-emotion)

Stick with **edfef66** (and newer) for production. You can stop redeploying **7b527f7** and avoid re-adding those older services.
