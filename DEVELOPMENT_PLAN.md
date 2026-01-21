# Hostess Social Media App - Development Plan

## Phase 0 - Fix White Screen ✅ COMPLETED

**Goal**: App reliably renders locally before any migration work continues.

### Tasks Completed
- [x] Fixed auth blocking in dev mode - authentication is now optional in development
- [x] Fixed query parameters serialization in API services
- [x] Improved API client error handling to properly convert PlatformRequestError
- [x] Added stub backend endpoints to prevent white screen crashes
- [x] Verified ErrorBoundary is in place at app root
- [x] Verified base path is "/" in dev mode
- [x] Removed legacy runtime dependencies

### Verification Checklist
See RUNBOOK section below for detailed verification steps.

---

## Current Status Assessment

### ✅ **COMPLETED - Infrastructure & Foundation**

1. **Backend API Layer** (`server/src/index.ts`)
   - ✅ Express server with WebSocket support
   - ✅ Posts API (CRUD, approve, publish)
   - ✅ Publish Jobs API (list, get, create, update, retry)
   - ✅ Autopilot Settings API
   - ✅ Organizations API
   - ✅ WebSocket real-time events (post_created, post_updated, post_published, publish_job_updated)
   - ✅ Simulated job lifecycle (queued → publishing → completed)

2. **Frontend API Services** (`src/sdk/services/api-services.ts`)
   - ✅ Centralized API service layer
   - ✅ All endpoints defined (Posts, Campaigns, Social Accounts, Conversations, Alerts, Organizations, OAuth, Publish Jobs, Quota, Autopilot)
   - ✅ TypeScript types throughout

3. **React Query Hooks** (`src/hooks/use-api.ts`)
   - ✅ Complete set of hooks for all API endpoints
   - ✅ Automatic cache invalidation
   - ✅ Proper TypeScript typing

4. **Real-time Service** (`src/hooks/use-realtime.ts`)
   - ✅ WebSocket integration
   - ✅ Automatic reconnection
   - ✅ Polling fallback
   - ✅ React Query cache invalidation on events

5. **Error Handling & Retry Logic**
   - ✅ Enhanced API client with retry logic (`src/sdk/core/api-client.ts`)
   - ✅ Exponential backoff
   - ✅ Comprehensive error types
   - ✅ Network error handling

6. **OAuth Service Structure** (`src/sdk/services/oauth-service.ts`)
   - ✅ OAuth flow initiation
   - ✅ Popup-based flow
   - ✅ Token refresh logic

7. **Vertical Slice Demo** (`src/components/PostsVerticalSlice.tsx`)
   - ✅ Working example of API integration
   - ✅ Create → Approve → Publish flow
   - ✅ Real-time updates working
   - ✅ Accessible via sidebar navigation

### ❌ **INCOMPLETE - What Needs Work**

1. **Component Migration** (`src/routes/index.tsx`)
   - ❌ **ALL views still use mock data** from `useAppStore`
   - ❌ DashboardView - uses mock posts, campaigns, socialAccounts
   - ❌ QueueView - uses mock scheduledSlots
   - ❌ ComposeView - uses mock addPost
   - ❌ CalendarView - uses mock posts
   - ❌ NotificationsView - uses mock autopilotNotifications
   - ❌ InboxView - uses mock conversations
   - ❌ AnalyticsView - uses mock data
   - ❌ BrandProfileView - uses mock brandProfile
   - ❌ AccountsView - uses mock socialAccounts
   - ❌ CampaignsView - uses mock campaigns
   - ❌ AssetsView - uses mock data
   - ❌ AuditLogView - uses mock auditLog

2. **Missing Backend Endpoints**
   - ❌ Campaigns API (list, get, create, update, delete)
   - ❌ Social Accounts API (list, sync)
   - ❌ Conversations API (list, update, reply)
   - ❌ Alerts API (list, create, update)
   - ❌ OAuth Connections API (list, connect, disconnect, refresh)
   - ❌ Quota Usage API
   - ❌ Brand Profile API (get, update)
   - ❌ Scheduled Slots API (get, approve, deny)
   - ❌ Audit Log API

3. **UI/UX Enhancements**
   - ❌ Loading skeletons/spinners throughout app
   - ❌ Error boundaries with user-friendly messages
   - ❌ Toast notifications for user actions
   - ❌ Empty states for lists
   - ❌ Form validation feedback

