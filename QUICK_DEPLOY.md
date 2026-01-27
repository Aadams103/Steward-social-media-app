# 🚀 Quick Deploy to Railway

**Get your app live in 5 minutes!**

## Step 1: Push to GitHub

```bash
git add .
git commit -m "Ready for Railway deployment"
git push
```

## Step 2: Deploy Backend

1. Go to: **https://railway.app/new**
2. Click **"Deploy from GitHub repo"**
3. Select your **Steward repository**
4. In the service settings:
   - **Root Directory**: `server`
   - **Start Command**: (auto-detected) `npm start`
5. Go to **Variables** tab → Add:
   ```
   NODE_ENV=production
   ```
6. **Copy your backend URL** (e.g., `https://steward-production.up.railway.app`)

## Step 3: Deploy Frontend (Vercel)

1. Go to: **https://vercel.com/new**
2. **Import** your GitHub repository
3. **Configure:**
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Environment Variables:**
   ```
   VITE_API_BASE_PATH=https://your-backend-url.up.railway.app/api
   VITE_WS_BASE_URL=wss://your-backend-url.up.railway.app/ws
   ```
   *(Replace `your-backend-url` with the URL from Step 2)*
5. **Deploy**

## Step 4: Test

1. **Backend health check:**
   ```bash
   curl https://your-backend-url.up.railway.app/api/health
   ```
   Should return: `{"ok":true,...}`

2. **Open your frontend URL** and test creating a post!

## ✅ Done!

Your app is now live! 🎉

**Next Steps:**
- Add Postgres database in Railway for real data persistence
- See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for full details

---

**Need help?** Check [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for troubleshooting.
