# Verification Checklist

## Step 0: Repo Sanity ✅

- [x] `npm install` completed successfully
- [x] All new files compile without TypeScript errors
- [x] Files confirmed:
  - `src/sdk/core/api-client.ts`
  - `src/sdk/services/api-services.ts`
  - `src/sdk/services/oauth-service.ts`
  - `src/sdk/services/realtime-service.ts`
  - `src/hooks/use-api.ts`
  - `src/hooks/use-realtime.ts`

## Step 1: Backend Shim ✅

### Files Created:
- `server/package.json` - Backend dependencies
- `server/tsconfig.json` - TypeScript config
- `server/src/index.ts` - Express + WebSocket server
- `server/src/types.ts` - Type definitions

### Endpoints Implemented:

#### Posts API
- ✅ `GET /api/posts` - List posts (supports ?platform=, ?status=, ?campaignId=)
- ✅ `GET /api/posts/:id` - Get single post
- ✅ `POST /api/posts` - Create post
- ✅ `PATCH /api/posts/:id` - Update post
- ✅ `DELETE /api/posts/:id` - Delete post
- ✅ `POST /api/posts/:id/approve` - Approve post
- ✅ `POST /api/posts/:id/publish` - Publish post (creates publish job)

#### Publish Jobs API
- ✅ `GET /api/publish-jobs` - List jobs (supports ?organizationId=, ?status=)
- ✅ `GET /api/publish-jobs/:id` - Get single job
- ✅ `POST /api/publish-jobs` - Create job
- ✅ `PATCH /api/publish-jobs/:id` - Update job
- ✅ `POST /api/publish-jobs/:id/retry` - Retry failed job

#### Autopilot API
- ✅ `GET /api/autopilot` - Get settings
- ✅ `PUT /api/autopilot` - Update settings

#### Organizations API
- ✅ `GET /api/organizations/me` - Get current org
- ✅ `GET /api/organizations` - List organizations

### WebSocket Events:
- ✅ `post_created` - Broadcast when post is created
- ✅ `post_updated` - Broadcast when post is updated
- ✅ `post_published` - Broadcast when post is published
- ✅ `publish_job_updated` - Broadcast on job status changes

### Job Lifecycle Simulation:
- ✅ Job starts as `queued`
- ✅ After 2s → status changes to `publishing` (broadcasted)
- ✅ After 4s → status changes to `completed` (broadcasted)

## Step 2: Vite Proxy ✅

- ✅ Added proxy configuration in `vite.config.js`
- ✅ `/api` → `http://localhost:8080`
- ✅ No CORS hacks needed

## Step 3: Environment Variables ✅

- ✅ Created `.env.example` with:
  - `VITE_API_BASE_PATH=/api`
  - `VITE_WS_BASE_URL=ws://localhost:8080/ws`
  - `VITE_MCP_API_BASE_PATH=/api/mcp`

- ✅ Created `README_DEVELOPMENT.md` with setup instructions

## Step 4: Vertical Slice Wiring ✅

### Component Created:
- ✅ `src/components/PostsVerticalSlice.tsx` - Full vertical slice demo

### Features:
- ✅ Create post using `useCreatePost` hook
- ✅ Approve post using `useUpdatePost` hook
- ✅ Publish post (creates job) using `usePublishPost` hook
- ✅ Real-time updates via `useRealtime` hook
- ✅ WebSocket connection status indicator
- ✅ Posts list with status badges
- ✅ Publish jobs list with real-time status updates

### Route Added:
- ✅ Added "Vertical Slice (Test)" to sidebar navigation
- ✅ Accessible via sidebar menu

## Step 5: Manual Test Flow

### Prerequisites:
1. Start backend: `cd server && npm run dev`
2. Start frontend: `npm run dev`
3. Open browser to `http://localhost:5000`

### Test Steps:

#### 1. Create a Post
- [ ] Navigate to "Vertical Slice (Test)" in sidebar
- [ ] Enter post content
- [ ] Select platform
- [ ] Click "Create Post"
- [ ] Verify post appears in Posts list with status "draft"
- [ ] Check browser console for "✅ Post created" message
- [ ] Check backend terminal for POST request log

#### 2. Approve Post
- [ ] Click "Approve" button on draft post
- [ ] Verify status changes to "approved"
- [ ] Check browser console for "✅ Post approved" message
- [ ] Check backend terminal for PATCH request log

#### 3. Publish Post (Create Job)
- [ ] Click "Publish" button on approved post
- [ ] Verify publish job appears in Jobs list with status "queued"
- [ ] Check browser console for "✅ Publish job created" message
- [ ] Check backend terminal for POST /api/posts/:id/publish log

#### 4. Watch Real-time Updates
- [ ] Wait 2 seconds - job status should change to "publishing" automatically
- [ ] Wait 4 seconds - job status should change to "completed" automatically
- [ ] Verify no page refresh needed
- [ ] Check browser console for WebSocket messages:
  - "⚙️ Publish job updated: { status: 'publishing' }"
  - "⚙️ Publish job updated: { status: 'completed' }"
- [ ] Verify WebSocket indicator shows "🟢 WebSocket Connected"

#### 5. Verify Persistence
- [ ] Refresh the page
- [ ] Verify post still exists in Posts list
- [ ] Verify publish job still exists in Jobs list
- [ ] Note: In-memory persistence (data resets on server restart)

## Terminal Outputs

### Backend Running:
```
🚀 Backend shim running on http://localhost:8080
📡 WebSocket server running on ws://localhost:8080/ws
📊 Posts: 0, Jobs: 0
```

### Frontend Running:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5000/
  ➜  Network: use --host to expose
```

## Endpoints Matching api-services.ts

All endpoints match the frontend API service definitions:

- ✅ Posts endpoints match `postsApi` in `api-services.ts`
- ✅ Publish jobs endpoints match `publishJobsApi` in `api-services.ts`
- ✅ Response formats match TypeScript types
- ✅ WebSocket events match `realtime-service.ts` event types

## Known Limitations

1. **In-memory storage**: Data resets on server restart
2. **No authentication**: All requests accepted (for local dev)
3. **No database**: Using Map-based in-memory storage
4. **Simulated delays**: Job lifecycle uses setTimeout (2s, 4s)
5. **Single organization**: Only one default org for now

## Next Steps (Not in Scope)

- [ ] Add database persistence
- [ ] Implement real authentication
- [ ] Add error handling UI
- [ ] Add loading states
- [ ] Migrate other views to use API hooks
- [ ] Add real OAuth integrations
