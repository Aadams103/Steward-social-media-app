# Railway Deployment Guide

**Quick reference** - For complete deployment guide, see [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md)

## Railway backend (monorepo)

This repository contains multiple apps (frontend + backend). For the **backend** service only:

- Set Railway **Root Directory** to **`server`** (in the service Settings). No code change can override a wrong dashboard value.
- Use **`server/railway.toml`** for build/start/healthcheck. If the UI offers a config file path, set it to `server/railway.toml`.
- Do **not** set custom Build or Start commands in the dashboard; let `server/railway.toml` define them.
- Node version should be **22+** (see `server/package.json` engines).

## Quick Start

1. **Go to Railway**: https://railway.app/new
2. **Deploy from GitHub repo** → Select your Steward repository
3. **Configure:**
   - **Root Directory**: `server`
   - **Start Command**: (auto-detected) `npm start`
4. **Set Environment Variables:**
   - `NODE_ENV=production`
5. **Deploy** - Railway handles the rest!

## Verify Deployment

```bash
curl https://your-service.up.railway.app/api/health
# Should return: {"ok":true,"time":"...","version":"1.0.0"}
```

## Add Postgres Database (For Real Data)

1. In Railway dashboard → **"+ New"** → **"Database"** → **"Add Postgres"**
2. Railway automatically sets `DATABASE_URL` environment variable
3. **Note**: Backend code still uses in-memory storage - you'll need to update it to use Postgres

## Frontend Deployment

Deploy frontend separately:
- **Vercel** (recommended): https://vercel.com/new
- **Railway Static**: Add new service → Static Site

Set environment variables:
- `VITE_API_BASE_PATH=https://your-backend-url.up.railway.app/api`
- `VITE_WS_BASE_URL=wss://your-backend-url.up.railway.app/ws`

## Full Documentation

See [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) for:
- Complete step-by-step instructions
- Render, Vercel, Supabase alternatives
- Database setup with Prisma
- Troubleshooting guide
- Environment variables reference
