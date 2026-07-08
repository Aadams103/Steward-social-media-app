# Steward AI Context Assembly

## Overview

Before any serious AI generation, Steward builds a **Brand Context Package** via `getStewardBrandContext()` and compiles it for prompts via `compileAIContextForOperation()`.

## Flow

```
Client request
  → AI Gateway (server/src/ai/gateway.ts)
  → verifyOrgMembership
  → getStewardBrandContext({ organizationId, brandId, userId, operation })
  → compileAIContextForOperation({ operation, stewardBrandContext, userRequest })
  → saveAiContextSnapshot (linked to ai_jobs.context_snapshot_id)
  → OpenAI structured output + Zod validation
```

## getStewardBrandContext

**Location:** `server/src/services/brand-intelligence.ts`

**Input:**

- `organizationId`, `brandId`, `userId` (required)
- `operation` (required)
- `platform`, `contentPillarId`, `assetIds`, `postId` (optional)

**Output:** `StewardBrandContext` — organization, brand, profile, preferences, pillars, audiences, hashtags, CTAs, schedules, rules, memory facts, recent posts, missing context warnings, etc.

**Rules:**

- Verifies org membership before any query.
- Only active / non-archived records.
- Never includes OAuth tokens or secrets.
- Adds `missingContext` warnings when required data is absent.

## compileAIContextForOperation

Produces separate prompt blocks:

| Block | Content |
|-------|---------|
| `systemContext` | Steward role + anti-hallucination rules |
| `brandContextBlock` | Approved JSON brand facts |
| `operationContext` | Operation name + target platform |
| `safetyContext` | Safety/approval rules + user review prefs |
| `userRequestContext` | Marked `[UNTRUSTED USER REQUEST]` |
| `outputSchemaRequirement` | Structured JSON schema name |
| `missingContextWarnings` | Gaps the AI must flag, not invent |

## Context snapshots

Every AI job saves the exact context used:

- Table: `ai_context_snapshots`
- Linked from `ai_jobs.context_snapshot_id`
- Hash: `context_hash` (SHA-256 of context JSON)

Use snapshots to debug wrong captions: compare `context_json` vs generated output.

## API preview

`GET /api/brand-intelligence/context?organizationId=&brandId=` returns a safe subset for admin UI (no secrets).
