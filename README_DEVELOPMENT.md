# Hostess Social Media App - Development Guide

## Local Development Setup

### Prerequisites
- Node.js 18+
- npm

### Step 1: Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Step 2: Start Backend Server

```bash
cd server
npm run dev
```

Backend runs on `http://localhost:8080`
WebSocket runs on `ws://localhost:8080/ws`

### Step 3: Start Frontend

In a new terminal:

```bash
npm run dev
```

Frontend runs on `http://localhost:5000`

### Step 4: Verify Connection

1. Open browser to `http://localhost:5000`
2. Check browser console for WebSocket connection status
3. Verify API calls are proxied to backend (check Network tab)

## Environment Variables

Create `.env` file in root:

```env
VITE_API_BASE_PATH=/api
VITE_WS_BASE_URL=ws://localhost:8080/ws
VITE_MCP_API_BASE_PATH=/api/mcp
```

## Testing the Vertical Slice

### Manual Test Flow

1. **Create a Post**
   - Navigate to posts/compose page
   - Create a new post
   - Verify it appears in posts list

2. **Approve Post**
   - Click approve on a post
   - Verify status changes to "approved"

3. **Publish Post**
   - Click publish button
   - This creates a publish job

4. **Watch Real-time Updates**
   - Job status should update automatically:
     - `queued` → `publishing` (after 2s)
     - `publishing` → `completed` (after 4s)
   - No page refresh needed

5. **Verify Persistence**
   - Refresh page
   - Post should still exist (in-memory for now)

## Backend Endpoints

See `server/README.md` for full API documentation.

Key endpoints:
- `GET /api/posts` - List posts
- `POST /api/posts` - Create post
- `POST /api/posts/:id/publish` - Publish post (creates job)
- `GET /api/publish-jobs` - List jobs
- `GET /api/publish-jobs/:id` - Get job status

## WebSocket Events

The backend broadcasts:
- `post_created`
- `post_updated`
- `post_published`
- `publish_job_updated`

## RUNBOOK - Phase 0 Verification Checklist

### Phase 0 Goal
App reliably renders locally without white screen before any migration work continues.

### Verification Steps

#### 1. Start Backend Server

```bash
cd server
npm install  # If not already installed
npm run dev
```

**Expected Output:**
```
🚀 Backend shim running on http://localhost:8080
📡 WebSocket server running on ws://localhost:8080/ws
📊 Posts: 0, Jobs: 0
```

**Verify:**
- Server starts without errors
- Port 8080 is accessible
- Health check works: `curl http://localhost:8080/health` should return `{"status":"ok",...}`

#### 2. Start Frontend

In a new terminal (from project root):

```bash
npm install  # If not already installed
npm run dev
```

**Expected Output:**
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5000/
  ➜  Network: use --host to expose
```

**Verify:**
- Vite starts without errors
- No compilation errors in terminal
- URL shows in terminal output

#### 3. Open Browser and Check for White Screen

1. **Open Browser**: Navigate to `http://localhost:5000`
2. **Check Console**: Open DevTools (F12) → Console tab

**Expected:**
- ✅ No red errors in console
- ✅ App UI renders (should see sidebar and main content area)
- ✅ NOT a blank white screen

**If you see errors:**
- Check Network tab for 404s
- Check for authentication errors (should not appear in dev mode)
- Check for React mount errors

#### 4. Verify Home Route Renders

**What to Click:**
- Click on "Dashboard" in sidebar (should already be active)

**Expected Result:**
- ✅ Dashboard view renders with UI elements (even if data is empty)
- ✅ No white screen
- ✅ No React errors

#### 5. Verify "Vertical Slice (Test)" Renders

**What to Click:**
- Click on "Vertical Slice (Test)" in sidebar (or navigate to that view)

**Expected Result:**
- ✅ "Posts Vertical Slice" page renders
- ✅ Shows "Create Post" form
- ✅ Shows "Posts" list (may be empty)
- ✅ Shows "Publish Jobs" list (may be empty)
- ✅ Shows WebSocket connection status badge

