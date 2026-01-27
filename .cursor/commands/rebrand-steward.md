# /rebrand-steward

You are editing this repo to complete a full rebrand to **Steward** with zero legacy branding remaining, and to implement a consistent design-token system plus UI consistency improvements.

## Inputs
- **OLD_BRAND_TERMS**: Defaults to `["Hostess", "hostess"]` if not provided. Discover any additional legacy terms via search.
- **MODES**: Confirm whether light-only, dark-only, or both modes are required (default: keep current light/dark behavior; add a missing mode only if already partially supported).

## Workflow (Plan → Implement → Verify)

### 1) Inventory
- Search for **OLD_BRAND_TERMS** (case-insensitive) across the repo.
- Pay special attention to:
  - HTML title/meta (`index.html`), manifest (`public/manifest.json`), PWA icons, and app labels.
  - Logo assets in `public/` and any brand-related SVG/PNG files.
  - CSS `background-image` and any `data:image` SVG/data URIs that may embed old logos.
  - In-app copy in `src/` (marketing pages, dashboard, empty states, error states).
  - Backend, deployment, and docs references in `server/`, `deploy/`, and root `.md` files.
- Locate theming/token system and component library:
  - Design tokens and CSS variables in `src/styles.css`.
  - UI primitives under `src/components/ui/`.
- Locate navigation/back behavior:
  - TanStack Router route tree (`src/routeTree.gen.ts`, `src/routes/**`).
  - App shell layout and nav (`src/components/AppShell.tsx`).
  - Back button contract (`src/components/BackButton.tsx`).
  - Any bespoke `navigate(-1)` or back handlers in `src/routes/app/index.tsx`.
- Locate onboarding/empty/error/loading flows:
  - Empty states (`src/components/ui/empty-state.tsx` and usages).
  - Loading skeletons (`src/components/ui/loading-skeleton.tsx`).
  - Build placeholder and error boundary (`src/components/HomepagePlaceholder.tsx`, `src/components/ErrorBoundary.tsx`).

### 2) Implement in Safe Chunks

#### Chunk A: App identity + in-app copy
- Set the app name to **Steward** everywhere using `src/config/brand.ts` as the source of truth:
  - `APP_NAME = "Steward"`.
  - `APP_HEADLINE = "First-Class Care for Your Brand’s Presence."`
  - `APP_SUBHEAD = "Steward autonomously publishes, monitors, and protects your social media—so you don’t have to."`
  - `APP_SHORT_TAGLINE = "Autonomous social media management with brand-safe guardrails."`
- Apply these constants to:
  - `index.html` `<title>` and `<meta name="description">`.
  - `public/manifest.json` `name` and `short_name`.
  - Marketing hero/headers in `src/pages/marketing/*.tsx`.
  - Key in-app intro/empty states (e.g. dashboard, build placeholder).

#### Chunk B: Assets
- Create a standardized **Steward** asset set under `public/brand/steward/`:
  - `steward-mark.svg`, `steward-mark-black.svg`, `steward-mark-white.svg`.
  - `steward-wordmark.svg`, `steward-wordmark-black.svg`, `steward-wordmark-white.svg`.
  - `steward-lockup-horizontal.svg`, `steward-lockup-horizontal-black.svg`, `steward-lockup-horizontal-white.svg`.
  - `steward-lockup-stacked.svg`, `steward-lockup-stacked-black.svg`, `steward-lockup-stacked-white.svg`.
- Replace or wire favicons and PWA icons:
  - Ensure `public/favicon.ico` and `public/manifest.json` icons point at Steward-branded assets.
- Update logo components:
  - `src/components/AppLogo.tsx` and `src/components/StewardLogo.tsx` should use the new SVG assets for `variant="lockup" | "mark"` and `theme="light" | "dark"`, with robust fallbacks.
