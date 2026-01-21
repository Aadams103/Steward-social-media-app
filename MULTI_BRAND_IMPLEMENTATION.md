# Multi-Brand Support Implementation

## Summary

This document describes the implementation of multi-brand support, allowing one user to manage multiple brands with brand-scoped data. Each brand has its own Autopilot brief, posts, events, settings, etc.

## Implementation Details

### Step 1: Brand Model + Endpoints (Backend)

**Files Changed:**
- `server/src/types.ts` - Added `Brand` interface
- `server/src/index.ts` - Added brand storage, endpoints, and `ensureDefaultBrand()` helper

**Brand Model:**
- `id`, `name`, `slug`, `avatarUrl?`, `color?`, `createdAt`, `updatedAt`

**Endpoints:**
- `GET /api/brands` - List all brands
- `POST /api/brands` - Create brand
- `PUT /api/brands/:id` - Update brand
- `DELETE /api/brands/:id` - Delete brand (prevents deleting last brand)
- `GET /api/brands/current` - Get current brand
- `PUT /api/brands/current` - Set current brand `{ brandId }`

**Implementation:**
- In-memory storage: `brands: Map<string, Brand>`
- Current brand tracking: `currentBrandId: string | null`
- Auto-creates "Primary" brand if none exist
- `ensureDefaultBrand()` called on relevant endpoints

### Step 2: Brand Scoping

**Resources Scoped by brandId:**

1. **Autopilot Brief** (`/api/autopilot/brief`)
   - Changed from single `autopilotBrief` to `autopilotBriefs: Map<string, AutopilotBrief>`
   - Keyed by `brandId`
   - GET/PUT filter by `currentBrandId`

2. **Events** (`/api/events`)
   - Added `brandId?` to `Event` interface
   - POST attaches `currentBrandId`
   - GET filters by `currentBrandId`

3. **Posts** (`/api/posts`)
   - Added `brandId?` to `Post` interface
   - POST/POST bulk attach `currentBrandId`
   - GET filters by `currentBrandId`

4. **Publish Jobs** (`/api/publish-jobs`)
   - Added `brandId?` to `PublishJob` interface
   - POST attaches `currentBrandId`
   - GET filters by `currentBrandId`

**Scoping Strategy:**
- Backend uses `currentBrandId` server-side (from in-memory state)
- When creating resources, attach `brandId = currentBrandId`
- When listing, filter by `(resource.brandId || 'default') === currentBrandId`
- Backwards compatible: missing `brandId` treated as 'default'

### Step 3: Brand Switcher UI

**Files Changed:**
- `src/types/app.ts` - Added `Brand` interface
- `src/sdk/services/api-services.ts` - Added `brandsApi`
- `src/hooks/use-api.ts` - Added brand hooks
- `src/routes/index.tsx` - Added `BrandSwitcher` component

**Brand Switcher Component:**
- Located in top header bar (right side, before notifications)
- Shows circular avatar + brand name
- Dropdown shows:
  - List of all brands (avatar + name)
  - Current brand highlighted with checkmark
  - "Manage Brands..." link
- On selection: calls `PUT /api/brands/current`, invalidates React Query cache

**Hooks:**
- `useBrands()` - List brands
- `useCurrentBrand()` - Get current brand
- `useSetCurrentBrand()` - Switch brand (invalidates brand-scoped queries)
- `useCreateBrand()`, `useUpdateBrand()`, `useDeleteBrand()`

### Step 4: Brand Settings Page

**Files Changed:**
- `src/routes/index.tsx` - Added `BrandsSettingsView` component

**Features:**
- Create brand (name + avatarUrl)
- Edit brand
- Delete brand (prevents deleting last)
- Select/switch brand
- Shows current brand badge

**Route:**
- Added "brands" view to App routing
- Accessible via "Manage Brands..." in switcher dropdown

## Files Changed

### Backend
- `server/src/types.ts` - Added Brand interface, added brandId to Post, PublishJob, Event, AutopilotBrief
- `server/src/index.ts` - Added brand endpoints, scoped resources by brandId

