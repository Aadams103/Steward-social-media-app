# Steward Deployment Guide - Railway, Render, Vercel, Supabase

This guide covers deploying Steward to production platforms so you can start adding real data.

## 🎯 Recommended Setup: Railway (Full-Stack)

**Railway is recommended** because it:
- ✅ Supports Express backend with WebSocket
- ✅ Easy Postgres database integration (for real data)
- ✅ Automatic HTTPS/SSL
- ✅ Simple environment variable management
- ✅ Free tier available

---

## 🚀 Quick Start: Railway Deployment

### Step 1: Prepare Your Repository

1. **Ensure your code is on GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push
   ```

### Step 2: Deploy Backend to Railway

1. **Go to Railway**: https://railway.app/new
2. **Select "Deploy from GitHub repo"**
3. **Choose your Steward repository**
4. **Configure the service:**
   - **Root Directory**: `server`
   - **Start Command**: (auto-detected) `npm start`
   - Railway will automatically:
     - Run `npm ci` (install dependencies)
     - Run `npm run build` (compile TypeScript)
     - Run `npm start` (start server)

5. **Set Environment Variables** (in Railway dashboard → Variables tab):
   ```bash
   NODE_ENV=production
   ```
   
   **Optional (for OAuth features):**
   ```bash
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_OAUTH_REDIRECT_BASE=https://your-service.up.railway.app
   
   META_APP_ID=your_meta_app_id
   META_APP_SECRET=your_meta_app_secret
   META_OAUTH_REDIRECT_BASE=https://your-service.up.railway.app
   ```

6. **Get your backend URL:**
   - Railway provides a URL like: `https://steward-production.up.railway.app`
   - Copy this URL - you'll need it for the frontend

### Step 3: Add Postgres Database (For Real Data!)

1. **In Railway dashboard**, click **"+ New"** → **"Database"** → **"Add Postgres"**
2. **Railway automatically sets `DATABASE_URL`** environment variable
3. **Note**: You'll need to update your backend code to use Postgres (see "Adding Database Support" below)

### Step 4: Deploy Frontend

You have two options:

#### Option A: Vercel (Recommended for Frontend)

