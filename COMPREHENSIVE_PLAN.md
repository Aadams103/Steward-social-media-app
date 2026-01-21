# Hostess Social Media App - Comprehensive Development Plan

**Generated:** Today  
**Status:** Foundation Complete, Migration In Progress

---

## 📊 Current State Assessment

### ✅ What's Working (Foundation)

#### Infrastructure & Core Services
- ✅ **TypeScript Compilation** - All errors fixed, compilation passes
- ✅ **Backend Server** - Express + WebSocket running on port 8080
- ✅ **Frontend Dev Server** - Vite running on port 5000 with proxy
- ✅ **API Service Layer** - Complete service definitions (`src/sdk/services/api-services.ts`)
- ✅ **React Query Hooks** - All hooks implemented (`src/hooks/use-api.ts`)
- ✅ **Real-time Service** - WebSocket integration with polling fallback (`src/hooks/use-realtime.ts`)
- ✅ **Error Handling** - Enhanced API client with retry logic
- ✅ **OAuth Service Structure** - OAuth flow handlers ready
- ✅ **UI Components** - All Radix UI components installed and available

#### Backend Endpoints (Fully Implemented)
- ✅ **Posts API** - Complete CRUD, approve, publish (7 endpoints)
- ✅ **Publish Jobs API** - Complete management, retry (5 endpoints)
- ✅ **Autopilot API** - Get/update settings (2 endpoints)
- ✅ **Organizations API** - Get current org, list orgs (2 endpoints)
- ✅ **WebSocket Server** - Real-time events broadcasting

#### Working Demo
- ✅ **PostsVerticalSlice** - Complete working example
  - Create → Approve → Publish flow
  - Real-time updates
  - WebSocket connection status
  - Accessible via sidebar

### ⚠️ What's Partially Working

#### Backend Stub Endpoints (Return Empty Data)
- ⚠️ `GET /api/campaigns` → Returns empty array
- ⚠️ `GET /api/social-accounts` → Returns empty array
- ⚠️ `GET /api/conversations` → Returns empty array
- ⚠️ `GET /api/alerts` → Returns empty array
- ⚠️ `GET /api/organizations/:id/quota/usage` → Returns empty array
- ⚠️ `GET /api/organizations/:id/autopilot/brand-profile` → Returns stub object
- ⚠️ `GET /api/organizations/:id/autopilot/settings` → Returns settings
- ⚠️ `GET /api/organizations/:id/autopilot/slots` → Returns empty array

### ❌ What's Not Working / Missing

#### Critical Missing Backend Endpoints
- ❌ **Campaigns API** - Missing POST, PATCH, DELETE, GET by ID
- ❌ **Social Accounts API** - Missing POST sync endpoint
- ❌ **Conversations API** - Missing PATCH, POST reply endpoints
- ❌ **Alerts API** - Missing POST, PATCH endpoints
- ❌ **OAuth Connections API** - Not implemented at all
- ❌ **Brand Profile API** - Missing PUT endpoint
- ❌ **Scheduled Slots API** - Missing POST approve/deny endpoints
- ❌ **Quota Usage API** - Returns empty, needs real calculation
- ❌ **Audit Log API** - Not implemented

#### Frontend Migration Status
- ❌ **ALL 12 views still use mock data** from `useAppStore`:
  - DashboardView - Uses mock posts, campaigns, socialAccounts
  - QueueView - Uses mock scheduledSlots
  - ComposeView - Uses mock addPost
  - CalendarView - Uses mock posts
  - NotificationsView - Uses mock autopilotNotifications
  - InboxView - Uses mock conversations
  - AnalyticsView - Uses mock data
  - BrandProfileView - Uses mock brandProfile
  - AccountsView - Uses mock socialAccounts
  - CampaignsView - Uses mock campaigns
  - AssetsView - Uses mock data
  - AuditLogView - Uses mock auditLog

#### UI/UX Enhancements Missing
- ❌ Loading skeletons/spinners throughout app
- ❌ Error display components (errors not shown to users)
- ❌ Toast notifications (using alerts instead)
- ❌ Empty states (no empty state components)
- ❌ Form validation (no Zod schemas)
- ❌ OAuth UI components (no connection UI)