- Remove or update:
  - Any CSS `background-image` pointing to old logos.
  - Any embedded `data:image` SVGs that reference the old brand.
  - Any default/demo logos that still show legacy branding.

#### Chunk C: Theme tokens
- Extend and normalize design tokens in `src/styles.css`:
  - **Core**: `--bg-app`, `--bg-surface`, `--bg-elevated`, `--bg-subtle`, `--text-primary`, `--text-secondary`, `--text-muted`, `--text-on-primary`, `--border-subtle`, `--border-strong`.
  - **Accent**: `--accent`, `--accent-hover`, `--accent-active`, `--ring` as the focus ring.
  - **Semantic**: `--success`, `--warning`, `--error`, `--info`, `--link`, `--link-visited`.
  - **Workflow status**: `--status-draft`, `--status-queued`, `--status-needs-approval`, `--status-approved`, `--status-publishing`, `--status-published`, `--status-failed`.
  - **Typography**: size/line-height tokens for H1/H2/H3/body/small/micro; consistent weights.
  - **Spacing/Elevation**: 4/8/12/16/24/32 spacing scale, radii, and shadows.
- Wire these tokens into Tailwind via the `@theme` block.
- Refactor core components in `src/components/ui/` (buttons, inputs, cards, tables, toasts, modals, badges) to use semantic utilities bound to these tokens instead of arbitrary color classes.
- Ensure:
  - Visible focus rings (`outline` + `ring`) on all focusable components.
  - AA contrast for text in both light and dark modes.
  - Distinct disabled states.

#### Chunk D: Navigation + back-button contract
- Confirm and, if needed, refine the IA:
  - Top-level destinations (e.g., Dashboard, Autopilot, Email, Queue, Calendar, Inbox, Analytics, Campaigns, Assets, Accounts, Settings).
  - Implemented in `src/components/AppShell.tsx` and route structure in `src/routes/**`.
- Enforce a shared back-button contract in `src/components/BackButton.tsx`:
  - First clear transient context (editing post, selected conversation, wizards) when appropriate.
  - Then use real history (router/back) when safe.
  - Fallback to a logical parent (typically Dashboard).
  - Preserve filters/search/sort/brand selection/scroll via store or route params.
  - Support keyboard shortcuts (Alt+Left, Cmd+[) and be accessible (aria-label, tooltip).
- Replace bespoke `navigate(-1)` usages with the shared contract where possible, or document exceptions (e.g., internal wizard step back).

#### Chunk E: Docs/specs
- Add design docs under `design-system/`:
  - `BrandKit.md`: assets, logo usage, color and typography tokens, examples.
  - `DesignSystem.md`: component library, states, spacing, elevation, motion.
  - `NavigationSpec.md`: information architecture, nav items, back-button rules.
  - `OnboardingSpec.md`: onboarding journey, default settings, guidance.
  - `UIAcceptanceChecklist.md`: per-screen checklist for titles, primary actions, states, and accessibility.

### 3) Verify
- Run automated checks:
  - `npm run lint:mcp`, `npm run lint:radix`, `npm run test` (if configured), and `npm run build`.
- Add and run a branding guardrail:
  - New script (for example `npm run check:branding`) that fails if **OLD_BRAND_TERMS** appear in the codebase outside an allowlist (e.g., historical changelog entries or explicit migration docs).
- Manual UI smoke (after hard refresh + cache clear):
  - No legacy brand name/logo appears in any screen, including marketing pages, dashboard, empty/error/loading states, and demo data.
  - Favicons and PWA icons display Steward.
  - Light/dark modes both look coherent with readable contrast and visible focus.
  - Back-button behavior matches the contract and preserves context.

### 4) Review & Rollback
- Keep each chunk (identity, assets, tokens, nav/back, docs/guardrails) in separate commits or at least separable diffs so you can revert one area without affecting others.
- If branding checks or tests fail, fix the offending references or temporarily extend the allowlist only for deliberate historical mentions.

