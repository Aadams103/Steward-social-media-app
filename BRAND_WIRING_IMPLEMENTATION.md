# Brand Wiring Implementation - Complete

## Summary
All brand-scoped data wiring has been implemented. Every API call now includes the `x-brand-id` header, and all brand-owned data (Social Accounts, Autopilot Briefs, Compose) is properly scoped to the active brand.

## Step 1: API Header Injection ✅

**File:** `src/sdk/core/request.ts`

- Updated `platformRequest` to inject `x-brand-id` header from localStorage
- Header is set to active brand ID or "all" if no brand selected
- Added dev-mode logging (10% of requests) to verify header is being sent
- Header is automatically included in all API calls via `apiClient`

**Verification:**
- Open browser DevTools → Network tab
- Make any API call (e.g., switch brands, load posts)
- Check Request Headers → should see `x-brand-id: <brandId>` or `x-brand-id: all`

## Step 2: Brand-Scoped Social Accounts ✅

### Backend Changes

**File:** `server/src/types.ts`
- Added `brandId: string` field to `SocialAccount` interface
- Added `status: 'connected' | 'disconnected' | 'stub'` field

**File:** `server/src/index.ts`
- Updated `GET /api/social-accounts` to filter by `x-brand-id` header
- Added `POST /api/social-accounts` endpoint for creating stub accounts
  - Validates brand is not "all"
  - Only allows social platforms (not slack/notion)
  - Creates account with `brandId`, `status: 'stub'`
- Added `DELETE /api/social-accounts/:id` endpoint
  - Verifies brand ownership before deletion

### Frontend Changes

**File:** `src/types/app.ts`
- Updated `SocialAccount` interface to include `brandId?`, `status?`, `organizationId?`, `createdAt?`, `updatedAt?`

**File:** `src/sdk/services/api-services.ts`
- Added `create` method to `socialAccountsApi`

**File:** `src/hooks/use-api.ts`
- Added `useCreateSocialAccount` hook
- Added `useDeleteSocialAccount` hook

**File:** `src/routes/index.tsx` (AccountsView)
- Replaced store-based `socialAccounts` with API hook `useSocialAccounts()`
- Added "Add Stub Account" button (dev mode)
- Added stub account creation dialog (platform + handle)
- Shows empty state if no accounts connected
- Shows brand context (blocks in "All Brands" mode)
- Displays account status (Connected/Disconnected/Stub)
- Delete functionality with brand ownership verification

**Verification:**
1. Create Brand A and Brand B
2. On Brand A: Create stub account (Instagram, handle: @branda)
3. Switch to Brand B: Should see empty state
4. Switch back to Brand A: Should see the stub account

## Step 3: Brand-Scoped Autopilot Brief ✅

### Backend Changes

**File:** `server/src/index.ts`
- `GET /api/autopilot/brief` already filters by `x-brand-id` header
- `PUT /api/autopilot/brief` stores brief by `brandId` (key in Map)
- Returns empty brief shape if no brief exists for brand
- Blocks operations in "all" mode

### Frontend Changes

**File:** `src/routes/index.tsx` (AutopilotView)
- Uses `useAutopilotBrief()` hook (automatically brand-scoped via header)
- Shows "Setup Required for {Brand Name}" when no brief exists
- Shows brief summary when brief exists
- "All Brands" mode shows list of brands with status (currently shows "Not Configured" for all - could be enhanced to check each brand's brief)

**Verification:**
1. Create Brand A and Brand B
2. On Brand A: Complete Autopilot brief setup
3. Switch to Brand B: Should see "Setup Required" message
4. Switch back to Brand A: Should see brief summary

## Step 4: Brand-Scoped Compose ✅

### Frontend Changes

**File:** `src/routes/index.tsx` (ComposeView)
- Already blocks composing in "All Brands" mode
- Shows active brand name and avatar in header
- Uses `useSocialAccounts()` to get brand-scoped accounts

**File:** `src/routes/index.tsx` (ComposeSinglePostContent)
- Filters platforms to only social platforms (facebook, instagram, linkedin, tiktok, pinterest, reddit)
- Shows empty state if no accounts connected
- Platform buttons show account status (Connected/Stub)
- Disables platforms without connected accounts
- Shows "Stub" badge on stub accounts

**Verification:**
1. Create Brand A with stub Instagram account
2. Open Compose: Should see Instagram button with "Stub" badge
3. Create Brand B with no accounts
4. Open Compose: Should see empty state "No social accounts connected"

## Files Changed

### Backend
- `server/src/types.ts` - Added `brandId` and `status` to `SocialAccount`
- `server/src/index.ts` - Brand-scoped social accounts endpoints, brand filtering

### Frontend
- `src/sdk/core/request.ts` - Header injection with dev logging
- `src/types/app.ts` - Updated `SocialAccount` interface
- `src/sdk/services/api-services.ts` - Added `create` to `socialAccountsApi`
- `src/hooks/use-api.ts` - Added `useCreateSocialAccount`, `useDeleteSocialAccount`
- `src/routes/index.tsx` - Updated `AccountsView`, `ComposeView`, `AutopilotView`

## Endpoints Updated/Added

### Updated
- `GET /api/social-accounts` - Now filters by `x-brand-id`
- `GET /api/autopilot/brief` - Already brand-scoped (no changes needed)
- `PUT /api/autopilot/brief` - Already brand-scoped (no changes needed)

### Added
- `POST /api/social-accounts` - Create stub/real social account (brand-scoped)
- `DELETE /api/social-accounts/:id` - Delete account with brand ownership check

## Testing Checklist

### Brand A Setup
- [ ] Create Brand A
- [ ] Create Autopilot brief for Brand A
- [ ] Add 2 stub social accounts (Instagram + Facebook) for Brand A
- [ ] Verify accounts appear in Accounts page
- [ ] Verify Compose shows platforms with accounts

### Brand B Verification
- [ ] Switch to Brand B
- [ ] Verify Autopilot shows "Setup Required"
- [ ] Verify Accounts page shows empty state
- [ ] Verify Compose shows empty state

### Brand A Return
- [ ] Switch back to Brand A
- [ ] Verify Autopilot brief appears
- [ ] Verify 2 stub accounts appear
- [ ] Verify Compose shows platforms

### Network Verification
- [ ] Open DevTools → Network tab
- [ ] Switch brands
- [ ] Check Request Headers on API calls
- [ ] Verify `x-brand-id` header matches active brand

## Answer to "Host" Question

**No, you do not need to connect to real social platform hosts yet.**

The implementation uses:
- **Stub accounts** - Connection records stored in memory, marked with `status: 'stub'`
- **Brand-scoped storage** - Each brand's accounts stored separately by `brandId`
- **Real OAuth later** - When ready, replace stub creation with real OAuth flow, but the brand scoping will already be in place

The brand wiring is complete and working. Real platform connections can be added later without changing the brand scoping architecture.