#### Configuration & Setup
- ❌ `.env` file (only `.env.example` exists)
- ❌ Environment variable validation

#### Data Persistence
- ❌ Backend uses in-memory storage (data resets on restart)
- ❌ No database integration

#### Authentication
- ❌ No real authentication (all requests accepted)
- ❌ No user management

---

## 🎯 Comprehensive Action Plan

### Phase 1: Immediate Setup & Verification (Priority: CRITICAL)

**Goal:** Ensure app runs locally without errors

#### 1.1 Environment Setup
- [ ] Create `.env` file from `.env.example`
  ```env
  VITE_API_BASE_PATH=/api
  VITE_WS_BASE_URL=ws://localhost:8080/ws
  VITE_MCP_API_BASE_PATH=/api/mcp
  ```
- [ ] Verify backend dependencies installed: `cd server && npm install`
- [ ] Verify frontend dependencies installed: `npm install`

#### 1.2 Local Verification
- [ ] Start backend: `cd server && npm run dev`
  - Verify: Server starts on port 8080
  - Verify: WebSocket server running
  - Verify: Health check works: `curl http://localhost:8080/health`
- [ ] Start frontend: `npm run dev`
  - Verify: Vite starts on port 5000
  - Verify: No compilation errors
- [ ] Open browser: `http://localhost:5000`
  - Verify: App renders (not white screen)
  - Verify: No console errors
  - Verify: Dashboard view loads
  - Verify: "Vertical Slice (Test)" works (create → approve → publish)

#### 1.3 Test Vertical Slice
- [ ] Create a post
- [ ] Approve the post
- [ ] Publish the post (creates job)
- [ ] Verify real-time updates (job status changes)
- [ ] Verify WebSocket connection indicator

**Estimated Time:** 30 minutes

---

### Phase 2: Backend Endpoints - Core Features (Priority: HIGH)

**Goal:** Implement missing backend endpoints for core features

#### 2.1 Campaigns API
- [ ] `POST /api/campaigns` - Create campaign
- [ ] `GET /api/campaigns/:id` - Get single campaign
- [ ] `PATCH /api/campaigns/:id` - Update campaign
- [ ] `DELETE /api/campaigns/:id` - Delete campaign
- [ ] Update `GET /api/campaigns` - Add filtering (status, date range)
- [ ] Add WebSocket events: `campaign_created`, `campaign_updated`, `campaign_deleted`

**Estimated Time:** 2-3 hours

#### 2.2 Social Accounts API
- [ ] `POST /api/social-accounts/:id/sync` - Sync account data
- [ ] Update `GET /api/social-accounts` - Return real account data structure
- [ ] Add WebSocket events: `account_synced`, `account_connected`, `account_disconnected`

**Estimated Time:** 1-2 hours

#### 2.3 Conversations API
- [ ] `PATCH /api/conversations/:id` - Update conversation (mark read, assign, archive)
- [ ] `POST /api/conversations/:id/reply` - Send reply to conversation
- [ ] Update `GET /api/conversations` - Add filtering (unread, assigned, platform)
- [ ] Add WebSocket events: `conversation_updated`, `conversation_new_message`

**Estimated Time:** 2-3 hours

#### 2.4 Alerts API
- [ ] `POST /api/alerts` - Create alert
- [ ] `PATCH /api/alerts/:id` - Update alert (acknowledge, dismiss)
- [ ] Update `GET /api/alerts` - Add filtering (severity, status, platform)
- [ ] Add WebSocket events: `alert_created`, `alert_updated`

**Estimated Time:** 1-2 hours

**Total Estimated Time:** 6-10 hours

---

### Phase 3: Backend Endpoints - Autopilot Features (Priority: HIGH)

**Goal:** Implement autopilot-related endpoints

#### 3.1 Brand Profile API
- [ ] `PUT /api/organizations/:id/autopilot/brand-profile` - Update brand profile
- [ ] Update `GET /api/organizations/:id/autopilot/brand-profile` - Return real data structure

**Estimated Time:** 1 hour

