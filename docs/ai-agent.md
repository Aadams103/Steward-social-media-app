# Steward AI Social Media Agent

The agent is an approval-first orchestrator that keeps a brand's content
pipeline healthy without ever publishing on its own.

## Architecture

```
automation_rules (schedule_cron / run_ai_job)
        │  every 5 min (AGENT_WORKER_ENABLED=true)
        ▼
server/src/agent/worker.ts ──► runAgentCycle()
                                   │
        POST /api/agent/run ───────┤  (manual trigger, supports dryRun)
                                   ▼
                    server/src/agent/orchestrator.ts
                    1. verifyOrgMembership (accountable human identity)
                    2. getStewardBrandContext (trusted brand data only)
                    3. assessPipeline (drafts / review / schedule / accounts)
                    4. planAgentActions (pure, unit-tested planner)
                    5. executeAction → runAiGatewayOperation
                    6. ai_decision_logs + audit_logs + notifications
```

## Safety invariants

- **Never publishes.** Generated drafts get `needs_review`/`draft` status and
  enter the Approval Queue. Schedule recommendations are recorded for a human
  to apply.
- **All AI calls go through the AI Gateway** — budget enforcement, rate
  limits, moderation, prompt-injection guardrails, and context snapshots
  apply to every agent action.
- **No fabricated analytics.** `analytics-ingest.ts` aggregates only real
  `ingested_posts` rows into `content_insights` with honest `sample_size`;
  when there is no data, nothing is written.
- **Drafting pauses on critical brand-context gaps** (missing business name
  or brand voice) — the agent flags setup instead of inventing facts.
- **Bounded per cycle**: max 2 drafts, 3 variant ops, 3 schedule recs
  (configurable via rule `action_config.max_drafts_per_cycle`).
- **Accountable identity**: worker runs act as the rule creator or the org
  owner; every decision is recorded in `ai_decision_logs` and `audit_logs`.

## API

| Route | Method | Role | Purpose |
|-------|--------|------|---------|
| `/api/agent/run` | POST | editor+ | Run a cycle now (`dryRun` supported) |
| `/api/agent/status` | GET | member | Worker state, last run, rules |
| `/api/agent/decisions` | GET | member | Decision history |
| `/api/agent/rules` | POST | owner/admin | Create recurring rule |
| `/api/agent/rules/:id` | PATCH | owner/admin | Enable/disable rule |

## Environment

| Variable | Effect |
|----------|--------|
| `AGENT_WORKER_ENABLED=true` | Starts the 5-minute cron worker |
| `PUBLISH_WORKER_ENABLED=true` | Separate publishing worker (unchanged) |

## Data used

`organizations`, `organization_members`, `brands`, `brand_profiles`,
`posts`, `post_variants`, `social_accounts`, `ingested_posts`,
`content_insights`, `automation_rules`, `ai_jobs`, `ai_context_snapshots`,
`ai_decision_logs`, `audit_logs`, `notifications`.

## Frontend

`/app/autopilot` (Automations hub) provides: Run now / Dry run, worker
status, recurring rule create + toggle, per-cycle results, and full decision
history. Brand Intelligence → AI memory tab reviews agent-proposed memory
facts through `/api/ai/memory-facts`.
