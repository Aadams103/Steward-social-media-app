# Railway Deployment Guide

Quick steps to deploy Hostess backend to Railway.

## Prerequisites

- Railway account (sign up at https://railway.app)
- GitHub repository with Hostess code

## Deployment Steps

1. **Create Railway project from GitHub repo**
   - Go to https://railway.app/new
   - Select "Deploy from GitHub repo"
   - Choose your Hostess repository

2. **Configure service**
   - Set **Root Directory** = `server`
   - Set **Start Command** (if needed) = `npm start`
   - Railway will auto-detect `package.json` scripts

3. **Set environment variables**
   - In Railway dashboard, go to Variables tab
   - Add: `NODE_ENV=production`
   - Add OAuth secrets later as needed (GOOGLE_CLIENT_ID, META_APP_ID, etc.)

4. **Deploy**
   - Railway will automatically:
     - Run `npm ci` to install dependencies
     - Run `npm run build` (if configured)
     - Run `npm start` to start the server
   - Railway provides `PORT` automatically (no need to set it)

5. **Verify deployment**
   - Open the service URL provided by Railway
   - Test health endpoint: `https://<service-url>/api/health`
   - Should return: `{"ok":true,"time":"...","version":"1.0.0"}`

## Notes

- Railway automatically sets `PORT` environment variable
- Backend binds to `0.0.0.0` to accept external connections
- Default port fallback is 8080 (only used if PORT not set)
- For production, add all required OAuth credentials in Variables tab