#### 3.2 Scheduled Slots API
- [ ] `POST /api/organizations/:id/autopilot/slots/:id/approve` - Approve scheduled slot
- [ ] `POST /api/organizations/:id/autopilot/slots/:id/deny` - Deny scheduled slot
- [ ] Update `GET /api/organizations/:id/autopilot/slots` - Return real slot data
- [ ] Add WebSocket events: `slot_approved`, `slot_denied`, `slot_created`

**Estimated Time:** 2-3 hours

#### 3.3 Quota Usage API
- [ ] Implement real quota calculation logic
- [ ] Track usage per organization
- [ ] Return usage breakdown by platform
- [ ] Add quota warnings when approaching limits

**Estimated Time:** 2-3 hours

#### 3.4 Audit Log API
- [ ] `GET /api/organizations/:id/audit-log` - Get audit log entries
- [ ] Add filtering (date range, action type, user)
- [ ] Implement audit log entry creation for all actions

**Estimated Time:** 2-3 hours

**Total Estimated Time:** 7-10 hours

---

### Phase 4: OAuth Integration (Priority: MEDIUM)

**Goal:** Implement OAuth connection management

#### 4.1 OAuth Connections API
- [ ] `GET /api/oauth/connections` - List OAuth connections
- [ ] `POST /api/oauth/connect` - Initiate OAuth flow
- [ ] `GET /api/oauth/callback` - Handle OAuth callback
- [ ] `DELETE /api/oauth/connections/:id` - Disconnect account
- [ ] `POST /api/oauth/connections/:id/refresh` - Refresh expired token
- [ ] Store OAuth tokens securely (in-memory for now)

**Estimated Time:** 3-4 hours

#### 4.2 OAuth UI Components
- [ ] Create `OAuthConnectionCard` component
- [ ] Create `ConnectAccountButton` component
- [ ] Add OAuth status indicators
- [ ] Handle OAuth popup flow
- [ ] Handle OAuth callback route

**Estimated Time:** 2-3 hours

**Total Estimated Time:** 5-7 hours

---

### Phase 5: Frontend Migration - Core Views (Priority: HIGH)

**Goal:** Replace mock data with real API calls in all views

#### 5.1 DashboardView Migration
- [ ] Replace `useAppStore` posts with `usePosts` hook
- [ ] Replace `useAppStore` campaigns with `useCampaigns` hook
- [ ] Replace `useAppStore` socialAccounts with `useSocialAccounts` hook
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add empty states
- [ ] Test real-time updates

**Estimated Time:** 2-3 hours

#### 5.2 ComposeView Migration
- [ ] Replace `useAppStore` addPost with `useCreatePost` hook
- [ ] Replace `useAppStore` updatePost with `useUpdatePost` hook
- [ ] Add form validation with Zod
- [ ] Add loading states on submit
- [ ] Add success/error toasts
- [ ] Handle draft saving

**Estimated Time:** 2-3 hours

#### 5.3 CalendarView Migration
- [ ] Replace `useAppStore` posts with `usePosts` hook with date filters
- [ ] Add date range filtering
- [ ] Add loading states
- [ ] Add real-time updates for new posts

**Estimated Time:** 1-2 hours

#### 5.4 CampaignsView Migration
- [ ] Replace `useAppStore` campaigns with `useCampaigns` hook
- [ ] Add `useCreateCampaign` hook
- [ ] Add campaign creation form
- [ ] Add campaign editing
- [ ] Add campaign deletion
- [ ] Add loading/error/empty states

**Estimated Time:** 2-3 hours

#### 5.5 AccountsView Migration
- [ ] Replace `useAppStore` socialAccounts with `useSocialAccounts` hook
- [ ] Add `useOAuthConnections` hook
- [ ] Add `useSyncSocialAccount` hook
- [ ] Add OAuth connection UI
- [ ] Add account sync functionality
- [ ] Add loading/error states

**Estimated Time:** 2-3 hours

#### 5.6 InboxView Migration
- [ ] Replace `useAppStore` conversations with `useConversations` hook
- [ ] Add `useUpdateConversation` hook
- [ ] Add conversation reply functionality
- [ ] Add real-time updates for new messages
- [ ] Add loading/error/empty states

**Estimated Time:** 2-3 hours

**Total Estimated Time:** 11-17 hours

