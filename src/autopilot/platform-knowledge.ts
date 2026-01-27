export type PlatformId =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "x"
  | "pinterest"
  | "google_business_profile";

export type ContentType =
  | "image"
  | "carousel"
  | "short_video"
  | "long_video"
  | "story"
  | "live"
  | "text"
  | "link"
  | "document"
  | "idea_pin"
  | "community_post";

export type PlatformRules = {
  id: PlatformId;
  displayName: string;

  // What we support in Steward (MVP)
  supportedContentTypes: ContentType[];

  // Practical constraints (MVP; not exhaustive)
  limits: {
    captionMaxChars?: number;
    recommendedCaptionChars?: { min: number; max: number };
    hashtagMax?: number;
    recommendedHashtags?: { min: number; max: number };
    maxCarouselItems?: number;
    videoMaxSeconds?: number;
    recommendedVideoSeconds?: { min: number; max: number };
    aspectRatios?: string[]; // guidance, not hard validation
  };

  // Strategy heuristics for Autopilot to reference
  algorithmSignals: string[]; // what tends to help
  engagementMoves: string[]; // CTAs / tactics
  cadenceGuidance: {
    recommendedPerWeek: { min: number; max: number };
    notes: string[];
  };

  // Style guidance for generated copy
  voiceHints: {
    tone: string[];
    formatting: string[];
    taboo: string[];
  };

  // Optional: reusable templates (MVP)
  captionTemplates?: {
    name: string;
    template: string;
  }[];
};

