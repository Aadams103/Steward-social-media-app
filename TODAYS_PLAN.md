# Today's Action Plan - Hostess Social Media App

## 🎯 Current Status

### ✅ What's Working
- **Infrastructure**: Backend (Express + WebSocket) and Frontend (Vite + React) are set up
- **TypeScript**: All compilation errors fixed
- **API Services**: Complete service layer and React Query hooks implemented
- **One Working Demo**: PostsVerticalSlice (create → approve → publish flow works)
- **Backend APIs**: Posts, Publish Jobs, Autopilot Settings, Organizations are fully functional

### ❌ What's Not Working
- **12 views still use mock data** instead of real API calls
- **Missing backend endpoints**: Campaigns (full CRUD), Social Accounts (sync), Conversations (reply), Alerts (create/update), OAuth, Scheduled Slots (approve/deny)
- **No UI enhancements**: Loading states, error handling, empty states, toast notifications
- **No .env file**: Environment variables not configured

---

## 🚀 Today's Priority: Make Core Features Functional

### Step 1: Setup & Verify (30 min)
```bash
# 1. Create .env file
echo "VITE_API_BASE_PATH=/api
VITE_WS_BASE_URL=ws://localhost:8080/ws
VITE_MCP_API_BASE_PATH=/api/mcp" > .env

# 2. Install dependencies (if needed)
cd server && npm install && cd ..
npm install

# 3. Start backend
cd server && npm run dev

# 4. Start frontend (new terminal)
npm run dev

# 5. Verify app loads at http://localhost:5000
```

### Step 2: Backend - Campaigns API (2-3 hours)
**File:** `server/src/index.ts`

Add endpoints:
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/:id` - Get single campaign
- `PATCH /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- WebSocket events: `campaign_created`, `campaign_updated`, `campaign_deleted`

### Step 3: Backend - Social Accounts Sync (1-2 hours)
**File:** `server/src/index.ts`

Add endpoint:
- `POST /api/social-accounts/:id/sync` - Sync account data
- WebSocket events: `account_synced`

### Step 4: Frontend - DashboardView Migration (2-3 hours)
**File:** `src/routes/index.tsx`

Replace:
```tsx
// OLD
const { posts, campaigns, socialAccounts } = useAppStore();

// NEW
const { data: postsData, isLoading: postsLoading } = usePosts();
const { data: campaignsData, isLoading: campaignsLoading } = useCampaigns();
const { data: accountsData, isLoading: accountsLoading } = useSocialAccounts();

const posts = postsData?.posts || [];
const campaigns = campaignsData?.campaigns || [];
const socialAccounts = accountsData?.accounts || [];

if (postsLoading || campaignsLoading || accountsLoading) {
  return <LoadingSkeleton />;
}
```

### Step 5: Frontend - ComposeView Migration (2-3 hours)
**File:** `src/routes/index.tsx`

Replace:
```tsx
// OLD
const { addPost } = useAppStore();

// NEW
const createPost = useCreatePost();
const updatePost = useUpdatePost();

const handleSubmit = async (postData) => {
  try {
    if (editingPost) {
      await updatePost.mutateAsync({ id: editingPost.id, ...postData });
      toast.success('Post updated');
    } else {
      await createPost.mutateAsync(postData);
      toast.success('Post created');
    }
  } catch (error) {
    toast.error('Failed to save post');
  }
};
```

### Step 6: Basic UI Enhancements (2-3 hours)

**Create LoadingSkeleton component:**
```tsx
// src/components/ui/loading-skeleton.tsx
export function LoadingSkeleton() {
  return <div className="animate-pulse">Loading...</div>;
}
```

**Add toast notifications:**
```tsx
import { toast } from 'sonner';

// On success
toast.success('Post created successfully');

// On error
toast.error('Failed to create post');
```

**Add error handling:**
```tsx
const { data, error, isLoading } = usePosts();

if (error) {
  return <div className="text-red-500">Error: {error.message}</div>;
}
```

---

## 📊 Progress Tracking

### Today's Goals
- [ ] Step 1: Setup & Verify (30 min)
- [ ] Step 2: Backend - Campaigns API (2-3 hours)
- [ ] Step 3: Backend - Social Accounts Sync (1-2 hours)
- [ ] Step 4: Frontend - DashboardView Migration (2-3 hours)
- [ ] Step 5: Frontend - ComposeView Migration (2-3 hours)
- [ ] Step 6: Basic UI Enhancements (2-3 hours)

**Total Estimated Time:** 8-12 hours

### Quick Wins (If Time Permits)
- [ ] Migrate CalendarView (1-2 hours)
- [ ] Migrate CampaignsView (2-3 hours)
- [ ] Add empty states component (1 hour)

---

## 🎯 Success Criteria

App is "functional" when:
1. ✅ Dashboard shows real data from API (not mock)
2. ✅ Can create posts via ComposeView using real API
3. ✅ Can create/edit campaigns using real API
4. ✅ Loading states show while fetching data
5. ✅ Error messages display when API calls fail
6. ✅ Toast notifications show on success/error
7. ✅ No white screen errors
8. ✅ Real-time updates work (WebSocket)

---

## 📝 Reference Files

- **Working Example**: `src/components/PostsVerticalSlice.tsx` - Shows how to use API hooks
- **API Hooks**: `src/hooks/use-api.ts` - All available hooks
- **API Services**: `src/sdk/services/api-services.ts` - Endpoint definitions
- **Backend**: `server/src/index.ts` - Backend implementation
- **Store**: `src/store/app-store.ts` - Mock data (to be replaced)

---

## 🔧 Quick Commands

```bash
# Check TypeScript errors
npm run check

# Format code
npm run format

# Start backend
cd server && npm run dev

# Start frontend
npm run dev

# Test vertical slice
# Navigate to http://localhost:5000
# Click "Vertical Slice (Test)" in sidebar
```

---

*Focus: Make core features work with real API calls today*
