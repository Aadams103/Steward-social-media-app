# Steward AI Gateway

Central OpenAI layer for Steward. **All AI features must call the gateway — never OpenAI directly.**

## Architecture

```
Client (React) → POST /api/ai/* → routes/ai.ts → ai/gateway.ts → OpenAI Responses API
                                                      ↓
                                               ai_jobs (Supabase)
```

- **Frontend:** `aiApi` in `src/sdk/services/api-services.ts`, UI in `src/components/ai/StewardAiActions.tsx`
- **Server:** `server/src/ai/*` (gateway, schemas, prompts, guardrails, rate limits, cost)
- **Routes:** `/api/ai/analyze-media`, `/generate-post-draft`, `/generate-platform-variants`, `/recommend-schedule`, `/score-content`, `/moderate-content`, `GET /api/ai/jobs/:jobId`
- **Logging:** JSON logs via `ai/logging.ts` (no secrets)
- **Jobs:** `ai_jobs` table + `ai_jobs_safe` view

## Adding a new AI operation

1. Add Zod schema in `server/src/ai/schemas.ts`
2. Register in `OPERATION_SCHEMA_MAP` and `OPERATION_MODEL_MAP` in `types.ts`
3. Add prompt in `prompts.ts` with version
4. Add user prompt builder in `operations/prompt-builders.ts`
5. Extend `buildUserPrompt()` in `gateway.ts`
6. Add Zod request schema + handler in `routes/ai.ts`
7. Add `aiApi` method on frontend
8. Add tests in `server/src/ai/__tests__/`

## Structured outputs

Every DB-affecting operation uses OpenAI Responses API `json_schema` + Zod validation. On failure, one repair retry is attempted.

## What not to do

- Do not import `openai` outside `server/src/ai/`
- Do not use `NEXT_PUBLIC_OPENAI_*`
- Do not auto-publish from AI responses
- Do not skip org membership checks

See also: `docs/openai-env.md`, `docs/ai-operations.md`, `docs/ai-security.md`, `docs/ai-cost-controls.md`

## Vercel + Railway deployment

| Component | Host | Notes |
|-----------|------|-------|
| Frontend | Vercel | SPA only — no OpenAI env vars |
| Backend + AI Gateway | Railway | Set all `OPENAI_*` vars here |
| Database | Supabase Steward-prod | `ai_jobs`, RLS, `ai_jobs_safe` view |

**Serverless timeout risk:** Long media/video analysis may exceed Railway/HTTP timeouts. For heavy jobs, enqueue `ai_jobs` with `status=queued` and process via a background worker (same pattern as `publish_jobs` scheduler).

**Recommended next step:** Add `AI_WORKER_ENABLED` cron worker to claim queued `ai_jobs` for operations >60s.

