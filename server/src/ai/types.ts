/**
 * Steward AI Gateway — types and operation registry.
 */

import type { z } from 'zod';
import {
  ContentScoreResultSchema,
  MediaAnalysisResultSchema,
  ModerationResultSchema,
  PlatformVariantResultSchema,
  PostDraftResultSchema,
  ScheduleRecommendationResultSchema,
} from './schemas.js';

export type AiOperation =
  | 'media_analysis'
  | 'caption_generation'
  | 'post_draft_generation'
  | 'platform_variant_generation'
  | 'hashtag_generation'
  | 'schedule_recommendation'
  | 'content_score'
  | 'content_repurpose'
  | 'brand_summary'
  | 'moderation_check'
  | 'automation_decision';

export type AiJobStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'blocked';

export interface AiGatewayRequestContext {
  organizationId: string;
  brandId: string;
  userId: string;
  userRole?: string;
  subscriptionTier?: string;
}

export interface AiGatewayRunInput {
  operation: AiOperation;
  ctx: AiGatewayRequestContext;
  input: Record<string, unknown>;
  relatedPostId?: string;
  relatedAssetId?: string;
  persistDraft?: boolean;
  persistVariants?: boolean;
}

export interface AiGatewayRunResult<T = unknown> {
  aiJobId: string;
  operation: AiOperation;
  status: 'succeeded';
  result: T;
  needsHumanReview: boolean;
  warnings: string[];
  model: string;
  promptVersion: string;
  estimatedCostCents: number;
  totalTokens: number;
}

export interface PromptDefinition {
  name: string;
  version: string;
  purpose: string;
  system: string;
  safetyRules: string[];
}

export const OPERATION_SCHEMA_MAP: Partial<
  Record<AiOperation, { schema: z.ZodTypeAny; promptName: string; schemaName: string }>
> = {
  media_analysis: {
    schema: MediaAnalysisResultSchema,
    promptName: 'media_analysis_prompt',
    schemaName: 'MediaAnalysisResult',
  },
  post_draft_generation: {
    schema: PostDraftResultSchema,
    promptName: 'post_draft_prompt',
    schemaName: 'PostDraftResult',
  },
  platform_variant_generation: {
    schema: PlatformVariantResultSchema,
    promptName: 'platform_variant_prompt',
    schemaName: 'PlatformVariantResult',
  },
  schedule_recommendation: {
    schema: ScheduleRecommendationResultSchema,
    promptName: 'schedule_recommendation_prompt',
    schemaName: 'ScheduleRecommendationResult',
  },
  content_score: {
    schema: ContentScoreResultSchema,
    promptName: 'content_score_prompt',
    schemaName: 'ContentScoreResult',
  },
  moderation_check: {
    schema: ModerationResultSchema,
    promptName: 'moderation_prompt',
    schemaName: 'ModerationResult',
  },
};

export const OPERATION_MODEL_MAP: Record<AiOperation, 'draft' | 'reasoning' | 'vision' | 'default'> = {
  media_analysis: 'vision',
  caption_generation: 'draft',
  post_draft_generation: 'draft',
  platform_variant_generation: 'draft',
  hashtag_generation: 'draft',
  schedule_recommendation: 'reasoning',
  content_score: 'reasoning',
  content_repurpose: 'draft',
  brand_summary: 'reasoning',
  moderation_check: 'default',
  automation_decision: 'reasoning',
};

/** Map gateway operations to existing steward_ai_job_type enum values where needed. */
export const OPERATION_TO_JOB_TYPE: Record<AiOperation, string> = {
  media_analysis: 'image_analysis',
  caption_generation: 'caption_generation',
  post_draft_generation: 'post_idea_generation',
  platform_variant_generation: 'variant_generation',
  hashtag_generation: 'hashtag_generation',
  schedule_recommendation: 'scheduling_recommendation',
  content_score: 'content_scoring',
  content_repurpose: 'content_repurposing',
  brand_summary: 'brand_voice_training',
  moderation_check: 'content_scoring',
  automation_decision: 'content_scoring',
};
