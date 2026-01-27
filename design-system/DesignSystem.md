## Steward Design System

### Foundations

- **Typography**
  - Variables defined in `src/styles.css` under `:root`:
    - `--font-sans`, `--font-display`
    - `--text-h1`, `--text-h2`, `--text-h3`, `--text-body`, `--text-small`
    - `--font-weight-regular`, `--font-weight-medium`, `--font-weight-semibold`
- **Spacing**
  - 4/8/12/16/24/32 scale:
    - `--spacing-1` → `4px`
    - `--spacing-2` → `8px`
    - `--spacing-3` → `12px`
    - `--spacing-4` → `16px`
    - `--spacing-5` → `24px`
    - `--spacing-6` → `32px`
- **Motion**
  - Clicks and short transitions use:
    - `--motion-click`
    - `--motion-transition`
    - `--ease-default`
  - `prefers-reduced-motion` is respected via an override in `src/styles.css`.

### Color tokens

Core tokens in `src/styles.css`:

- **Surfaces & text**
  - `--background`, `--foreground`
  - `--card`, `--card-foreground`
  - `--popover`, `--popover-foreground`
  - Semantic aliases: `--bg-app`, `--bg-surface`, `--bg-elevated`, `--bg-subtle`
  - Text: `--text-primary`, `--text-secondary`, `--text-muted`, `--text-on-primary`
- **Sidebar / chrome**
  - `--sidebar`, `--sidebar-foreground`
  - `--sidebar-primary`, `--sidebar-primary-foreground`
  - `--sidebar-accent`, `--sidebar-accent-foreground`
  - `--sidebar-border`, `--sidebar-ring`
- **Accent & semantic**
  - Primary: `--primary`, `--primary-foreground`
  - Secondary/muted: `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`
  - Accent: `--accent`, `--accent-foreground`
  - Semantic:
    - `--success`, `--warning`, `--error`, `--info`
    - `--link`, `--link-visited`
  - Status:
    - `--status-draft`, `--status-queued`, `--status-needs-approval`
    - `--status-approved`, `--status-publishing`, `--status-published`, `--status-failed`
- **Borders & focus**
  - `--border`, `--input`, `--ring`
  - Shadows: `--shadow-xs`, `--shadow-sm`, `--shadow-md`
  - Radius: `--radius`

The `@theme inline` block in `src/styles.css` exposes these as Tailwind tokens (e.g. `bg-background`, `bg-sidebar`, `text-muted-foreground`).

### Components

Core primitives live under `src/components/ui/` and are wired to tokens:

- **Buttons** (`button.tsx`)
  - Variants use semantic classes (`bg-primary`, `bg-secondary`, `bg-destructive`, etc.).
  - Focus: visible outline via `outline-ring/50` from the base layer.
- **Inputs** (`input.tsx`, `textarea.tsx`, `select.tsx`)
  - Use `bg-background`, `border-input`, `text-foreground`.
  - Disabled states reduce contrast and change cursor.
- **Cards & surfaces** (`card.tsx`, `alert.tsx`, dialogs)
  - Use `bg-card`, `border-border`, and `shadow-*`.
- **Navigation** (sidebar/top bar)
  - `AppShell` leverages `bg-sidebar`, `text-sidebar-foreground`, `bg-sidebar-primary`, etc.

### Accessibility

- Aim for at least AA contrast for all text/background combinations.
- Maintain visible focus states for all keyboard-focusable elements.
- Ensure loading and disabled states are clearly distinct from active states.

