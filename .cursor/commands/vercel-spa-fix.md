# /vercel-spa-fix — Fix Vite React SPA routing on Vercel + case-sensitive imports

## Goal
Prevent Vercel refresh 404s for client-side routing and ensure builds pass on case-sensitive FS.

## Steps
1. Ensure root `vercel.json` exists and includes:
   - rewrites: source `/(.*)` -> destination `/index.html`
   - Merge with existing config safely.

2. Check `vite.config.*`
   - Ensure `build.outDir` is `dist` (or absent/default).

3. Check `package.json`
   - Ensure `build` is `vite build` OR `tsc && vite build` depending on TS usage.

4. Case-sensitive import audit
   - Scan `src` for import path casing mismatches and fix to match on-disk casing exactly.
   - Include alias-based paths if configured.

5. Verify
   - Run `npm run build` (and `npm test` if present).
   - Summarize files changed.

## Output format
- Bullet list of modified files and what changed.
- Paste verification command output summary (pass/fail).

