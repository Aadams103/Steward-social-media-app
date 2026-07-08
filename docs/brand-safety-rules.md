# Steward Brand Safety Rules

## Pre-publish pipeline

Before AI content becomes publishable:

1. **Structured output validation** (Zod schemas in `server/src/ai/schemas.ts`)
2. **Brand rules** (`brand_rules` table — severity: info, warning, block)
3. **Moderation** (`moderate-content` AI operation)
4. **Platform requirements** (`platform_strategy.media_requirements`)
5. **Approval rules** (user prefs + `approval_required` on platform strategy)
6. **Schedule conflicts** (recurring_schedules overlap check)
7. **Duplicate / similar content** (recent posts in context)
8. **Fact verification** — output must list `brand_facts_used` and `assumptions_made`

## High-risk triggers (human review required)

- Kids / minors content (`kids_content` rules)
- Health / fitness claims (`claims` rules)
- Prices / promotions / offers
- Legal or medical claims
- Testimonials naming individuals
- Low AI confidence (`confidence_score < threshold`)
- Any reference to a person by name
- `safety_flags` non-empty in structured output

## Rule types

| Type | Example |
|------|---------|
| `forbidden` | No violent fight-bro language |
| `required` | Offer posts include free trial CTA |
| `approval_required` | Kids class posts need review |
| `kids_content` | No minor full names without approval |
| `claims` | No guaranteed results |
| `safety` | Family-friendly language for kids |
| `publishing` | Never auto-publish low media confidence |

## content_safety_reviews

Stores results from moderation + brand rule checks:

- `risk_level`, `approved`, `human_review_required`
- `policy_flags`, `brand_rule_flags`, `platform_flags`

## Hard rules

- AI cannot publish without passing approval logic.
- AI cannot invent business facts — use `missing_context` instead.
- OAuth tokens never enter AI context.
