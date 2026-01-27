## Steward Navigation & Back-Button Spec

### Information Architecture

Top-level in-app destinations (managed by the app store and `AppShell`):

- **Dashboard** (`id: "dashboard"`)
- **Autopilot** (`id: "autopilot"`)
- **Email** (`id: "email"`)
- **Compose** (`id: "compose"`)
- **Queue** (`id: "queue"`)
- **Calendar** (`id: "calendar"`)
- **Inbox** (`id: "inbox"`)
- **Analytics** (`id: "analytics"`)
- **Campaigns** (`id: "campaigns"`)
- **Assets** (`id: "assets"`)
- **Accounts** (`id: "accounts"`)
- **Settings** (routed via TanStack Router to `/settings`)

Implementation references:

- Sidebar and top bar layout: `src/components/AppShell.tsx`
- Route tree: `src/routeTree.gen.ts` and `src/routes/**`
- App state: `src/store/app-store.ts`

### Back-button contract

The back button is implemented in `src/components/BackButton.tsx` and follows this contract:

1. **Clear transient context first**
   - If a conversation is selected, clear it and return to the list.
   - If a post is being edited, exit edit mode and return to the previous list/view.
2. **Then use real history when safe**
   - If `window.history.length > 1`, call `window.history.back()` to respect browser history.
3. **Fallback**
   - If no meaningful history, fall back to the dashboard view via the app store.

Keyboard shortcuts:

- **Alt+Left**
- **Cmd+[** (on macOS)

The button is always present in the app top bar (`AppShell`), with an accessible `aria-label` and tooltip.

### State preservation

Filters, sort order, brand selection, and similar state are owned by `app-store` and/or route params.
The back button should not reset that state; it only changes view or clears ephemeral detail/edit context.

