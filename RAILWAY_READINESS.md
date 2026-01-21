# Railway Deployment Readiness Checklist

## ✅ Verified Railway Compatibility

### Server Configuration
- ✅ **PORT binding**: Server uses `process.env.PORT || 8080` (Railway provides PORT automatically)
- ✅ **Host binding**: Server binds to `0.0.0.0` (required for Railway external access)
- ✅ **Health endpoint**: `/api/health` exists and returns `{"ok":true,"time":"...","version":"1.0.0"}`
- ✅ **Build process**: `npm run build` compiles TypeScript to `dist/index.js`
- ✅ **Start command**: `npm start` runs `node dist/index.js` (Railway auto-detects)

### API Endpoints
- ✅ **90+ route handlers** implemented covering all major features:
  - Posts API (CRUD, publish, approve)
  - Campaigns API
  - Social Accounts API
  - OAuth connections (Google, Meta)
  - Autopilot settings
  - Assets/Uploads
  - Events
  - Brands
  - Email integration
  - Schedule templates
  - Calendar
  - WebSocket support (`/ws`)

### WebSocket Support
- ✅ WebSocket server runs on same port as HTTP server
- ✅ Path: `/ws`
- ✅ Broadcasts real-time events (post_created, post_updated, publish_job_updated, etc.)

## Required Environment Variables

Set these in Railway dashboard → Variables tab:

### Core Configuration
```bash
NODE_ENV=production
```

### OAuth Configuration (Required for OAuth features)

**Google OAuth:**
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_OAUTH_REDIRECT_BASE=https://your-railway-service.up.railway.app
```

**Meta OAuth (Facebook/Instagram):**
```bash
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_OAUTH_REDIRECT_BASE=https://your-railway-service.up.railway.app
```

**Note**: Railway automatically provides `PORT` - do NOT set it manually.

## Deployment Steps

1. **Create Railway Project**
   - Go to https://railway.app/new
   - Select "Deploy from GitHub repo"
   - Choose your Hostess repository

2. **Configure Service**
   - **Root Directory**: `server`
   - **Start Command**: (auto-detected) `npm start`
   - Railway will run:
     - `npm ci` (install dependencies)
     - `npm run build` (compile TypeScript)
     - `npm start` (start server)

3. **Set Environment Variables**
   - Go to Variables tab in Railway dashboard
   - Add all required variables listed above
   - **Important**: Set `GOOGLE_OAUTH_REDIRECT_BASE` and `META_OAUTH_REDIRECT_BASE` to your Railway service URL (e.g., `https://hostess-production.up.railway.app`)

4. **Deploy**
   - Railway automatically deploys on git push
   - Monitor logs in Railway dashboard
   - Verify health: `https://your-service.up.railway.app/api/health`

5. **Verify Deployment**
   - Health check: `curl https://your-service.up.railway.app/api/health`
   - Should return: `{"ok":true,"time":"...","version":"1.0.0"}`
   - Check Railway logs for: `🚀 Backend shim running on http://0.0.0.0:PORT`

## Current Limitations (MVP)

### In-Memory Storage
- **Current**: All data (posts, campaigns, accounts, etc.) stored in-memory
- **Impact**: Data is lost on server restart
- **Future**: Migrate to Railway Postgres for persistent storage
- **Workaround for MVP**: Acceptable for demo/testing; not production-ready for real data

### File Uploads
- **Current**: Files stored in `uploads/` directory (ephemeral on Railway)
- **Future**: Migrate to Railway Volume or S3/Cloud Storage for persistent file storage

### OAuth State Storage
- **Current**: In-memory Map (lost on restart)
- **Future**: Use Railway Redis or Postgres for OAuth state persistence

## Testing Railway Deployment

1. **Health Check**
   ```bash
   curl https://your-service.up.railway.app/api/health
   ```

2. **Test API Endpoint**
   ```bash
   curl https://your-service.up.railway.app/api/posts
   ```

3. **Test WebSocket** (use browser console or WebSocket client)
   ```javascript
   const ws = new WebSocket('wss://your-service.up.railway.app/ws');
   ws.onopen = () => console.log('Connected');
   ```

## Troubleshooting

### Server won't start
- Check Railway logs for TypeScript compilation errors
- Verify `npm run build` succeeds locally
- Ensure `dist/index.js` exists after build

### Health check fails
- Verify PORT is set (Railway provides automatically)
- Check server logs for binding errors
- Ensure server binds to `0.0.0.0` (not `localhost`)

### OAuth redirects fail
- Verify `GOOGLE_OAUTH_REDIRECT_BASE` and `META_OAUTH_REDIRECT_BASE` match your Railway service URL
- Check OAuth provider console for allowed redirect URIs
- Ensure HTTPS is used (Railway provides SSL automatically)

### WebSocket connection fails
- Verify WebSocket path is `/ws`
- Check Railway logs for WebSocket connection errors
- Ensure client uses `wss://` (secure WebSocket) for Railway deployment

## Next Steps for Production

1. **Add Railway Postgres**
   - Create Postgres service in Railway
   - Set `DATABASE_URL` environment variable
   - Migrate in-memory stores to database

2. **Add Railway Redis** (optional, for OAuth state)
   - Create Redis service in Railway
   - Replace in-memory OAuth state Map with Redis

3. **Add File Storage**
   - Use Railway Volume for persistent uploads, OR
   - Integrate S3/Cloud Storage for file uploads

4. **Add Monitoring**
   - Set up Railway metrics/alerts
   - Add application logging (e.g., Sentry)

## Summary

✅ **Server is Railway-ready** for MVP deployment:
- Correct PORT and host binding
- Health endpoint exists
- Build process works
- All API endpoints implemented
- WebSocket support included

⚠️ **Limitations to address for production**:
- In-memory storage (data lost on restart)
- Ephemeral file uploads
- OAuth state in-memory

🚀 **Ready to deploy** - Follow deployment steps above and set required environment variables.