export const PLATFORM_KNOWLEDGE: Record<PlatformId, PlatformRules> = {
  instagram: {
    id: "instagram",
    displayName: "Instagram",
    supportedContentTypes: ["image", "carousel", "short_video", "story", "live"],
    limits: {
      captionMaxChars: 2200,
      recommendedCaptionChars: { min: 80, max: 400 },
      hashtagMax: 30,
      recommendedHashtags: { min: 3, max: 12 },
      maxCarouselItems: 10,
      recommendedVideoSeconds: { min: 7, max: 45 },
      aspectRatios: ["9:16 (Reels/Stories)", "4:5 (feed)", "1:1 (feed)"],
    },
    algorithmSignals: [
      "Strong hook in first 1–2 seconds for Reels",
      "Saves and shares are high-value signals",
      "Consistency matters more than one-off virality",
      "Native-feeling edits outperform overly polished ads",
    ],
    engagementMoves: [
      "Ask a simple question at the end",
      "Use a clear CTA: save/share/comment",
      "Pin a top comment with extra context",
      "Reply quickly to early comments",
    ],
    cadenceGuidance: {
      recommendedPerWeek: { min: 3, max: 7 },
      notes: ["Mix Reels + carousels", "Stories can be daily even when feed is 3–5x/week"],
    },
    voiceHints: {
      tone: ["friendly", "confident", "energetic"],
      formatting: ["Hook line", "Short paragraphs", "Emoji optional", "Hashtags at end"],
      taboo: ["Avoid hashtag walls on every post", "Avoid vague CTAs ('thoughts?') without context"],
    },
    captionTemplates: [
      {
        name: "Value + CTA",
        template:
          "Hook: {hook}\n\n{value_points}\n\n{cta_question}\n\n{hashtags}",
      },
    ],
  },

  facebook: {
    id: "facebook",
    displayName: "Facebook",
    supportedContentTypes: ["image", "carousel", "short_video", "long_video", "text", "link", "live"],
    limits: {
      recommendedCaptionChars: { min: 60, max: 300 },
      maxCarouselItems: 10,
      recommendedVideoSeconds: { min: 15, max: 90 },
      aspectRatios: ["1:1", "4:5", "16:9", "9:16"],
    },
    algorithmSignals: [
      "Comments and meaningful interactions help distribution",
      "Native video generally performs better than external links",
      "Community-oriented posts tend to outperform pure ads",
    ],
    engagementMoves: [
      "Invite stories/opinions (specific prompt)",
      "Use questions that are easy to answer",
      "Use event-style posts for time-bound activities",
    ],
    cadenceGuidance: {
      recommendedPerWeek: { min: 2, max: 5 },
      notes: ["Prioritize clarity and community tone", "Avoid posting links too frequently"],
    },
    voiceHints: {
      tone: ["conversational", "helpful", "community-first"],
      formatting: ["1–2 short paragraphs", "Clear CTA", "Avoid heavy hashtag use"],
      taboo: ["Don't copy/paste Instagram hashtag blocks"],
    },
  },

  tiktok: {
    id: "tiktok",
    displayName: "TikTok",
    supportedContentTypes: ["short_video", "live"],
    limits: {
      recommendedVideoSeconds: { min: 8, max: 35 },
      aspectRatios: ["9:16"],
      recommendedHashtags: { min: 2, max: 6 },
    },
    algorithmSignals: [
      "Retention and rewatches are key",
      "Hook immediately; no long intros",
      "Trends (audio/format) can multiply reach",
      "Authentic, creator-style beats polished commercials",
    ],
    engagementMoves: [
      "Use on-screen text to clarify hook",
      "End with a prompt to comment (A/B choice works well)",
      "Reply to comments with video (future feature)",
    ],
    cadenceGuidance: {
      recommendedPerWeek: { min: 3, max: 7 },
      notes: ["Iterate fast on what works", "Batch film 1 day, post all week"],
    },
    voiceHints: {
      tone: ["casual", "direct", "playful"],
      formatting: ["Short caption", "Hook in video text", "Hashtags minimal"],
      taboo: ["Avoid corporate-speak", "Avoid long captions as primary storytelling"],
    },
  },

  youtube: {
    id: "youtube",
    displayName: "YouTube",
    supportedContentTypes: ["long_video", "short_video", "community_post"],
    limits: {
      recommendedVideoSeconds: { min: 240, max: 1200 }, // long-form guidance
      aspectRatios: ["16:9 (long)", "9:16 (Shorts)"],
    },
    algorithmSignals: [
      "Click-through rate (title/thumbnail) + watch time drive recommendations",
      "Clear structure improves retention",
      "Shorts can funnel discovery to long-form",
    ],
    engagementMoves: [
      "Pin a comment with links/resources",
      "Use a clear end CTA: subscribe/watch next",
      "Ask a question for comments",
    ],
    cadenceGuidance: {
      recommendedPerWeek: { min: 1, max: 3 },
      notes: ["1 long video/week OR 2–3 Shorts/week is a solid baseline"],
    },
    voiceHints: {
      tone: ["clear", "confident", "value-driven"],
      formatting: ["Strong title ideas", "Description with bullets", "Chapters (future)"],
      taboo: ["Avoid clickbait mismatch (kills retention)"],
    },
  },

  linkedin: {
    id: "linkedin",
    displayName: "LinkedIn",
    supportedContentTypes: ["text", "image", "carousel", "document", "short_video", "link"],
    limits: {
      captionMaxChars: 3000,
      recommendedCaptionChars: { min: 300, max: 1300 },
      recommendedHashtags: { min: 0, max: 5 },
    },
    algorithmSignals: [
      "Dwell time + meaningful comments matter",
      "Practical insights outperform pure promotion",
      "Strong first 2 lines matter (fold)",
    ],
    engagementMoves: [
      "Use a clear point of view",
      "Ask a thoughtful question (not generic)",
      "Respond to comments to extend distribution",
    ],
    cadenceGuidance: {
      recommendedPerWeek: { min: 2, max: 4 },
      notes: ["Professional tone; post less often than IG/TikTok"],
    },
    voiceHints: {
      tone: ["professional", "insightful", "human"],
      formatting: ["Hook line", "Short paragraphs", "Bullets ok", "Light hashtags at end"],
      taboo: ["Avoid too many emojis", "Avoid engagement bait"],
    },
  },

  x: {
    id: "x",
    displayName: "Twitter / X",
    supportedContentTypes: ["text", "image", "carousel", "short_video", "link"],
    limits: {
      captionMaxChars: 280,
      maxCarouselItems: 4,
      recommendedHashtags: { min: 0, max: 2 },
    },
    algorithmSignals: [
      "Recency and frequency matter",
      "Replies/conversations increase visibility",
      "Clear, punchy takes outperform long rambling",
    ],
    engagementMoves: [
      "Ask a binary question",
      "Post a short thread (future) when needed",
      "Reply to relevant accounts strategically",
    ],
    cadenceGuidance: {
      recommendedPerWeek: { min: 5, max: 20 },
      notes: ["Short posts are fine; consistency wins", "Consider 1–2 posts/day if possible"],
    },
    voiceHints: {
      tone: ["concise", "witty", "direct"],
      formatting: ["One-liner hook", "Optional line break", "Minimal hashtags"],
      taboo: ["Avoid walls of text", "Avoid too many hashtags"],
    },
  },

  pinterest: {
    id: "pinterest",
    displayName: "Pinterest",
    supportedContentTypes: ["image", "idea_pin", "short_video", "carousel", "link"],
    limits: {
      aspectRatios: ["2:3 (recommended)"],
      recommendedHashtags: { min: 0, max: 5 },
    },
    algorithmSignals: [
      "Search intent + keywords drive discovery",
      "Fresh pins and consistent posting help",
      "Evergreen content has long tail value",
    ],
    engagementMoves: [
      "Use clear titles that match search intent",
      "Use keyword-rich descriptions",
      "Link to a relevant landing page",
    ],
    cadenceGuidance: {
      recommendedPerWeek: { min: 3, max: 10 },
      notes: ["Pinterest is a long game; prioritize evergreen posts"],
    },
    voiceHints: {
      tone: ["informative", "clear", "utility-first"],
      formatting: ["Title + keywords", "Short description", "Avoid slang-heavy copy"],
      taboo: ["Avoid vague captions without keywords"],
    },
  },

  google_business_profile: {
    id: "google_business_profile",
    displayName: "Google Business Profile",
    supportedContentTypes: ["text", "image"],
    limits: {
      recommendedCaptionChars: { min: 80, max: 300 },
    },
    algorithmSignals: [
      "Consistency (weekly updates) supports local engagement",
      "Clear CTAs help (call, book, learn more)",
      "Real photos outperform generic stock in local contexts",
    ],
    engagementMoves: [
      "Use a direct CTA: call/book/visit",
      "Post about events, offers, and updates",
      "Keep it concise and location-relevant",
    ],
    cadenceGuidance: {
      recommendedPerWeek: { min: 1, max: 3 },
      notes: ["Weekly posts are a solid baseline", "Use offers/events when relevant"],
    },
    voiceHints: {
      tone: ["clear", "local", "action-oriented"],
      formatting: ["Short update", "CTA", "No fluff"],
      taboo: ["Avoid long storytelling—keep it practical"],
    },
  },
};

/**
 * Get platform rules by platform ID
 */
export function getPlatformRules(platformId: PlatformId): PlatformRules {
  return PLATFORM_KNOWLEDGE[platformId];
}

/**
 * Map app Platform type to PlatformId
 * Returns null for unsupported platforms (Slack, Notion, etc.)
 */
export function mapAppPlatformToPlatformId(platform: string): PlatformId | null {
  const mapping: Record<string, PlatformId> = {
    instagram: "instagram",
    facebook: "facebook",
    tiktok: "tiktok",
    youtube: "youtube",
    linkedin: "linkedin",
    x: "x",
    twitter: "x", // handle both
    pinterest: "pinterest",
    google_business_profile: "google_business_profile",
  };
  
  return mapping[platform.toLowerCase()] || null;
}
