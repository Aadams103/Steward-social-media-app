## Steward Onboarding Spec

### Goals

- Help new users understand what Steward does:
  - **Headline**: “First-Class Care for Your Brand’s Presence.”
  - **Subhead**: “Steward autonomously publishes, monitors, and protects your social media—so you don’t have to.”
- Encourage users to:
  - Select or create a brand.
  - Connect social accounts.
  - Configure Autopilot guardrails.

### Entry points

- **Marketing site**
  - Home hero (`src/pages/marketing/HomePage.tsx`) shows the Steward lockup and canonical headline/subhead via `APP_HEADLINE` and `APP_SUBHEAD`.
  - Primary CTA: “Get started” → `/app`.
- **In-app first run**
  - Dashboard and other views should:
    - Show clear empty states when there is no data.
    - Offer a primary action (e.g. “Connect an account”, “Create your first post”).

### Empty, loading, and error states

General guidance:

- Use the shared empty-state component where possible:
  - `src/components/ui/empty-state.tsx`
- Provide:
  - Concise title.
  - Short explanation with Steward context.
  - One clear primary action.
- Loading:
  - Use skeletons or subtle spinners that align with the Steward palette.
- Error:
  - Provide a clear message.
  - Offer recovery actions (retry, go back, contact support).

### Build / fatal error experience

- `src/components/HomepagePlaceholder.tsx` is the build error placeholder.
  - Uses `AppLogo` and `APP_NAME` for branding.
  - Provides rebuild and support options.