---

### Phase 6: Frontend Migration - Autopilot Views (Priority: MEDIUM)

**Goal:** Migrate autopilot-related views

#### 6.1 QueueView Migration
- [ ] Replace `useAppStore` scheduledSlots with `useScheduledSlots` hook
- [ ] Add approve/deny functionality
- [ ] Add real-time updates for slot status changes
- [ ] Add loading/error/empty states

**Estimated Time:** 2-3 hours

#### 6.2 NotificationsView Migration
- [ ] Replace `useAppStore` autopilotNotifications with real-time events
- [ ] Add notification filtering
- [ ] Add mark as read functionality
- [ ] Add real-time updates

**Estimated Time:** 1-2 hours

#### 6.3 BrandProfileView Migration
- [ ] Replace `useAppStore` brandProfile with `useBrandProfile` hook
- [ ] Add `useUpdateBrandProfile` hook (needs backend PUT endpoint)
- [ ] Add form validation
- [ ] Add save functionality
- [ ] Add loading/error states

**Estimated Time:** 2-3 hours

#### 6.4 AnalyticsView Migration
- [ ] Determine analytics data source
- [ ] Create analytics API endpoints (if needed)
- [ ] Replace mock data with real API calls
- [ ] Add date range filtering
- [ ] Add loading states

**Estimated Time:** 3-4 hours (depends on requirements)

#### 6.5 AssetsView Migration
- [ ] Determine asset library structure
- [ ] Create asset library API endpoints (if needed)
- [ ] Replace mock data with real API calls
- [ ] Add upload functionality
- [ ] Add loading/error states

**Estimated Time:** 3-4 hours (depends on requirements)

#### 6.6 AuditLogView Migration
- [ ] Replace `useAppStore` auditLog with audit log API
- [ ] Add filtering (date range, action type)
- [ ] Add pagination
- [ ] Add loading/error states

**Estimated Time:** 2-3 hours

**Total Estimated Time:** 13-19 hours

---

### Phase 7: UI/UX Enhancements (Priority: MEDIUM)

**Goal:** Improve user experience with loading states, error handling, and feedback

#### 7.1 Loading States
- [ ] Create `LoadingSkeleton` component
- [ ] Add loading skeletons to all list views
- [ ] Add loading spinners to forms and buttons
- [ ] Use React Query's `isLoading` and `isFetching` states consistently

**Estimated Time:** 3-4 hours

#### 7.2 Error Handling
- [ ] Create `ErrorDisplay` component for API errors
- [ ] Add error boundaries for each major view
- [ ] Show user-friendly error messages
- [ ] Add retry buttons for failed requests
- [ ] Handle network errors gracefully

**Estimated Time:** 3-4 hours

#### 7.3 Empty States
- [ ] Create `EmptyState` component
- [ ] Add empty states for: Posts, Campaigns, Conversations, Alerts, Jobs, Slots
- [ ] Add helpful messages and action buttons

**Estimated Time:** 2-3 hours

#### 7.4 Toast Notifications
- [ ] Use `sonner` toast library (already installed)
- [ ] Add success toasts for: Create, Update, Delete actions
- [ ] Add error toasts for failed operations
- [ ] Add info toasts for real-time updates

**Estimated Time:** 2-3 hours

#### 7.5 Form Validation
- [ ] Create Zod schemas for all forms:
  - Post creation/editing
  - Campaign creation/editing
  - Brand profile editing
  - Autopilot settings
- [ ] Use `react-hook-form` with Zod resolver
- [ ] Show validation errors inline
- [ ] Add field-level error messages

**Estimated Time:** 4-5 hours

**Total Estimated Time:** 14-19 hours

---

### Phase 8: Real-time Enhancements (Priority: LOW)

**Goal:** Enhance real-time functionality

#### 8.1 Additional WebSocket Events
- [ ] `campaign_created`, `campaign_updated`, `campaign_deleted`
- [ ] `conversation_new_message`, `conversation_updated`
- [ ] `alert_triggered`, `alert_updated`
- [ ] `slot_approved`, `slot_denied`, `slot_created`
- [ ] `account_synced`, `account_connected`, `account_disconnected`

