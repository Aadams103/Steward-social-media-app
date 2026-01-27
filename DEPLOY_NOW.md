# 🚀 Deploy Now - Step by Step

Follow these steps to deploy your app to Railway (backend) and Vercel (frontend).

## ✅ Pre-Deployment Checklist

- [x] Backend builds successfully
- [x] Frontend builds successfully  
- [x] Deployment files committed
- [ ] Code pushed to GitHub
- [ ] Railway account created
- [ ] Vercel account created

---

## Step 1: Push to GitHub

**Run this command:**
```powershell
git push
```

If you get an error about upstream, run:
```powershell
git push -u origin main
```

---

## Step 2: Deploy Backend to Railway

### 2.1 Create Railway Account
1. Go to: **https://railway.app**
2. Click **"Start a New Project"** or **"Login"**
3. Sign up with GitHub (recommended)

### 2.2 Deploy from GitHub
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. **Authorize Railway** to access your GitHub (if first time)
4. **Select your Steward repository**

### 2.3 Configure Backend Service
1. Railway will detect it's a Node.js project
2. Click on the service to open settings
3. Go to **Settings** tab:
   - **Root Directory**: Type `server` (important!)
   - **Start Command**: Should auto-detect `npm start` (verify it's there)
4. Go to **Variables** tab:
   - Click **"+ New Variable"**
   - **Name**: `NODE_ENV`
   - **Value**: `production`
   - Click **"Add"**

### 2.4 Wait for Deployment
- Railway will automatically:
  - Install dependencies (`npm ci`)
  - Build TypeScript (`npm run build`)
  - Start the server (`npm start`)
- Watch the **Deployments** tab for progress
- Wait for status to show **"Active"** (green)

### 2.5 Get Your Backend URL
1. Go to **Settings** tab
2. Scroll to **"Networking"** section
3. Click **"Generate Domain"** (if not already generated)
4. **Copy the URL** (e.g., `https://steward-production.up.railway.app`)
5. **Save this URL** - you'll need it for the frontend!

### 2.6 Test Backend
Open a new PowerShell window and run:
```powershell
curl https://your-backend-url.up.railway.app/api/health
```

You should see: `{"ok":true,"time":"...","version":"1.0.0"}`

**✅ Backend is live!**

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account
1. Go to: **https://vercel.com**
2. Click **"Sign Up"** or **"Login"**
3. Sign up with GitHub (recommended)

### 3.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. **Import** your Steward GitHub repository
3. Click **"Import"**

### 3.3 Configure Frontend
1. **Framework Preset**: Should auto-detect **Vite** (verify)
2. **Root Directory**: Leave empty (root is correct)
3. **Build Command**: Should be `npm run build` (verify)
4. **Output Directory**: Should be `dist` (verify)

### 3.4 Set Environment Variables
1. Scroll down to **"Environment Variables"** section
2. Click **"+ Add"** for each variable:

   **Variable 1:**
   - **Name**: `VITE_API_BASE_PATH`
   - **Value**: `https://your-backend-url.up.railway.app/api`
     *(Replace `your-backend-url` with your Railway URL from Step 2.5)*
   - **Environments**: Check all (Production, Preview, Development)
   - Click **"Save"**

   **Variable 2:**
   - **Name**: `VITE_WS_BASE_URL`
   - **Value**: `wss://your-backend-url.up.railway.app/ws`
     *(Same URL, but with `wss://` and `/ws` path)*
   - **Environments**: Check all
   - Click **"Save"**

### 3.5 Deploy
1. Click **"Deploy"** button
2. Wait for build to complete (1-2 minutes)
3. Vercel will show you the deployment URL

### 3.6 Get Your Frontend URL
- Vercel provides a URL like: `https://steward-xyz.vercel.app`
- **Save this URL**

**✅ Frontend is live!**

---

## Step 4: Test Everything

### 4.1 Test Frontend
1. Open your Vercel URL in a browser
2. Check browser console (F12) for errors
3. Try creating a post to test API connection

### 4.2 Test Backend Connection
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try creating a post in the app
4. Look for API calls to `/api/*`
5. Verify they're going to your Railway backend URL

### 4.3 Test WebSocket
1. Open browser console (F12)
2. Run this command:
   ```javascript
   const ws = new WebSocket('wss://your-backend-url.up.railway.app/ws');
   ws.onopen = () => console.log('✅ WebSocket connected');
   ws.onerror = (e) => console.error('❌ Error', e);
   ```
3. Should see: `✅ WebSocket connected`

---

## ✅ Deployment Complete!

Your app is now live:
- **Backend**: `https://your-backend-url.up.railway.app`
- **Frontend**: `https://your-frontend-url.vercel.app`

---

## 🎯 Next Steps

1. **Add Postgres Database** (for real data persistence):
   - In Railway dashboard → **"+ New"** → **"Database"** → **"Add Postgres"**
   - Railway automatically sets `DATABASE_URL` environment variable
   - **Note**: You'll need to update backend code to use Postgres (see DEPLOYMENT_GUIDE.md)

2. **Test with Real Data**:
   - Create posts, campaigns, etc.
   - **Note**: Data will reset on server restart until you add Postgres

3. **Add OAuth Credentials** (for social platform connections):
   - In Railway Variables tab, add:
     - `GOOGLE_CLIENT_ID=...`
     - `GOOGLE_CLIENT_SECRET=...`
     - `META_APP_ID=...`
     - `META_APP_SECRET=...`

---

## 🆘 Troubleshooting

### Backend won't start
- Check Railway **Deployments** tab → **View Logs**
- Verify Root Directory is set to `server`
- Check that `dist/index.js` exists after build

### Frontend can't connect to backend
- Verify `VITE_API_BASE_PATH` is correct in Vercel
- Check backend URL is accessible (test health endpoint)
- Check browser console for CORS errors

### WebSocket connection fails
- Verify `VITE_WS_BASE_URL` uses `wss://` (not `ws://`)
- Check Railway logs for WebSocket errors

---

**Need more help?** See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for detailed troubleshooting.
