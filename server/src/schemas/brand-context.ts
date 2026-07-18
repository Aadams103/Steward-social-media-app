import { z } from 'zod';

const shortText = z.string().trim().max(200);
const listText = z.array(z.string().trim().min(1).max(200)).max(30).default([]);

export const brandContextV1Schema = z.object({
  version: z.literal('1.0'),
  identity: z.object({
    businessName: z.string().trim().min(2).max(150),
    publicBrandName: z.string().trim().min(2).max(150),
    businessType: shortText.optional(),
    industry: shortText.optional(),
    websiteUrl: z.string().url().max(500).optional().or(z.literal('')),
    shortDescription: z.string().trim().max(500).optional(),
    missionStatement: z.string().trim().max(1000).optional(),
    values: listText,
  }),
  audience: z.array(z.object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(1000).optional(),
    painPoints: listText,
    interests: listText,
    preferredPlatforms: z.array(z.enum(['facebook', 'instagram'])).default([]),
    isPrimary: z.boolean().default(false),
  })).max(12).default([]),
  voice: z.object({
    summary: z.string().trim().max(1000).default(''),
    defaultTone: shortText.optional(),
    personalityTraits: listText,
    wordsToUse: listText,
    wordsToAvoid: listText,
  }),
  pillars: z.array(z.object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(500).optional(),
  })).max(20).default([]),
  offers: z.array(z.object({
    name: z.string().trim().min(2).max(120),
    headline: z.string().trim().max(300).optional(),
    description: z.string().trim().max(1000).optional(),
    ctaText: z.string().trim().max(200).optional(),
    ctaUrl: z.string().url().max(500).optional().or(z.literal('')),
  })).max(20).default([]),
  ctas: z.array(z.object({
    label: z.string().trim().min(1).max(100),
    text: z.string().trim().min(1).max(300),
    destinationUrl: z.string().url().max(500).optional().or(z.literal('')),
    platform: z.enum(['facebook', 'instagram']).optional(),
  })).max(20).default([]),
  rules: z.object({
    prohibitedClaims: listText,
    complianceNotes: z.string().trim().max(2000).default(''),
    safetyNotes: z.string().trim().max(2000).default(''),
  }),
  platformStrategies: z.array(z.object({
    platform: z.enum(['facebook', 'instagram']),
    enabled: z.boolean().default(true),
    postingFrequencyGoal: z.number().int().min(0).max(50).default(3),
    targetAudience: z.string().trim().max(500).optional(),
    contentTypes: listText,
    notes: z.string().trim().max(1000).optional(),
  })).max(2).default([]),
  visualKit: z.object({
    primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
    secondaryColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
    accentColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
    fonts: listText,
    styleNotes: z.string().trim().max(1000).optional(),
    logoAssetId: z.string().uuid().optional(),
    brandDocumentAssetIds: z.array(z.string().uuid()).max(30).default([]),
  }),
  examples: z.array(z.object({
    platform: z.enum(['facebook', 'instagram']),
    content: z.string().trim().min(1).max(5000),
    whyItWorks: z.string().trim().max(1000).optional(),
  })).max(20).default([]),
  postingGoals: listText,
});

export type BrandContextV1Input = z.infer<typeof brandContextV1Schema>;