**Estimated Time:** 2-3 hours

#### 8.2 Real-time UI Updates
- [ ] Update views automatically on WebSocket events
- [ ] Show connection status indicator in header
- [ ] Add visual indicators for real-time updates (badges, animations)
- [ ] Add notification badges for new items

**Estimated Time:** 2-3 hours

**Total Estimated Time:** 4-6 hours

---

### Phase 9: Data Persistence (Priority: LOW - Future)

**Goal:** Replace in-memory storage with database

#### 9.1 Database Integration
- [ ] Choose database (PostgreSQL recommended)
- [ ] Set up database schema
- [ ] Create migration system
- [ ] Migrate in-memory storage to database
- [ ] Add database connection pooling

**Estimated Time:** 8-12 hours

#### 9.2 Authentication
- [ ] Implement user authentication
- [ ] Add JWT token management
- [ ] Protect API endpoints
- [ ] Add user management
- [ ] Add role-based access control

**Estimated Time:** 8-12 hours

**Total Estimated Time:** 16-24 hours

---

## 📋 Summary of Tasks

### Critical Path (Must Do Today)
1. ✅ Phase 1: Immediate Setup & Verification
2. ⚠️ Phase 2: Backend Endpoints - Core Features (Campaigns, Social Accounts, Conversations, Alerts)
3. ⚠️ Phase 5: Frontend Migration - Core Views (Dashboard, Compose, Calendar, Campaigns, Accounts, Inbox)

### High Priority (This Week)
4. Phase 3: Backend Endpoints - Autopilot Features
5. Phase 6: Frontend Migration - Autopilot Views
6. Phase 7: UI/UX Enhancements

### Medium Priority (Next Week)
7. Phase 4: OAuth Integration
8. Phase 8: Real-time Enhancements

### Low Priority (Future)
9. Phase 9: Data Persistence

---

## 🎯 Today's Focus: Make App Functional

### Minimum Viable Product (MVP) for Today

To make the app "working and functional" today, we need:

1. **Backend Endpoints** (6-10 hours)
   - Campaigns API (full CRUD)
   - Social Accounts API (sync)
   - Conversations API (update, reply)
   - Alerts API (create, update)

2. **Frontend Migration** (11-17 hours)
   - DashboardView
   - ComposeView
   - CalendarView
   - CampaignsView
   - AccountsView
   - InboxView

3. **Basic UI Enhancements** (4-6 hours)
   - Loading states
   - Error handling
   - Toast notifications

**Total Estimated Time for MVP:** 21-33 hours

### Recommended Approach for Today

Given time constraints, prioritize:

1. **Start with Backend** (2-3 hours)
   - Implement Campaigns API (most used feature)
   - Implement Social Accounts sync

2. **Migrate DashboardView** (2-3 hours)
   - This is the main entry point
   - Shows overall app health

3. **Migrate ComposeView** (2-3 hours)
   - Core functionality for creating posts

4. **Add Basic UI Enhancements** (2-3 hours)
   - Loading states
   - Error toasts
   - Basic empty states

**Realistic Goal for Today:** 8-12 hours of focused work
- Backend: Campaigns + Social Accounts APIs
- Frontend: Dashboard + Compose views migrated
- UI: Basic loading/error states

---

## 📝 Notes

- **In-memory Storage**: Acceptable for development, data resets on server restart
- **No Authentication**: All requests accepted in dev mode (acceptable for now)
- **TypeScript**: All services are fully typed - TypeScript will catch integration issues
- **React Query**: Provides automatic caching and background refetching
- **WebSocket**: Connection is automatic via `useRealtime` hook
- **Reference Implementation**: `PostsVerticalSlice.tsx` serves as template for migration

---

## 🔍 Questions to Resolve

1. **Analytics Data** - Where does analytics data come from? Need to define analytics endpoints
2. **Asset Library** - Do we need asset library endpoints? Or is it managed differently?
3. **Scheduled Slots** - Are these auto-generated by autopilot? How are they created?
4. **Notifications** - Are notifications real-time events or a separate endpoint?
5. **Quota Management** - Is quota tracking automatic or manual?

---

*Last Updated: Today*  
*Status: Ready to Begin Implementation*