### Frontend
- `src/types/app.ts` - Added Brand interface, added brandId to Post, PublishJob, Event, AutopilotBrief
- `src/sdk/services/api-services.ts` - Added brandsApi
- `src/hooks/use-api.ts` - Added brand hooks
- `src/routes/index.tsx` - Added BrandSwitcher, BrandsSettingsView

## Endpoints Added

1. `GET /api/brands` - List brands
2. `POST /api/brands` - Create brand
3. `PUT /api/brands/:id` - Update brand
4. `DELETE /api/brands/:id` - Delete brand
5. `GET /api/brands/current` - Get current brand
6. `PUT /api/brands/current` - Set current brand

## Brand-Scoped Resources

| Resource | Scoping Method | Notes |
|----------|---------------|-------|
| Autopilot Brief | `autopilotBriefs: Map<brandId, Brief>` | Stored per brand |
| Events | `brandId` field, filtered on GET | Attached on POST |
| Posts | `brandId` field, filtered on GET | Attached on POST/POST bulk |
| Publish Jobs | `brandId` field, filtered on GET | Attached on POST |

## Clickpath to Test

1. **Create 3 Brands**
   - Click brand switcher in header → "Manage Brands..."
   - Create "Kinetic Grappling" (avatar URL optional)
   - Create "Kinetic Publishing"
   - Create "Iris Influencer"

2. **Set Brief for Each Brand**
   - Switch to "Kinetic Grappling"
   - Go to Autopilot → Fill brief: Industry "BJJ gym", Goal "Community", Tone "confident, friendly"
   - Switch to "Kinetic Publishing"
   - Fill brief: Industry "Publishing", Goal "Brand Awareness", Tone "professional, authoritative"
   - Switch to "Iris Influencer"
   - Fill brief: Industry "Influencer", Goal "Traffic", Tone "casual, relatable"

3. **Create Events for Each Brand**
   - Switch to "Kinetic Grappling"
   - Create event: "BJJ Tournament", next-day
   - Generate drafts → See drafts for this brand
   - Switch to "Kinetic Publishing"
   - Create event: "Book Launch", same-day
   - Generate drafts → See different drafts
   - Switch to "Iris Influencer"
   - Create event: "Product Review", next-day
   - Generate drafts → See different drafts

4. **Verify Brand Scoping**
   - Switch between brands using header switcher
   - **Expected**: 
     - Brand avatar/name updates in switcher
     - Autopilot brief changes per brand
     - Events list shows only that brand's events
     - Posts list shows only that brand's posts
     - Drafts reflect brief settings (tone, CTA, etc.)

5. **Test Persistence**
   - Refresh page
   - **Expected**: 
     - Current brand stays selected
     - Data still scoped correctly
     - Brief persists per brand
     - Events/posts remain brand-scoped

## Example Output

### Brand Switcher
- Shows: Avatar (or initial) + "Kinetic Grappling" + dropdown arrow
- Dropdown: List of 3 brands, current highlighted, "Manage Brands..." link

### Draft Post (Kinetic Grappling brand)
```
BJJ Tournament

Had an amazing session today!

[Post should maintain confident, friendly tone]

Join our free trial class

[No client names to be used]
```

### Draft Post (Kinetic Publishing brand)
```
Book Launch

Excited to announce our latest release!

[Post should maintain professional, authoritative tone]

Pre-order now and get 20% off
```

## Non-Negotiables Met

✅ Minimal, safe, reversible changes
✅ No architecture rewrite
✅ Existing routes work (default to Primary brand)
✅ In-memory backend shim (structured for future persistence)
✅ Backwards compatible (missing brandId = 'default')
✅ No auth changes
✅ No OAuth token storage changes

## Notes

- Brand switching invalidates React Query cache for brand-scoped resources
- Current brand persists server-side in memory (will need persistence layer later)
- All brand-scoped resources use `brandId || 'default'` for backwards compatibility
- Brand switcher appears in header on all pages
- Brand settings accessible via switcher dropdown