4. **OAuth Implementation**
   - ❌ OAuth UI components (Connect Account button, Connection status)
   - ❌ OAuth callback handling in routes
   - ❌ Connection management UI (list, disconnect)

5. **Environment Setup**
   - ❌ `.env` file (only `.env.example` exists)
   - ❌ Environment variable validation

6. **Testing**
   - ❌ Unit tests for API services
   - ❌ Integration tests for hooks
   - ❌ E2E tests for critical flows

7. **Data Persistence**
   - ❌ Backend currently uses in-memory storage (resets on restart)
   - ❌ No database integration

8. **Authentication**
   - ❌ No real authentication (all requests accepted)
   - ❌ No user management

---

## Priority Action Plan

### **Phase 1: Core Data Migration (HIGH PRIORITY)**

**Goal:** Replace all mock data usage with real API calls

#### 1.1 Backend - Add Missing Endpoints
- [ ] **Campaigns API** (`GET /api/campaigns`, `POST /api/campaigns`, `GET /api/campaigns/:id`, `PATCH /api/campaigns/:id`, `DELETE /api/campaigns/:id`)
- [ ] **Social Accounts API** (`GET /api/social-accounts`, `POST /api/social-accounts/:id/sync`)
- [ ] **Conversations API** (`GET /api/conversations`, `PATCH /api/conversations/:id`, `POST /api/conversations/:id/reply`)
- [ ] **Alerts API** (`GET /api/alerts`, `POST /api/alerts`, `PATCH /api/alerts/:id`)
- [ ] **OAuth Connections API** (`GET /api/oauth/connections`, `POST /api/oauth/connect`, `DELETE /api/oauth/connections/:id`, `POST /api/oauth/connections/:id/refresh`)
- [ ] **Brand Profile API** (`GET /api/brand-profile`, `PUT /api/brand-profile`)
- [ ] **Scheduled Slots API** (`GET /api/scheduled-slots`, `POST /api/scheduled-slots/:id/approve`, `POST /api/scheduled-slots/:id/deny`)
- [ ] **Quota Usage API** (`GET /api/quota/usage`)
- [ ] **Audit Log API** (`GET /api/audit-log`)

#### 1.2 Frontend - Migrate Views to API Hooks
Priority order:
1. [ ] **DashboardView** - Use `usePosts`, `useCampaigns`, `useSocialAccounts`
2. [ ] **QueueView** - Use `useScheduledSlots` (needs backend first)
3. [ ] **ComposeView** - Use `useCreatePost`, `useUpdatePost`
4. [ ] **CalendarView** - Use `usePosts` with date filters
5. [ ] **CampaignsView** - Use `useCampaigns`, `useCreateCampaign`
6. [ ] **AccountsView** - Use `useSocialAccounts`, `useSyncSocialAccount`, `useOAuthConnections`
7. [ ] **InboxView** - Use `useConversations`, `useUpdateConversation`
8. [ ] **NotificationsView** - Use real-time updates (may need new endpoint)
9. [ ] **BrandProfileView** - Use `useBrandProfile`
10. [ ] **AnalyticsView** - May need new analytics endpoints
11. [ ] **AssetsView** - May need asset library endpoints
12. [ ] **AuditLogView** - Use audit log endpoint

#### 1.3 Remove Mock Data
- [ ] Remove sample data generators from `app-store.ts`
- [ ] Keep only UI state in Zustand store (navigation, filters, selections)
- [ ] Remove data state from Zustand (posts, campaigns, etc.)

---

### **Phase 2: User Experience (MEDIUM PRIORITY)**

#### 2.1 Loading States
- [ ] Add loading skeletons to all list views
- [ ] Add loading spinners to forms and buttons
- [ ] Use React Query's `isLoading` and `isFetching` states

#### 2.2 Error Handling
- [ ] Create `ErrorDisplay` component for API errors
- [ ] Add error boundaries for each major view
- [ ] Show user-friendly error messages
- [ ] Add retry buttons for failed requests

#### 2.3 Empty States
- [ ] Create `EmptyState` component
- [ ] Add empty states for: Posts, Campaigns, Conversations, Alerts, Jobs

#### 2.4 Toast Notifications
- [ ] Use `sonner` toast library (already installed)
- [ ] Add success toasts for: Create, Update, Delete actions
- [ ] Add error toasts for failed operations

