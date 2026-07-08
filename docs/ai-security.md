# AI security

## Server-only OpenAI

- `OPENAI_API_KEY` lives only on Railway backend
- OpenAI SDK imported only under `server/src/ai/`
- Run `node scripts/check-openai-security.mjs` in CI

## Prompt injection

- User text sanitized via `guardrails.ts`
- User content wrapped as untrusted
- System/brand context separated from user input
- Auto-publish instructions rejected

## Auth & RLS

- All `/api/ai/*` routes require Supabase JWT
- Org membership verified before AI runs
- Editor roles required (`owner`, `admin`, `strategist`, `editor`, `manager`, `publisher`)
- `ai_jobs_safe` view hides raw prompts from clients

## Publishing

AI never publishes directly. Moderation + approval gates required before scheduling/publishing.

## Logging

Logs redact `sk-*` tokens and Bearer headers. Do not log raw OAuth or service role keys.
