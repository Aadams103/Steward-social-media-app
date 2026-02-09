# Supabase schema and TypeScript types

Backend domain types live in `server/src/types.ts` and should stay aligned with the live Supabase schema.

## Optional: generate types from Supabase

To detect drift or regenerate types from the database:

1. Install Supabase CLI and link the project (or use project ref).
2. From the repo root:
   ```bash
   npx supabase gen types typescript --project-id bffuipcmtlfatvxkcpeq > server/src/supabase-db-types.generated.ts
   ```
3. Compare with `server/src/types.ts`: either adopt the generated types for DB access or keep `types.ts` as the source of truth and use the generated file as a reference when changing the schema.

## CI

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs `npm run typecheck` in the server on every push/PR to `main`, so TypeScript and `server/src/types.ts` stay valid. When you add or change Supabase migrations, update `server/src/types.ts` (or the generated file) and ensure typecheck passes.
