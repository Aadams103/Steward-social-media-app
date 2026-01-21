# Hostess Social Media App - Setup Checklist

**Generated:** Today  
**Status:** Getting Started Guide

---

## 📋 Prerequisites

Before starting, ensure you have:
- [ ] **Node.js 18+** installed (check with `node --version`)
- [ ] **npm** installed (comes with Node.js, check with `npm --version`)
- [ ] **Two terminal windows** available (one for backend, one for frontend)
- [ ] **Ports 5000 and 8080** available (no other services using these ports)

---

## 🚀 Quick Start (Minimum Setup to Run)

### Step 1: Install Dependencies

**Frontend Dependencies:**
```bash
npm install
```

**Backend Dependencies:**
```bash
cd server
npm install
cd ..
```

✅ **Verify:** No errors during installation

---

### Step 2: Create Environment File (Optional but Recommended)

Create a `.env` file in the project root:

```env
VITE_API_BASE_PATH=/api
VITE_WS_BASE_URL=ws://localhost:8080/ws
VITE_MCP_API_BASE_PATH=/api/mcp
```

**Note:** Environment variables are optional for local development as the code has sensible defaults, but it's good practice to set them.

---

### Step 3: Start Backend Server

In terminal 1:
```bash
cd server
npm run dev
```

**Expected Output:**
```
🚀 Backend shim running on http://localhost:8080
📡 WebSocket server running on ws://localhost:8080/ws
📊 Posts: 0, Jobs: 0
```

✅ **Verify:**
- Server starts without errors
- Port 8080 is accessible
- WebSocket server is running

**Troubleshooting:**
- If port 8080 is in use, stop the conflicting service or change port in `server/src/index.ts` (line 1059)
- If TypeScript errors appear, run `cd server && npm install` again

---

### Step 4: Start Frontend Server

In terminal 2 (from project root):
```bash
npm run dev
```

**Expected Output:**
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5000/
  ➜  Network: use --host to expose
```

✅ **Verify:**
- Vite starts without errors
- No compilation errors in terminal
- URL shows in terminal output

**Troubleshooting:**
- If port 5000 is in use, Vite will automatically use the next available port
- If TypeScript errors appear, run `npm run check` to see specific errors
- If dependencies are missing, run `npm install` again

---

### Step 5: Open Browser and Verify

1. **Open Browser:** Navigate to `http://localhost:5000`
2. **Check Console:** Open DevTools (F12) → Console tab

✅ **Expected:**
- App UI renders (sidebar and main content area visible)
- No white screen
- No red errors in console
- Dashboard view is visible

**If you see errors:**
- Check Network tab for 404s
- Verify backend is running (check terminal 1)
- Check browser console for specific error messages

---

## ✅ Verification Tests

### Test 1: App Loads
- [ ] Open `http://localhost:5000`
- [ ] App UI renders (not blank white screen)
- [ ] Sidebar navigation is visible
- [ ] Dashboard view shows (even if empty)

### Test 2: Backend Connection
- [ ] Open DevTools → Network tab
- [ ] Refresh page (F5)
- [ ] See API calls to `/api/*` endpoints
- [ ] API calls return 200 status (even if empty data)

**Test manually:**
```bash
curl http://localhost:8080/api/posts
```
Should return: `{"posts":[],"total":0}`

### Test 3: WebSocket Connection
- [ ] Check browser console
- [ ] Look for WebSocket connection messages
- [ ] Check Network tab → WS filter
- [ ] Should see connection to `ws://localhost:8080/ws`

**Note:** WebSocket errors should not block app rendering

### Test 4: Vertical Slice Demo (Optional)
1. Navigate to "Vertical Slice (Test)" in sidebar (if available)
2. Create a test post
3. Verify it appears in the posts list
4. Check backend terminal for POST request log

---

## 📊 Current Implementation Status

### ✅ What's Working

