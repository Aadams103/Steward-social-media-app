# Known Issues — Steward Backend Wiring

## Server typecheck environment noise

### Command

```bash
cd server && npm run typecheck
```

Equivalent strict build:

```bash
cd server && npm run build:strict
```

### Representative error category

Pre-existing `@types/*` and Node/Express ambient type conflicts unrelated to Steward UI or workspace wiring changes. Examples often include duplicate identifier declarations across `@types/node`, `@types/express`, or transitive dependency type packages.

### Why unrelated to current phase

The production **frontend** build (`npm run build` at repo root) succeeds. Recent backend wiring (workspace API, AI jobs list, approvals, publish health, analytics summary, memory facts) uses explicit types in route handlers and does not depend on silencing these ambient declaration issues.

### Proposed fix

1. Isolate server `tsconfig.json` `types` array to only required Node/Express entries.
2. Align `@types/node` major version with Node 22 runtime.
3. Consider `skipLibCheck: true` only in server tsconfig (not frontend) after auditing impact.
4. Regenerate `supabase-db-types.generated.ts` to include `ai_memory_facts`, `ai_context_snapshots` tables added in brand intelligence migrations.

### Risk level

**Low** for production frontend/Vercel deploy. **Medium** for catching real server regressions until server typecheck is clean.

### Owner / TODO

- [ ] Track in next infra sprint
- [ ] Do not disable frontend typechecking
- [ ] Do not silence errors introduced by workspace/approval/AI job routes

---

## Remaining product gaps (honest)

| Area | Status |
|------|--------|
| Org creation via onboarding UI | Workspace loads existing Supabase orgs; org **creation** API not yet exposed |
| AI job safe retry | Detail drawer exposes `can_retry` flag; retry endpoint not implemented |
| Shim vs Supabase posts | In-memory shim still serves demo when `organizationId` query is absent |
| `routeTree.gen.ts` | Regenerates on `vite` dev/build after new `/app/$view` route |

---

## Security notes

All new endpoints require authenticated user and verify organization membership via `verifyOrgMembership` / `assertWorkspaceAccess`. AI job responses use `ai_jobs_safe` view and redact error messages. Analytics returns `has_data: false` when tables are empty — no fabricated metrics.
