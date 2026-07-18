/**
 * Steward AI Gateway — types and operation registry.
 */

import type { z } from 'zod';
import {
  BrandUnderstandingResultSchema,
  CaptionResultSchema,
  CarouselResultSchema,
  ContentCalendarResultSchema,
  ContentScoreResultSchema,
  ContentStrategyResultSchema,
  GrowthTrackingResultSchema,
  HashtagResultSchema,
  HookResultSchema,
  MediaAnalysisResultSchema,
  MemoryExtractionResultSchema,
  ModerationResultSchema,
  OptimizationAdviceResultSchema,
  PatternDetectionResultSchema,
  PerformanceAnalysisResultSchema,
  PlatformVariantResultSchema,
  PostDraftResultSchema,
  RepurposeResultSchema,
  ScheduleRecommendationResultSchema,
} from './schemas.js';

export type AiOperation =
  | 'media_analysis'
  | 'image_generation'
  | 'caption_generation'
  | 'post_draft_generation'
  | 'platform_variant_generation'
  | 'hashtag_generation'
  | 'schedule_recommendation'
  | 'content_score'
  | 'content_repurpose'
  | 'brand_context'
  | 'brand_summary'
  | 'content_strategy'
  | 'content_calendar'
  | 'hook_generation'
  | 'carousel_generation'
  | 'performance_analysis'
  | 'pattern_detection'
  | 'growth_tracking'
  | 'optimization_advice'
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
  relatedPostId?: string;
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
  brand_context: {
    schema: MemoryExtractionResultSchema,
    promptName: 'brand_context_prompt',
    schemaName: 'MemoryExtractionResult',
  },
  brand_summary: {
    schema: BrandUnderstandingResultSchema,
    promptName: 'brand_summary_prompt',
    schemaName: 'BrandUnderstandingResult',
  },
  content_strategy: {
    schema: ContentStrategyResultSchema,
    promptName: 'content_strategy_prompt',
    schemaName: 'ContentStrategyResult',
  },
  content_calendar: {
    schema: ContentCalendarResultSchema,
    promptName: 'content_calendar_prompt',
    schemaName: 'ContentCalendarResult',
  },
  hook_generation: {
    schema: HookResultSchema,
    promptName: 'hook_prompt',
    schemaName: 'HookResult',
  },
  caption_generation: {
    schema: CaptionResultSchema,
    promptName: 'caption_prompt',
    schemaName: 'CaptionResult',
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
  carousel_generation: {
    schema: CarouselResultSchema,
    promptName: 'carousel_prompt',
    schemaName: 'CarouselResult',
  },
  hashtag_generation: {
    schema: HashtagResultSchema,
    promptName: 'hashtag_prompt',
    schemaName: 'HashtagResult',
  },
  content_repurpose: {
    schema: RepurposeResultSchema,
    promptName: 'repurpose_prompt',
    schemaName: 'RepurposeResult',
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
  performance_analysis: {
    schema: PerformanceAnalysisResultSchema,
    promptName: 'performance_analysis_prompt',
    schemaName: 'PerformanceAnalysisResult',
  },
  pattern_detection: {
    schema: PatternDetectionResultSchema,
    promptName: 'pattern_detection_prompt',
    schemaName: 'PatternDetectionResult',
  },
  growth_tracking: {
    schema: GrowthTrackingResultSchema,
    promptName: 'growth_tracking_prompt',
    schemaName: 'GrowthTrackingResult',
  },
  optimization_advice: {
    schema: OptimizationAdviceResultSchema,
    promptName: 'optimization_advice_prompt',
    schemaName: 'OptimizationAdviceResult',
  },
  moderation_check: {
    schema: ModerationResultSchema,
    promptName: 'moderation_prompt',
    schemaName: 'ModerationResult',
  },
};

export const OPERATION_MODEL_MAP: Record<AiOperation, 'draft' | 'reasoning' | 'vision' | 'default'> = {
  media_analysis: 'vision',
  image_generation: 'vision',
  brand_context: 'reasoning',
  caption_generation: 'draft',
  post_draft_generation: 'draft',
  platform_variant_generation: 'draft',
  hook_generation: 'draft',
  carousel_generation: 'draft',
  hashtag_generation: 'draft',
  schedule_recommendation: 'reasoning',
  content_score: 'reasoning',
  content_repurpose: 'draft',
  brand_summary: 'reasoning',
  content_strategy: 'reasoning',
  content_calendar: 'reasoning',
  performance_analysis: 'reasoning',
  pattern_detection: 'reasoning',
  growth_tracking: 'reasoning',
  optimization_advice: 'reasoning',
  moderation_check: 'default',
  automation_decision: 'reasoning',
};

/** Map gateway operations to existing steward_ai_job_type enum values where needed. */
export const OPERATION_TO_JOB_TYPE: Record<AiOperation, string> = {
  media_analysis: 'image_analysis',
  image_generation: 'post_idea_generation',
  brand_context: 'brand_voice_training',
  caption_generation: 'caption_generation',
  post_draft_generation: 'post_idea_generation',
  platform_variant_generation: 'variant_generation',
  hook_generation: 'post_idea_generation',
  carousel_generation: 'post_idea_generation',
  hashtag_generation: 'hashtag_generation',
  schedule_recommendation: 'scheduling_recommendation',
  content_score: 'content_scoring',
  content_repurpose: 'content_repurposing',
  brand_summary: 'brand_voice_training',
  content_strategy: 'post_idea_generation',
  content_calendar: 'scheduling_recommendation',
  performance_analysis: 'performance_analysis',
  pattern_detection: 'performance_analysis',
  growth_tracking: 'performance_analysis',
  optimization_advice: 'performance_analysis',
  moderation_check: 'content_scoring',
  automation_decision: 'content_scoring',
};
