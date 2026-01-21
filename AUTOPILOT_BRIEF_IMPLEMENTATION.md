# Autopilot Brief Implementation

## Summary

This document describes the implementation of the Autopilot Brief feature, which allows users to configure their brand profile, goals, audience, platforms, voice, and constraints. The brief is then used to generate strategy plans and influence draft post generation.

## Implementation Details

### Step 1: AutopilotBrief Model (Backend)

**Files Changed:**
- `server/src/types.ts` - Added AutopilotBrief, StrategyPlan, and related types
- `server/src/index.ts` - Added in-memory storage and endpoints

**Model Fields:**
- `id`, `orgId`, `brandName`, `subjectType`, `industry`
- `primaryGoal`, `secondaryGoals`, `targetAudience`, `offer`, `location`
- `platforms[]` (platform, priority, postingCadencePerWeek)
- `voice` (tone, doSay, dontSay)
- `brandAssets` (colors, handles, hashtags)
- `constraints` (complianceNotes, noFaceKids, noClientNames)
- `successMetrics[]`
- `createdAt`, `updatedAt`

**Endpoints:**
- `GET /api/autopilot/brief` - Returns brief or empty shape
- `PUT /api/autopilot/brief` - Upsert brief

### Step 2: Autopilot Onboarding UI

**Files Changed:**
- `src/types/app.ts` - Added frontend types matching backend
- `src/sdk/services/api-services.ts` - Added `autopilotBriefApi`
- `src/hooks/use-api.ts` - Added hooks: `useAutopilotBrief`, `useUpdateAutopilotBrief`, `useGenerateStrategyPlan`
- `src/routes/index.tsx` - Added `AutopilotBriefForm` and `AutopilotBriefSummary` components

**UI Sections:**
1. **Business/Creator Basics** - Brand name, subject type, industry, location
2. **Goals + Offer** - Primary goal, offer description
3. **Audience** - Target audience description
4. **Platforms + Cadence** - Add platforms with priority and posts/week
5. **Voice + Constraints** - Tone, doSay/dontSay, compliance notes, constraints

**Behavior:**
- If no brief exists → Shows "Set up Autopilot" card with form
- If brief exists → Shows summary card with "Edit Brief" button
- Edit button toggles edit form inline

### Step 3: Strategy Plan Generation

**Endpoint:**
- `POST /api/autopilot/plan` - Generates StrategyPlan from brief

**StrategyPlan Response:**
- `contentPillars[]` - 3-5 pillars with description and examples
- `weeklyCadence[]` - Posting schedule by platform
- `recommendedPostTypes[]` - Platform-specific post types
- `ctaGuidance` - CTA recommendations
- `thirtyDayStarterPlan[]` - 30-day content calendar

**Implementation:**
- Rule-based templates (no AI required for MVP)
- Industry-specific logic (e.g., BJJ gym gets training tips + community pillars)
- Goal-based pillar generation
- Platform-specific post type recommendations

### Step 4: Draft Generation Uses Brief

**Updated:**
- `POST /api/events/:id/generate-drafts` - Now uses brief data

**Brief Influence on Drafts:**
1. **Platform Selection** - Uses brief platforms (priority 1-2) instead of hardcoded
2. **Cadence** - Respects platform cadence from brief
3. **Tone** - Applies voice.tone to content
4. **CTA** - Includes brief.offer as CTA
5. **Constraints** - Applies noClientNames, noFaceKids constraints

**Example Draft Content:**
```
[Event Title]

[Event Notes]

[Post should maintain confident, friendly tone]

[Brief Offer as CTA]

[No client names to be used]
[No faces of children in media]
```

## Files Changed

### Backend
- `server/src/types.ts` - Added AutopilotBrief, StrategyPlan types
- `server/src/index.ts` - Added brief storage, GET/PUT endpoints, POST /plan endpoint, updated generate-drafts

### Frontend
- `src/types/app.ts` - Added AutopilotBrief, StrategyPlan types
- `src/sdk/services/api-services.ts` - Added autopilotBriefApi
- `src/hooks/use-api.ts` - Added brief hooks
- `src/routes/index.tsx` - Added AutopilotBriefForm, AutopilotBriefSummary components

## Endpoints Added

1. `GET /api/autopilot/brief` - Get brief (returns empty shape if none)
2. `PUT /api/autopilot/brief` - Upsert brief
3. `POST /api/autopilot/plan` - Generate strategy plan from brief

## Clickpath to Test

1. **Navigate to Autopilot page**
   - Click "Autopilot" in sidebar

2. **Fill Brief (if none exists)**
   - See "Set up Autopilot" card
   - Fill in:
     - Brand Name: "BJJ Academy"
     - Subject Type: "Business"
     - Industry: "BJJ gym"
     - Primary Goal: "Community"
     - Offer: "Join our free trial class"
     - Target Audience: "Martial arts enthusiasts, fitness seekers"
     - Add Platform: Instagram, Priority 1, 5 posts/week
     - Tone: "confident, friendly, encouraging"
   - Click "Save Brief"

3. **Generate Plan**
   - Click "Generate Plan" button
   - **Expected**: See strategy plan with:
     - Content Pillars (e.g., "Community Building", "Training Tips")
     - Weekly Cadence (Instagram: 5 posts/week)
     - CTA Guidance
     - 30-Day Starter Plan

4. **Create Event → Generate Drafts**
   - Scroll to Events panel
   - Create event: "Visiting BJJ gym class", next-day
   - Click "Generate Drafts"
   - **Expected**: Draft posts created with:
     - Platform: Instagram (from brief, not hardcoded)
     - Content includes: Event title, tone note, CTA from brief offer
     - Constraints applied

5. **Verify Brief Persists**
   - Refresh page
   - **Expected**: Brief summary still visible, settings persist

## Example Output

### Strategy Plan Example
```json
{
  "contentPillars": [
    {
      "name": "Community Building",
      "description": "Foster engagement and connection",
      "examples": ["User-generated content", "Community highlights", "Interactive Q&A"]
    },
    {
      "name": "Training Tips",
      "description": "Share martial arts techniques and training advice",
      "examples": ["Technique breakdowns", "Training drills", "Competition prep"]
    }
  ],
  "weeklyCadence": [
    {
      "platform": "instagram",
      "postTypes": ["reels", "carousels", "stories"],
      "postsPerWeek": 5
    }
  ],
  "recommendedPostTypes": ["reels", "carousels", "stories"],
  "ctaGuidance": "Primary CTA: Join our free trial class. Use clear, action-oriented language. Maintain confident, friendly, encouraging tone.",
  "thirtyDayStarterPlan": [...]
}
```

### Draft Post Example
```
Visiting BJJ gym class

Had an amazing session today!

[Post should maintain confident, friendly, encouraging tone]

Join our free trial class

[No client names to be used]
```

## Non-Negotiables Met

✅ Minimal changes, no big refactors
✅ Stable endpoint shapes (empty brief returns full shape)
✅ No auth changes required
✅ No OAuth token storage changes
✅ Brief data used in draft generation
✅ Rule-based plan generation (no AI required for MVP)
