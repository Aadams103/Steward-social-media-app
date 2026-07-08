# Kinetic Grappling Seed Data

Demo-only seed for Steward Brand Intelligence. **Not hardcoded in product logic.**

## Usage

```sql
select public.seed_kinetic_grappling_brand_intelligence(
  '<organization_uuid>',
  '<brand_uuid>',
  '<user_uuid>'  -- optional, for user_brand_preferences
);
```

Or via API:

```http
POST /api/steward/demo/seed-kinetic-grappling
{ "organizationId": "...", "brandId": "..." }
```

Authenticated user ID is passed automatically for preferences.

## What gets seeded

| Category | Examples |
|----------|----------|
| Brand profile | Kinetic Grappling, College Station TX, kineticgrappling.com |
| Voice | Energetic, welcoming, family-friendly; avoid cringe/violence |
| Audience segments | Parents (Kids BJJ), Adult Beginners, Competitors |
| Content pillars | Student Success, Kids Confidence, Offers / Free Trial, etc. |
| Hashtags | #KineticGrappling, #getbettereveryday, #KidsBJJ |
| CTAs | Book a free trial, Visit kineticgrappling.com, DM us |
| Class schedule | Kids BJJ Mon/Wed 5:15–6:00, Gi Adult Mon/Tue 6:00–7:20, etc. |
| Brand rules | Kids name privacy, no violent language, no guaranteed results |
| Platform strategy | Instagram, Facebook, TikTok, YouTube |
| Memory facts | Location, website, personal hashtag, @KineticGrappling handle |

Also runs legacy `seed_kinetic_grappling_demo()` for backward compatibility.

## Safety notes in seed

- Kids content: family-friendly; no minor full names unless approved.
- Do not invent programs or class times — use seeded schedule only.

## Adding another business

Copy the seed function pattern or use Steward settings UI / API to populate the same tables for any organization. Do not modify application code for each client.