**Backend (Fully Implemented):**
- ✅ Posts API (CRUD, approve, publish) - 7 endpoints
- ✅ Publish Jobs API (list, get, create, update, retry) - 5 endpoints
- ✅ Autopilot API (get, update settings) - 2 endpoints
- ✅ Organizations API (get current, list) - 2 endpoints
- ✅ WebSocket Server (real-time events)
- ✅ Campaigns API (CRUD) - 5 endpoints
- ✅ Social Accounts API (list, sync) - 2 endpoints

**Frontend (Partially Migrated):**
- ✅ DashboardView - Uses real API hooks
- ✅ ComposeView - Uses real API hooks
- ✅ PostsVerticalSlice - Working demo component
- ✅ API Service Layer - Complete definitions
- ✅ React Query Hooks - All hooks implemented
- ✅ Real-time Service - WebSocket integration
- ✅ Error Handling - Enhanced API client

### ⚠️ What's Partially Working

**Backend Stub Endpoints (Return Empty Data):**
- ⚠️ Conversations API - Only GET list (returns empty)
- ⚠️ Alerts API - Only GET list (returns empty)
- ⚠️ Scheduled Slots API - Only GET list (returns empty)
- ⚠️ Quota Usage API - Returns empty array
- ⚠️ Brand Profile API - Returns stub object

### ❌ What's Not Working / Missing

**Views Still Using Mock Data:**
- ❌ QueueView - Uses mock scheduledSlots
- ❌ CalendarView - Uses mock posts
- ❌ NotificationsView - Uses mock notifications
- ❌ InboxView - Uses mock conversations
- ❌ AnalyticsView - Uses mock data
- ❌ BrandProfileView - Uses mock brandProfile
- ❌ AccountsView - Uses mock socialAccounts
- ❌ CampaignsView - Uses mock campaigns
- ❌ AssetsView - Uses mock data
- ❌ AuditLogView - Uses mock auditLog

**Missing Backend Endpoints:**
- ❌ OAuth Connections API - Not implemented
- ❌ Conversations API - Missing PATCH, POST reply
- ❌ Alerts API - Missing POST, PATCH
- ❌ Scheduled Slots API - Missing POST approve/deny
- ❌ Brand Profile API - Missing PUT endpoint
- ❌ Audit Log API - Not implemented

**UI/UX Missing:**
- ❌ Loading skeletons in some views
- ❌ Error display components in some views
- ❌ Toast notifications (using alerts)
- ❌ Empty states in some views
- ❌ Form validation schemas

---

## 🔧 Development Workflow

### Starting Development Session

1. **Start Backend:**
   ```bash
   cd server
   npm run dev
   ```
   Keep this terminal open.

2. **Start Frontend (new terminal):**
   ```bash
   npm run dev
   ```
   Keep this terminal open.

3. **Open Browser:**
   - Navigate to `http://localhost:5000`
   - Keep DevTools open (F12) for debugging

### Making Changes

- **Frontend changes:** Vite will hot-reload automatically
- **Backend changes:** tsx will restart automatically (watch mode)
- **Type errors:** Check with `npm run check` (frontend) or `cd server && npx tsc --noEmit` (backend)

### Testing Changes

- Check browser console for errors
- Test API calls in Network tab
- Verify WebSocket events in console
- Test functionality manually in UI

---

## 📝 Important Notes

### Data Persistence
- **Current:** Backend uses **in-memory storage**
- **Behavior:** Data resets when backend server restarts
- **Future:** Database integration planned but not implemented

### Authentication
- **Current:** No authentication required (dev mode)
- **Behavior:** All API requests are accepted
- **Future:** Authentication system planned but not implemented

### Environment Variables
- **Optional:** Environment variables have sensible defaults
- **Recommended:** Create `.env` file for clarity
- **Production:** Environment variables will be required

### TypeScript
- **Status:** All TypeScript errors fixed
- **Compilation:** `npm run check` should pass
- **Backend:** TypeScript compilation works with tsx

---

## 🐛 Common Issues & Solutions

### Issue: White Screen
**Solution:**
1. Check browser console for React errors
2. Verify backend is running (`http://localhost:8080/health`)
3. Check Network tab for 404s
4. Clear browser cache (Ctrl+Shift+R)
5. Run `npm install` again

