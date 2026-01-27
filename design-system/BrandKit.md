## Steward Brand Kit

### Logo system

- **Primary lockup**: Steward mark + wordmark in a horizontal lockup.
  - Light-on-dark: `/brand/steward/steward-lockup-horizontal-white.svg`
  - Dark-on-light: `/brand/steward/steward-lockup-horizontal-black.svg`
- **Mark only**: Icon without wordmark.
  - Light-on-dark: `/brand/steward/steward-mark-white.svg`
  - Dark-on-light: `/brand/steward/steward-mark-black.svg`

Usage rules:

- **Navigation chrome** (sidebar/top bar):
  - Use the **light** variant (`scheme="light" | theme="light"`) on dark chrome backgrounds.
  - Use the **mark** variant at compact sizes (e.g. collapsed sidebar).
- **Marketing/hero and light surfaces**:
  - Use the **dark** lockup (`scheme="dark" | theme="dark"`) on light backgrounds.
- Never stretch, skew, or recolor the logo files. Always use the shipped SVGs.

Implementation references:

- `AppLogo` (`src/components/AppLogo.tsx`) selects between:
  - Brand-specific logo URLs (with cache-busting).
  - Steward lockups at `/brand/steward/*` with legacy `/steward-logo-*.svg` fallbacks.
- `StewardLogo` (`src/components/StewardLogo.tsx`) renders Steward-only lockups/marks with the same asset set.

### Color palette

- **Chrome / sidebar**: Deep navy/charcoal via `--sidebar` and related tokens.
- **Surfaces**: Light slate/gray (`--background`, `--card`, `--popover`).
- **Primary accent**: Steel/graphite tone via `--primary`.
- **Semantic**: Muted professional colors for success/warning/error/info.

See `DesignSystem.md` for the full token list.

### Typography

- Primary font: `--font-sans` / `--font-display` (system UI sans).
- Scale:
  - `--text-h1`, `--text-h2`, `--text-h3`
  - `--text-body`, `--text-small`
- Weights:
  - `--font-weight-regular`
  - `--font-weight-medium`
  - `--font-weight-semibold`

Use headings sparingly and favor comfortable line-heights for reading.