**Functional Test:**
1. Type some content in the "Content" textarea
2. Select a platform (e.g., "Facebook")
3. Click "Create Post"
4. ✅ Post should appear in the Posts list
5. ✅ Status should show "draft"
6. ✅ No console errors

#### 6. Verify ErrorBoundary Works

**Test:**
- If an error occurs, you should see an ErrorBoundary overlay with:
  - "Something went wrong" message
  - Error details
  - "Reload" button
  - "Close" button
- ✅ ErrorBoundary shows readable error instead of white screen

#### 7. Verify No Critical 404s

**What to Check:**
- Open DevTools → Network tab
- Filter by "Failed" or check status codes
- Refresh page (F5)

**Expected:**
- ✅ No 404 for runtime scripts
- ✅ No 404 for entry JS files (`/src/main.tsx`, etc.)
- ✅ No 404 for CSS files
- ✅ API calls to `/api/*` may return empty arrays (this is expected for stubs)

#### 8. Verify API Calls Work (Even If Empty)

**What to Check:**
- Open DevTools → Network tab
- Filter by "XHR" or "Fetch"
- Refresh page or navigate to "Vertical Slice"

**Expected:**
- ✅ `GET /api/posts` returns `{"posts":[],"total":0}` (status 200)
- ✅ `GET /api/publish-jobs` returns `{"jobs":[],"total":0}` (status 200)
- ✅ `GET /api/campaigns` returns `{"campaigns":[],"total":0}` (status 200)
- ✅ No authentication errors (dev mode should skip auth)

### Definition of Done ✅

Phase 0 is complete when:
- [x] Home route renders UI (not blank)
- [x] "Vertical Slice (Test)" renders and is usable
- [x] No 404 for critical scripts
- [x] ErrorBoundary shows a readable message if something breaks
- [x] Can create a post in Vertical Slice view
- [x] No white screen on any route

### Common Issues and Fixes

#### White Screen Still Appears
1. **Check console for React errors**
   - Look for "Cannot read property of undefined"
   - Look for "Element type is invalid"
   - Check for import errors

2. **Check if React is mounting**
   - Verify `#app` element exists in `index.html`
   - Verify `main.tsx` is called and ReactDOM.createRoot is executed
   - Add `console.log` in `main.tsx` to verify execution

3. **Check for TypeScript errors**
   - Run `npm run check` to find type errors
   - Fix any type errors that prevent compilation

#### API Calls Failing
1. **Check backend is running**
   - Verify `http://localhost:8080/health` works
   - Check backend terminal for errors

2. **Check CORS**
   - Backend should have CORS enabled (it does)
   - Check Network tab for CORS errors

3. **Check proxy config**
   - Verify `vite.config.js` has proxy: `{ '/api': { target: 'http://localhost:8080' } }`

#### WebSocket Not Connecting
- Check `useRealtime` hook is not throwing errors
- Verify backend WebSocket server is running
- Check browser console for WebSocket connection errors
- **Note**: WebSocket errors should not cause white screen (they're non-blocking)

---

## Troubleshooting

### Backend won't start
- Check port 8080 is available
- Verify `server/node_modules` exists
- Check TypeScript compilation errors
- Run `cd server && npm install` if dependencies missing

### Frontend can't connect
- Verify backend is running on port 8080
- Check Vite proxy config in `vite.config.js` (should proxy `/api` to `http://localhost:8080`)
- Verify environment variables (not required for dev, but check if set)
- Check browser console for connection errors

### WebSocket not connecting
- Check `VITE_WS_BASE_URL` in `.env` (not required for dev)
- Verify backend WebSocket server is running (should see WebSocket log on backend start)
- Check browser console for connection errors
- **Note**: WebSocket errors should not block app rendering

### White Screen Issues
- Check browser console for React errors
- Verify `#app` element exists in DOM (`document.getElementById('app')`)
- Check for import/module resolution errors
- Verify all dependencies are installed (`npm install`)
- Clear browser cache and hard refresh (Ctrl+Shift+R)
