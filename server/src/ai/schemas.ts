/**
 * Steward AI Gateway — Zod schemas for all structured AI outputs.
 */

import { z } from 'zod';

export const MediaAnalysisResultSchema = z.object({
  summary: z.string(),
  detected_scene: z.string(),
  detected_people_count: z.number().int().min(0),
  visible_text: z.string(),
  content_category: z.string(),
  suggested_topics: z.array(z.string()),
  suggested_content_pillars: z.array(z.string()),
  brand_safety_notes: z.array(z.string()),
  quality_score: z.number().min(0).max(1),
  suggested_platforms: z.array(z.string()),
  caption_angles: z.array(z.string()),
  missing_brand_context: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const PostDraftResultSchema = z.object({
  internal_title: z.string(),
  hook: z.string(),
  caption: z.string(),
  cta: z.string(),
  hashtags: z.array(z.string()),
  content_pillar: z.string(),
  target_audience: z.string(),
  tone: z.string(),
  suggested_platforms: z.array(z.string()),
  platform_recommendations: z.array(z.string()).default([]),
  media_usage_notes: z.string(),
  brand_facts_used: z.array(z.string()).default([]),
  assumptions_made: z.array(z.string()).default([]),
  missing_context: z.array(z.string()).default([]),
  safety_flags: z.array(z.string()).default([]),
  confidence_score: z.number().min(0).max(1),
  needs_human_review: z.boolean(),
  review_reasons: z.array(z.string()),
  missing_brand_context: z.array(z.string()).default([]),
});

export const PlatformVariantItemSchema = z.object({
  platform: z.string(),
  title: z.string(),
  caption: z.string(),
  description: z.string(),
  hashtags: z.array(z.string()),
  first_comment: z.string(),
  character_count: z.number().int().min(0),
  media_requirements: z.array(z.string()),
  platform_warnings: z.array(z.string()),
  ready_to_schedule: z.boolean(),
});

export const PlatformVariantResultSchema = z.object({
  variants: z.array(PlatformVariantItemSchema).min(1),
  missing_brand_context: z.array(z.string()).default([]),
});

export const ScheduleRecommendationResultSchema = z.object({
  recommended_datetime: z.string(),
  timezone: z.string(),
  reasoning_summary: z.string(),
  platform: z.string(),
  priority_score: z.number().min(0).max(1),
  alternative_times: z.array(z.string()),
  conflicts: z.array(z.string()),
  needs_approval: z.boolean(),
  missing_brand_context: z.array(z.string()).default([]),
});

export const ContentScoreResultSchema = z.object({
  overall_score: z.number().min(0).max(100),
  hook_score: z.number().min(0).max(100),
  clarity_score: z.number().min(0).max(100),
  brand_fit_score: z.number().min(0).max(100),
  platform_fit_score: z.number().min(0).max(100),
  engagement_potential: z.number().min(0).max(100),
  risk_level: z.enum(['low', 'medium', 'high']),
  improvement_suggestions: z.array(z.string()),
});

export const ModerationResultSchema = z.object({
  approved: z.boolean(),
  risk_level: z.enum(['low', 'medium', 'high']),
  policy_flags: z.array(z.string()),
  brand_safety_flags: z.array(z.string()),
  brand_rule_flags: z.array(z.string()).default([]),
  recommended_action: z.enum(['allow', 'review', 'block']),
  human_review_required: z.boolean(),
  notes: z.string(),
});

export const BrandUnderstandingResultSchema = z.object({
  summary: z.string(),
  business_type: z.string(),
  target_audiences: z.array(z.string()),
  tone_profile: z.string(),
  content_pillars_detected: z.array(z.string()),
  missing_brand_data: z.array(z.string()),
  recommended_next_questions: z.array(z.string()),
  confidence_score: z.number().min(0).max(1),
});

export const BrandSafetyResultSchema = ModerationResultSchema;

export const MemoryExtractionResultSchema = z.object({
  proposed_memory_facts: z.array(
    z.object({
      fact_type: z.string(),
      fact_key: z.string(),
      fact_value: z.record(z.string(), z.unknown()),
      confidence: z.number().min(0).max(1),
      needs_approval: z.boolean(),
    })
  ),
  confidence: z.number().min(0).max(1),
  needs_approval: z.boolean(),
  source_summary: z.string(),
});

export const ContentFeedbackLearningResultSchema = z.object({
  learned_preferences: z.array(z.string()),
  disliked_patterns: z.array(z.string()),
  preferred_patterns: z.array(z.string()),
  update_memory_recommendations: z.array(z.string()),
});

export type MediaAnalysisResult = z.infer<typeof MediaAnalysisResultSchema>;
export type PostDraftResult = z.infer<typeof PostDraftResultSchema>;
export type PlatformVariantResult = z.infer<typeof PlatformVariantResultSchema>;
export type ScheduleRecommendationResult = z.infer<typeof ScheduleRecommendationResultSchema>;
export type ContentScoreResult = z.infer<typeof ContentScoreResultSchema>;
export type ModerationResult = z.infer<typeof ModerationResultSchema>;

export type AiStructuredSchema =
  | typeof MediaAnalysisResultSchema
  | typeof PostDraftResultSchema
  | typeof PlatformVariantResultSchema
  | typeof ScheduleRecommendationResultSchema
  | typeof ContentScoreResultSchema
  | typeof ModerationResultSchema;

/** Convert Zod schema to JSON Schema for OpenAI structured outputs. */
export function zodToJsonSchema(schema: z.ZodTypeAny, name: string): Record<string, unknown> {
  // Minimal converter for object schemas used by the gateway
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodTypeToJsonSchemaProperty(value as z.ZodTypeAny);
      if (!(value instanceof z.ZodOptional) && !(value as z.ZodTypeAny).isOptional?.()) {
        required.push(key);
      }
    }
    return {
      type: 'object',
      properties,
      required,
      additionalProperties: false,
    };
  }
  return { type: 'object', properties: {}, additionalProperties: true, title: name };
}

function zodTypeToJsonSchemaProperty(schema: z.ZodTypeAny): Record<string, unknown> {
  if (schema instanceof z.ZodString) return { type: 'string' };
  if (schema instanceof z.ZodNumber) return { type: 'number' };
  if (schema instanceof z.ZodBoolean) return { type: 'boolean' };
  if (schema instanceof z.ZodArray) {
    return { type: 'array', items: zodTypeToJsonSchemaProperty(schema.element) };
  }
  if (schema instanceof z.ZodEnum) return { type: 'string', enum: schema.options };
  if (schema instanceof z.ZodDefault) return zodTypeToJsonSchemaProperty(schema._def.innerType);
  if (schema instanceof z.ZodOptional) return zodTypeToJsonSchemaProperty(schema.unwrap());
  if (schema instanceof z.ZodObject) {
    const inner = zodToJsonSchema(schema, 'nested');
    return inner;
  }
  if (schema instanceof z.ZodRecord) return { type: 'object', additionalProperties: true };
  return { type: 'string' };
}

export function parseStructuredOutput<T>(
  schema: z.ZodType<T>,
  raw: unknown,
  label: string
): T {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `${label} validation failed: ${parsed.error.issues.map((i) => i.message).join('; ')}`
    );
  }
  return parsed.data;
}
