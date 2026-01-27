# Brand Steward – Rebrand Legacy Terms to Steward

Run this when you need to find and replace remaining legacy brand terms (e.g. Hostess) with Steward in user-facing strings only.

## Inputs

- **OLD_BRAND_TERMS**: `["Hostess","hostess"]` (or read from `config/scripts/check-branding.mjs` → `LEGACY_TERMS`).
- **Allowlist**: `config/scripts/check-branding.mjs` → `ALLOWLIST` (do not replace in these files).

## Steps

1. **Search** the codebase for `OLD_BRAND_TERMS` (grep in `src`, `server`, `public`, `*.html`, `*.json`, `*.md`), respecting the allowlist in `check-branding.mjs`.
2. **Replace** with `Steward` in **user-facing strings only**. Do **not** replace in:
   - Allowlisted files
   - Stable identifiers: API routes (e.g. `/api/oauth/meta/callback`), `localStorage` keys (e.g. `steward_active_brand_id`, `auth_token`), OAuth callback paths
3. **Verify** that `index.html` (title, `meta name="description"`), `public/manifest.json` (`name`, `short_name`), and `src/config/brand.ts` use Steward.
4. **Run** `npm run check:branding`.
5. **Output** a short checklist of remaining manual steps for the user.

## Output – Checklist of Remaining Manual Steps

After running the steps above, report:

- [ ] Upload real Steward logo to `public/brand/steward/` and replace `public/favicon.ico` if needed.
- [ ] Add or replace `public/og-steward.png` (1200×630) if required for social sharing.
- [ ] Update app/store listings (names, descriptions, screenshots) if applicable.
- [ ] Update OAuth app names and consent screens in Google / Meta developer consoles if they still say Hostess.
- [ ] Update any email templates or external copy that reference the old brand.
