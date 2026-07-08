# OpenAI environment variables

Set these on **Railway** (backend) only. Never in Vercel frontend env.

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `OPENAI_API_KEY` | Yes (for AI) | — | Server-only API key |
| `OPENAI_DEFAULT_MODEL` | No | `gpt-4.1-mini` | General operations |
| `OPENAI_REASONING_MODEL` | No | `gpt-4.1` | Strategy/scoring/scheduling |
| `OPENAI_VISION_MODEL` | No | `gpt-4.1-mini` | Media analysis |
| `OPENAI_EMBEDDING_MODEL` | No | `text-embedding-3-small` | Future search |
| `OPENAI_DRAFT_MODEL` | No | `gpt-4.1-mini` | Draft/variant generation |
| `OPENAI_MAX_OUTPUT_TOKENS` | No | `4096` | Response cap |
| `OPENAI_REQUEST_TIMEOUT_MS` | No | `120000` | Client timeout |
| `OPENAI_DAILY_ORG_BUDGET_CENTS` | No | `500` | Daily org spend cap |
| `OPENAI_MONTHLY_ORG_BUDGET_CENTS` | No | `5000` | Monthly org spend cap |

## Local development

Copy `server/.env.example` → `server/.env` and set `OPENAI_API_KEY`.

Without the key, AI endpoints return `503 AI_NOT_CONFIGURED` — the rest of the app continues to work.

## Vercel (frontend)

Do **not** add OpenAI variables to Vercel. Frontend calls Railway `/api/ai/*` with Supabase JWT.

## Staging vs production

Use separate OpenAI keys and lower budget caps in staging:

```
OPENAI_DAILY_ORG_BUDGET_CENTS=100
OPENAI_MONTHLY_ORG_BUDGET_CENTS=1000
```