1. **Go to Vercel**: https://vercel.com/new
2. **Import your GitHub repository**
3. **Configure:**
   - **Framework Preset**: Vite
   - **Root Directory**: (leave empty - root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Set Environment Variables:**
   ```bash
   VITE_API_BASE_PATH=https://your-backend-url.up.railway.app/api
   VITE_WS_BASE_URL=wss://your-backend-url.up.railway.app/ws
   ```

5. **Deploy** - Vercel will build and deploy automatically

#### Option B: Railway Static (Alternative)

1. **In Railway**, add a new service
2. **Select "Static Site"**
3. **Configure:**
   - **Root Directory**: (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Set Environment Variables** (same as Vercel above)

### Step 5: Verify Deployment

1. **Test Backend Health:**
   ```bash
   curl https://your-backend-url.up.railway.app/api/health
   ```
   Should return: `{"ok":true,"time":"...","version":"1.0.0"}`

2. **Test Frontend:**
   - Open your frontend URL
   - Check browser console for errors
   - Try creating a post

---

## 🗄️ Adding Database Support (Postgres)

Currently, your backend uses in-memory storage. To persist data, you need to add Postgres:

### Quick Setup with Prisma (Recommended)

1. **Install Prisma:**
   ```bash
   cd server
   npm install prisma @prisma/client
   npm install -D prisma
   ```

2. **Initialize Prisma:**
   ```bash
   npx prisma init
   ```

3. **Update `server/prisma/schema.prisma`:**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }

   generator client {
     provider = "prisma-client-js"
   }

   model Post {
     id        String   @id @default(uuid())
     content   String
     status    String
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
     // Add other fields from your Post type
   }

   // Add other models (Campaign, SocialAccount, etc.)
   ```

4. **Run migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Update backend code** to use Prisma instead of in-memory Maps

**Note**: This is a larger task - you can deploy first with in-memory storage, then add Postgres later.

---

## 🔄 Alternative: Render Deployment

### Backend on Render

1. **Go to Render**: https://render.com
2. **New** → **Web Service**
3. **Connect your repository**
4. **Configure:**
   - **Name**: `steward-backend`
   - **Environment**: Node
   - **Build Command**: `cd server && npm install && npm run build`
   - **Start Command**: `cd server && npm start`
   - **Root Directory**: `server`

5. **Set Environment Variables** (same as Railway)

6. **Add Postgres Database:**
   - **New** → **PostgreSQL**
   - Render sets `DATABASE_URL` automatically

### Frontend on Render

1. **New** → **Static Site**
2. **Connect repository**
3. **Configure:**
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. **Set Environment Variables** (same as Vercel)

---

## ⚡ Alternative: Vercel (Serverless)

**Note**: Vercel uses serverless functions, which may not support WebSockets well. Consider this for frontend only.

### Frontend on Vercel

1. **Go to Vercel**: https://vercel.com/new
2. **Import repository**
3. **Configure:**
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Set Environment Variables:**
   ```bash
   VITE_API_BASE_PATH=https://your-backend-url/api
   ```

### Backend on Railway/Render

Deploy backend separately (Railway or Render) since Vercel serverless doesn't support WebSockets well.

---

## 🗄️ Supabase Integration

Supabase is great for database + auth. Here's how to integrate:

### Option 1: Use Supabase as Database Only

1. **Create Supabase project**: https://supabase.com
2. **Get connection string** from Settings → Database
3. **Set `DATABASE_URL`** in Railway/Render:
   ```bash
   DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
   ```
4. **Use Prisma** (as described above) to connect

### Option 2: Use Supabase for Auth + Database

1. **Install Supabase client:**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Replace authentication** in your app with Supabase Auth
3. **Use Supabase Postgres** for data storage

---

## 📋 Environment Variables Reference

### Backend (Railway/Render)

```bash
# Required
NODE_ENV=production

# Database (when you add Postgres)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# OAuth (optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_BASE=https://your-backend-url.up.railway.app

META_APP_ID=...
META_APP_SECRET=...
META_OAUTH_REDIRECT_BASE=https://your-backend-url.up.railway.app
```

### Frontend (Vercel/Render Static)

```bash
# Required - Point to your backend
VITE_API_BASE_PATH=https://your-backend-url.up.railway.app/api
VITE_WS_BASE_URL=wss://your-backend-url.up.railway.app/ws

# Optional
VITE_MCP_API_BASE_PATH=/api/mcp
```

---

## 🔍 Troubleshooting

### Backend won't start

- **Check logs** in Railway/Render dashboard
- **Verify** `npm run build` works locally
- **Ensure** `dist/index.js` exists after build
- **Check** PORT is set (Railway/Render provides automatically)

### Frontend can't connect to backend

- **Verify** `VITE_API_BASE_PATH` is set correctly
- **Check** CORS is enabled in backend (already configured)
- **Test** backend health endpoint manually
- **Check** browser console for CORS errors

### WebSocket connection fails

- **Verify** `VITE_WS_BASE_URL` uses `wss://` (secure WebSocket)
- **Check** Railway/Render supports WebSockets (Railway does, Render may need upgrade)
- **Test** WebSocket connection in browser console:
  ```javascript
  const ws = new WebSocket('wss://your-backend-url.up.railway.app/ws');
  ws.onopen = () => console.log('Connected');
  ws.onerror = (e) => console.error('Error', e);
  ```

### Data resets on restart

- **This is expected** with in-memory storage
- **Solution**: Add Postgres database (see "Adding Database Support" above)

---

## 🎯 Next Steps After Deployment

1. ✅ **Deploy backend** to Railway/Render
2. ✅ **Deploy frontend** to Vercel/Railway Static
3. ✅ **Add Postgres database** for data persistence
4. ✅ **Update backend** to use Postgres instead of in-memory storage
5. ✅ **Test** creating posts, campaigns, etc.
6. ✅ **Add OAuth** credentials for social platform connections
7. ✅ **Set up monitoring** (Railway/Render provide basic metrics)

---

## 💰 Cost Estimates

### Railway
- **Free tier**: $5 credit/month (good for testing)
- **Hobby**: $20/month (1 service + database)
- **Pro**: $100/month (unlimited services)

### Render
- **Free tier**: Available (with limitations)
- **Starter**: $7/month per service
- **Postgres**: $7/month (1GB storage)

### Vercel
- **Free tier**: Unlimited (great for frontend)
- **Pro**: $20/month (team features)

### Supabase
- **Free tier**: 500MB database, 2GB bandwidth
- **Pro**: $25/month (8GB database, 50GB bandwidth)

**Recommended for MVP**: Railway backend ($20/month) + Vercel frontend (free) = **$20/month total**

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

---

**Ready to deploy?** Start with Step 1 above! 🚀