### Issue: Backend Won't Start
**Solution:**
1. Check port 8080 is available
2. Verify `server/node_modules` exists
3. Run `cd server && npm install`
4. Check TypeScript errors: `cd server && npx tsc --noEmit`

### Issue: Frontend Can't Connect to Backend
**Solution:**
1. Verify backend is running on port 8080
2. Check Vite proxy config in `vite.config.js`
3. Check browser console for CORS errors (shouldn't happen)
4. Test backend directly: `curl http://localhost:8080/api/posts`

### Issue: WebSocket Not Connecting
**Solution:**
1. Verify backend WebSocket server is running
2. Check `VITE_WS_BASE_URL` in `.env` (optional)
3. Check browser console for WebSocket errors
4. **Note:** WebSocket errors should not block app rendering

### Issue: API Calls Return 404
**Solution:**
1. Verify backend server is running
2. Check endpoint exists in `server/src/index.ts`
3. Verify proxy config in `vite.config.js`
4. Check Network tab for actual URL being called

### Issue: TypeScript Errors
**Solution:**
1. Run `npm run check` to see all errors
2. Fix errors in order (some errors may be dependencies)
3. For backend: `cd server && npx tsc --noEmit`
4. Make sure all dependencies are installed

---

## 📚 Additional Resources

### Documentation Files
- `README_DEVELOPMENT.md` - Detailed development guide
- `APP_STATUS_REPORT.md` - Current status report
- `DEVELOPMENT_PLAN.md` - Development plan and roadmap
- `COMPREHENSIVE_PLAN.md` - Comprehensive feature plan
- `IMPLEMENTATION_COMPLETE.md` - Implementation summary
- `VERIFICATION_CHECKLIST.md` - Verification steps
- `server/README.md` - Backend API documentation

### Key Files
- `package.json` - Frontend dependencies and scripts
- `server/package.json` - Backend dependencies and scripts
- `vite.config.js` - Vite configuration (proxy setup)
- `server/src/index.ts` - Backend server implementation
- `src/main.tsx` - Frontend entry point
- `src/routes/index.tsx` - Main application routes
- `src/sdk/services/api-services.ts` - API service definitions
- `src/hooks/use-api.ts` - React Query hooks

---

## 🎯 Next Steps After Setup

Once the app is running:

1. **Explore the UI:**
   - Navigate through different views
   - Note which views use real API data vs mock data
   - Test the Dashboard and Compose views (they use real APIs)

2. **Test Vertical Slice (if available):**
   - Navigate to "Vertical Slice (Test)" in sidebar
   - Create a post → Approve → Publish
   - Watch real-time updates

3. **Review Documentation:**
   - Read `DEVELOPMENT_PLAN.md` for migration roadmap
   - Read `APP_STATUS_REPORT.md` for current status
   - Review `COMPREHENSIVE_PLAN.md` for future features

4. **Start Development:**
   - Follow the migration pattern in `DEVELOPMENT_PLAN.md`
   - Use `PostsVerticalSlice.tsx` as reference
   - Migrate views one at a time from mock data to API hooks

---

## ✅ Checklist Summary

**Minimum Setup (to run the app):**
- [x] Node.js 18+ installed
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Backend dependencies installed (`cd server && npm install`)
- [ ] Backend server running (`cd server && npm run dev`)
- [ ] Frontend server running (`npm run dev`)
- [ ] Browser opens to `http://localhost:5000`
- [ ] App UI renders (not white screen)
- [ ] No critical errors in console

**Optional but Recommended:**
- [ ] `.env` file created
- [ ] WebSocket connection verified
- [ ] API calls verified in Network tab
- [ ] Vertical Slice demo tested

**For Production:**
- [ ] Database integration
- [ ] Authentication system
- [ ] Environment variables configured
- [ ] Build process tested (`npm run build`)
- [ ] Error handling tested
- [ ] All views migrated to API hooks

---

**Status:** ✅ Ready to start development!  
**Last Updated:** Today
