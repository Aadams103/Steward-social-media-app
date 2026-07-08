# AI operations

| Operation | Endpoint | Structured output |
|-----------|----------|-------------------|
| Media analysis | `POST /api/ai/analyze-media` | `MediaAnalysisResult` |
| Post draft | `POST /api/ai/generate-post-draft` | `PostDraftResult` |
| Platform variants | `POST /api/ai/generate-platform-variants` | `PlatformVariantResult` |
| Schedule recommendation | `POST /api/ai/recommend-schedule` | `ScheduleRecommendationResult` |
| Content score | `POST /api/ai/score-content` | `ContentScoreResult` |
| Moderation | `POST /api/ai/moderate-content` | `ModerationResult` |

## Request body (common)

```json
{
  "organizationId": "uuid",
  "brandId": "uuid"
}
```

Pass `x-brand-id` header or `brandId` in body.

## Persistence

- `generate-post-draft` with `persistDraft: true` creates a Supabase post draft
- `generate-platform-variants` with `persistVariants: true` upserts `post_variants`
- Media analysis optionally updates asset `visual_analysis` when `assetId` provided

## Job tracking

Every call creates an `ai_jobs` row. Poll `GET /api/ai/jobs/:jobId` for safe status (uses `ai_jobs_safe` view).

## Autopilot / Flight AI

Existing Autopilot endpoints remain unchanged (rule-based shim). Flight AI now also shows **Steward AI** panel for gateway-backed operations.