#### 2.5 Form Validation
- [ ] Add Zod schemas for all forms
- [ ] Use `react-hook-form` with Zod resolver (already installed)
- [ ] Show validation errors inline

---

### **Phase 3: OAuth Integration (MEDIUM PRIORITY)**

#### 3.1 Backend OAuth Endpoints
- [ ] Implement OAuth flow endpoints
- [ ] Store OAuth connections in backend
- [ ] Handle OAuth callbacks

#### 3.2 Frontend OAuth UI
- [ ] Create `OAuthConnectionCard` component
- [ ] Create `ConnectAccountButton` component
- [ ] Add OAuth status indicators
- [ ] Handle OAuth popup flow
- [ ] Handle OAuth callback route

#### 3.3 Connection Management
- [ ] List connected accounts
- [ ] Disconnect accounts
- [ ] Refresh expired tokens

---

### **Phase 4: Real-time Enhancements (LOW PRIORITY)**

#### 4.1 Additional WebSocket Events
- [ ] `campaign_created`, `campaign_updated`
- [ ] `conversation_new_message`
- [ ] `alert_triggered`
- [ ] `slot_approved`, `slot_denied`

#### 4.2 Real-time UI Updates
- [ ] Update views automatically on WebSocket events
- [ ] Show connection status indicator in header
- [ ] Add visual indicators for real-time updates

---

### **Phase 5: Data Persistence (LOW PRIORITY - Future)**

#### 5.1 Database Integration
- [ ] Choose database (PostgreSQL recommended)
- [ ] Set up database schema
- [ ] Migrate in-memory storage to database
- [ ] Add database migrations

#### 5.2 Authentication
- [ ] Implement user authentication
- [ ] Add JWT token management
- [ ] Protect API endpoints
- [ ] Add user management

---

## Immediate Next Steps (This Week)

1. **Create `.env` file** from `.env.example`
2. **Start migrating DashboardView** - Replace mock data with API hooks
3. **Add backend Campaigns endpoint** - Enable campaigns migration
4. **Add backend Social Accounts endpoint** - Enable accounts migration
5. **Test vertical slice** - Verify end-to-end flow works

---

## Migration Strategy

### Pattern for Migrating Views

**Before (Mock Data):**
```tsx
const { posts, campaigns, addPost } = useAppStore();
```

**After (API Hooks):**
```tsx
const { data: postsData, isLoading: postsLoading, error: postsError } = usePosts();
const { data: campaignsData, isLoading: campaignsLoading } = useCampaigns();
const createPost = useCreatePost();

const posts = postsData?.posts || [];
const campaigns = campaignsData?.campaigns || [];

if (postsLoading || campaignsLoading) return <LoadingSkeleton />;
if (postsError) return <ErrorDisplay error={postsError} />;
```

### Keeping UI State in Zustand

**Keep in `app-store.ts`:**
- Navigation state (`activeView`, `sidebarCollapsed`)
- UI filters (`platformFilter`, `statusFilter`)
- Selected items (`selectedPosts`)
- Form state (`composerOpen`, `editingPost`)

**Remove from `app-store.ts`:**
- Data arrays (`posts`, `campaigns`, `socialAccounts`, etc.)
- Data actions (`addPost`, `updatePost`, etc.)
- Sample data generators

---

## Testing Checklist

Once migration is complete, test each view:
- [ ] Data loads correctly
- [ ] Loading states show
- [ ] Error states handle gracefully
- [ ] Create/Update/Delete operations work
- [ ] Real-time updates work
- [ ] Filters work correctly
- [ ] Empty states show when no data

---

## Notes

- The vertical slice (`PostsVerticalSlice.tsx`) serves as a reference implementation
- Backend uses in-memory storage - data resets on server restart (acceptable for dev)
- All API services are typed - TypeScript will catch integration issues
- React Query handles caching automatically - no need to manually manage cache
- WebSocket connection is automatic via `useRealtime` hook

---

## Questions to Resolve

1. **Analytics Data** - Where does analytics data come from? Need to define analytics endpoints
2. **Asset Library** - Do we need asset library endpoints? Or is it managed differently?
3. **Scheduled Slots** - Are these auto-generated by autopilot? How are they created?
4. **Notifications** - Are notifications real-time events or a separate endpoint?
5. **Quota Management** - Is quota tracking automatic or manual?

---

*Last Updated: [Current Date]*
*Status: Planning Phase - Ready to Begin Implementation*
