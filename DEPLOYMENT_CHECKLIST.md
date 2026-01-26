# Deployment Checklist

Use this checklist to ensure a smooth deployment to Railway, Render, or Vercel.

## Pre-Deployment

- [ ] **Code is committed and pushed to GitHub**
  ```bash
  git add .
  git commit -m "Ready for deployment"
  git push
  ```

- [ ] **Backend builds successfully locally**
  ```bash
  cd server
  npm install
  npm run build
  # Should create dist/index.js
  ```

- [ ] **Frontend builds successfully locally**
  ```bash
  npm install
  npm run build
  # Should create dist/ folder
  ```

- [ ] **TypeScript compiles without errors**
  ```bash
  npm run check
  # Should pass with 0 errors
  ```

- [ ] **Backend starts locally**
  ```bash
  cd server
  npm start
  # Should see: "🚀 Backend shim running on http://0.0.0.0:8080"
  ```

## Railway Deployment

### Backend Service

- [ ] **Created Railway project from GitHub repo**
- [ ] **Set Root Directory to `server`**
- [ ] **Verified Start Command is `npm start`** (auto-detected)
- [ ] **Set environment variables:**
  - [ ] `NODE_ENV=production`
  - [ ] (Optional) OAuth credentials if needed
- [ ] **Deployment succeeded** (check logs)
- [ ] **Got backend URL** (e.g., `https://hostess-production.up.railway.app`)
- [ ] **Tested health endpoint:**
  ```bash
  curl https://your-backend-url.up.railway.app/api/health
  ```
  Should return: `{"ok":true,"time":"...","version":"1.0.0"}`

### Database (Optional - for real data)

- [ ] **Added Postgres database** in Railway
- [ ] **Verified `DATABASE_URL` is set automatically**
- [ ] **Noted**: Backend still uses in-memory storage (needs code update)

### Frontend Service

- [ ] **Chose deployment platform:**
  - [ ] Railway Static Site, OR
  - [ ] Vercel (recommended)
- [ ] **Set environment variables:**
  - [ ] `VITE_API_BASE_PATH=https://your-backend-url.up.railway.app/api`
  - [ ] `VITE_WS_BASE_URL=wss://your-backend-url.up.railway.app/ws`
- [ ] **Deployment succeeded**
- [ ] **Got frontend URL**

## Render Deployment

### Backend Service

- [ ] **Created Web Service** from GitHub repo
- [ ] **Set Root Directory to `server`**
- [ ] **Set Build Command:** `npm install && npm run build`
- [ ] **Set Start Command:** `npm start`
- [ ] **Set environment variables** (same as Railway)
- [ ] **Deployment succeeded**
- [ ] **Got backend URL** (e.g., `https://hostess-backend.onrender.com`)

### Frontend Service

- [ ] **Created Static Site** from GitHub repo
- [ ] **Set Build Command:** `npm install && npm run build`
- [ ] **Set Publish Directory:** `dist`
- [ ] **Set environment variables** (same as Railway)
- [ ] **Deployment succeeded**

## Post-Deployment Verification

- [ ] **Frontend loads** (no white screen)
- [ ] **Backend API responds:**
  ```bash
  curl https://your-backend-url/api/health
  ```
- [ ] **Frontend can connect to backend:**
  - Open browser DevTools → Network tab
  - Check for API calls to `/api/*`
  - Verify no CORS errors
- [ ] **WebSocket connection works:**
  - Open browser console
  - Check for WebSocket connection in Network tab
  - Verify `wss://` (secure WebSocket) is used
- [ ] **Can create a post** (test basic functionality)
- [ ] **Real-time updates work** (if applicable)

## Common Issues & Fixes

### Issue: Backend won't start
- [ ] Check Railway/Render logs
- [ ] Verify `npm run build` works locally
- [ ] Ensure `dist/index.js` exists
- [ ] Check PORT is set (auto-provided by platform)

### Issue: Frontend can't connect to backend
- [ ] Verify `VITE_API_BASE_PATH` is correct
- [ ] Check backend URL is accessible (test health endpoint)
- [ ] Verify CORS is enabled (already configured in backend)
- [ ] Check browser console for errors

### Issue: WebSocket connection fails
- [ ] Verify `VITE_WS_BASE_URL` uses `wss://` (not `ws://`)
- [ ] Check backend WebSocket path is `/ws`
- [ ] Test WebSocket in browser console:
  ```javascript
  const ws = new WebSocket('wss://your-backend-url/ws');
  ws.onopen = () => console.log('Connected');
  ws.onerror = (e) => console.error('Error', e);
  ```

### Issue: Data resets on restart
- [ ] **Expected behavior** with in-memory storage
- [ ] **Solution**: Add Postgres database and update backend code

## Next Steps After Deployment

- [ ] **Add Postgres database** for data persistence
- [ ] **Update backend** to use Postgres instead of in-memory Maps
- [ ] **Set up OAuth credentials** for social platform connections
- [ ] **Configure custom domain** (optional)
- [ ] **Set up monitoring/alerts** (Railway/Render provide basic metrics)
- [ ] **Test all features** with real data

## Quick Test Commands

```bash
# Test backend health
curl https://your-backend-url/api/health

# Test API endpoint
curl https://your-backend-url/api/posts

# Test WebSocket (in browser console)
const ws = new WebSocket('wss://your-backend-url/ws');
ws.onopen = () => console.log('✅ WebSocket connected');
ws.onmessage = (e) => console.log('📨 Message:', e.data);
```

---

**Deployment Complete!** 🎉

Your app is now live and ready for real data. Next step: Add Postgres database for data persistence.
