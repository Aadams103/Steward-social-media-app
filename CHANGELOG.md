# Changelog

All notable changes to the Hostess Social Media App will be documented in this file.

## Phase 0 - Fix White Screen (2024-12-XX)

### Fixed
- **Auth Blocking in Dev Mode**: Made authentication optional in development mode to allow local development without auth tokens
  - Modified `src/sdk/core/request.ts` to check `import.meta.env.DEV` and skip auth requirement in dev mode
  - This allows the app to run locally without requiring authentication tokens

- **Query Parameters Serialization**: Fixed API services to properly serialize query parameters into URLs
  - Added `buildUrlWithParams` helper function in `src/sdk/services/api-services.ts`
  - Updated all `list` methods (posts, campaigns, socialAccounts, conversations, alerts, publishJobs) to use the helper
  - Fixed `getScheduledSlots` to properly serialize Date parameters

- **API Client Error Handling**: Improved error handling in API client to properly convert `PlatformRequestError` to `ApiRequestError`
  - Updated `src/sdk/core/api-client.ts` to handle `PlatformRequestError` exceptions
  - Improved retry logic for both `PlatformRequestError` and `ApiRequestError`
  - Better handling of network errors with proper retry delays

- **Backend Stub Endpoints**: Added stub endpoints to prevent white screen crashes on initial render
  - Added `/api/campaigns` endpoint (returns empty array)
  - Added `/api/social-accounts` endpoint (returns empty array)
  - Added `/api/conversations` endpoint (returns empty array)
  - Added `/api/alerts` endpoint (returns empty array)
  - Added `/api/organizations/:id/quota/usage` endpoint (returns empty array)
  - Added `/api/organizations/:id/autopilot/brand-profile` endpoint (returns stub object)
  - Added `/api/organizations/:id/autopilot/settings` endpoint (returns existing settings)
  - Added `/api/organizations/:id/autopilot/slots` endpoint (returns empty array)

### Verified
- **ErrorBoundary**: Confirmed ErrorBoundary is properly set up in `src/routes/__root.tsx` and will catch React errors
- **Base Path**: Confirmed `vite.config.js` sets base to "/" in development mode
- **Runtime**: Removed legacy runtime dependencies
- **Mount Point**: Confirmed React mounts to `document.getElementById("app")` in `index.html` and `src/main.tsx`

### Files Modified
- `src/sdk/core/request.ts` - Made auth optional in dev mode
- `src/sdk/core/api-client.ts` - Improved error handling
- `src/sdk/services/api-services.ts` - Fixed query params serialization
- `server/src/index.ts` - Added stub endpoints

### Next Steps (Phase 1)
- Replace in-memory backend with real persistence (Prisma + SQLite/Postgres)
- Implement proper backend endpoints for all API services
- Migrate views from mock data to React Query hooks
