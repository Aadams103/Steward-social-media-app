# Autopilot Verification + Event Upload MVP Implementation

## Summary

This document describes the implementation of:
1. **Autopilot Backend Integration** - Wired Autopilot settings to use real API endpoints
2. **Event Upload → Scheduled Drafts MVP** - Added minimal event creation and draft generation feature

## Step 1: Autopilot Backend Integration

### Changes Made

#### Backend (`server/src/index.ts`)
- ✅ Added `PATCH /api/organizations/:id/autopilot/settings` endpoint (was missing)
- ✅ Existing `GET /api/organizations/:id/autopilot/settings` endpoint confirmed working

#### Frontend (`src/routes/index.tsx`)
- ✅ Updated `AutopilotView` to use React Query hooks instead of store
- ✅ Added `useAutopilotSettings` and `useUpdateAutopilotSettings` hooks
- ✅ Settings now persist to backend via API calls
- ⚠️ Note: `OperatingModeSelector` component still uses store (can be updated separately if needed)

#### API Hooks (`src/hooks/use-api.ts`)
- ✅ Added `useUpdateAutopilotSettings` mutation hook

### Verification Checklist

To verify Autopilot is wired to backend:

1. **Open Autopilot page with DevTools Network tab**
   - Navigate to Autopilot view
   - Open browser DevTools → Network tab

2. **Test Settings Changes**
   - Change "Approval Window" dropdown
   - **Expected**: Network request to `PATCH /api/organizations/org1/autopilot/settings`
   - Toggle "Web Research" switch
   - **Expected**: Network request to `PATCH /api/organizations/org1/autopilot/settings`
   - Change platform cadence values
   - **Expected**: Network request to `PATCH /api/organizations/org1/autopilot/settings`

3. **Test Persistence**
   - Change any Autopilot setting
   - Refresh the page
   - **Expected**: Settings persist (loaded from `GET /api/organizations/org1/autopilot/settings`)

4. **Test Approval → Publish → Job Lifecycle**
   - Click "Approve" on a pending approval item
   - **Expected**: Network request to approve endpoint
   - Click "Publish" on an approved post
   - **Expected**: 
     - Network request to `POST /api/posts/:id/publish`
     - Creates publish job (visible in Network tab)
     - WebSocket event: `publish_job_updated` (status: queued → processing → completed)
     - Post status updates in realtime

### Endpoints Used

- `GET /api/organizations/:id/autopilot/settings` - Load settings
- `PATCH /api/organizations/:id/autopilot/settings` - Update settings
- `POST /api/posts/:id/approve` - Approve post
- `POST /api/posts/:id/publish` - Publish post (creates job)
- WebSocket: `publish_job_updated` event - Job status updates

## Step 2: Event Upload → Scheduled Drafts MVP

### Changes Made

#### Backend (`server/src/index.ts`)
- ✅ Added `POST /api/events` - Create event
- ✅ Added `GET /api/events?from=YYYY-MM-DD&to=YYYY-MM-DD` - List events
- ✅ Added `POST /api/events/:id/generate-drafts` - Generate draft posts from event

#### Backend Types (`server/src/types.ts`)
- ✅ Added `Event` interface

#### Frontend Types (`src/types/app.ts`)
- ✅ Added `Event` interface

#### API Service (`src/sdk/services/api-services.ts`)
- ✅ Added `eventsApi` with `list`, `get`, `create`, `generateDrafts` methods

#### API Hooks (`src/hooks/use-api.ts`)
- ✅ Added `useEvents` query hook
- ✅ Added `useEvent` query hook
- ✅ Added `useCreateEvent` mutation hook
- ✅ Added `useGenerateEventDrafts` mutation hook

#### Frontend UI (`src/routes/index.tsx`)
- ✅ Added `EventsPanel` component inside Autopilot view
- ✅ Form fields: Title, Event Date, Post When (same-day/next-day), Notes, Asset picker
- ✅ "Generate Drafts" button that creates 1-3 draft posts
- ✅ Draft posts appear in existing Posts/Queue flow

### Event API Endpoints

- `POST /api/events`
  - Body: `{ title, eventDate (YYYY-MM-DD), postWhen ("same-day" | "next-day" | ISO datetime), notes?, assetIds[] }`
  - Returns: Created event

- `GET /api/events?from=YYYY-MM-DD&to=YYYY-MM-DD`
  - Returns: `{ events: Event[], total: number }`

- `POST /api/events/:id/generate-drafts`
  - Creates 1-3 Draft Posts (one per platform: facebook, instagram, linkedin)
  - Scheduled based on `postWhen`:
    - `same-day`: 9 AM on event date
    - `next-day`: 9 AM the day after event
    - Custom ISO datetime: uses provided datetime
  - Returns: `{ posts: Post[], count: number }`

### Testing the Event Flow

**Click-by-click test path:**

1. **Navigate to Autopilot page**
   - Click "Autopilot" in sidebar

2. **Create an Event**
   - Scroll to "Events" panel
   - Click "Add Event"
   - Fill in:
     - Title: "Visiting BJJ gym class"
     - Event Date: (select a future date)
     - Post When: "Next Day"
     - Notes: (optional)
     - Assets: (optional, select from available assets if any)
   - Click "Create Event"
   - **Expected**: Toast success, event appears in "Recent Events" list

3. **Generate Drafts**
   - Click "Generate Drafts" button on the event
   - **Expected**: 
     - Toast: "Generated 3 draft posts!"
     - Network request: `POST /api/events/:id/generate-drafts`
     - Draft posts created with status "draft"

4. **View Drafts in Posts/Queue**
   - Navigate to "Posts" or "Queue" view
   - **Expected**: See the generated draft posts
   - Posts should have:
     - Content: Event title + notes
     - Status: "draft"
     - Scheduled time: Next day at 9 AM (if postWhen was "next-day")
     - Platform: facebook, instagram, linkedin (one post each)

5. **Approve and Publish**
   - Click on a draft post
   - Approve it (if in approval mode)
   - Publish it
   - **Expected**: 
     - Publish job created
     - Job updates via WebSocket
     - Post status changes to "published"

## Files Changed

### Backend
- `server/src/index.ts` - Added Events API endpoints, PATCH autopilot settings
- `server/src/types.ts` - Added Event interface

### Frontend
- `src/types/app.ts` - Added Event interface
- `src/sdk/services/api-services.ts` - Added eventsApi
- `src/hooks/use-api.ts` - Added Events hooks, useUpdateAutopilotSettings
- `src/routes/index.tsx` - Updated AutopilotView to use API hooks, added EventsPanel

## Non-Negotiables Met

✅ Minimal safe changes only
✅ No SDK architecture refactoring
✅ No OAuth refresh token client-side storage
✅ Uses existing Posts schema
✅ Draft posts appear in existing Posts/Queue flow
✅ Publish jobs update in realtime like Vertical Slice

## Next Steps for Full Verification

1. **Test Autopilot Settings Persistence**
   - Change settings, refresh page, verify they persist

2. **Test Approval → Publish Flow**
   - Monitor Network tab for all API calls
   - Verify WebSocket events arrive for job updates

3. **Test Event → Draft → Publish Flow**
   - Create event, generate drafts, approve, publish
   - Verify all steps work end-to-end

## Notes

- Organization ID defaults to `'org1'` (from `currentOrganization?.id || 'org1'`)
- Events are stored in-memory (backend shim) - will need database persistence for production
- Generated drafts use platforms: facebook, instagram, linkedin (hardcoded for MVP)
- Asset selection is optional - if no assets exist, the picker won't show
