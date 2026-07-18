import { describe, expect, it } from 'vitest';
import { capabilityEvaluationFixtures } from '../evals/capability-fixtures.js';
import {
  ContentStrategyResultSchema,
  HookResultSchema,
  PerformanceAnalysisResultSchema,
} from '../schemas.js';
import { OPERATION_SCHEMA_MAP } from '../types.js';

const fixtureSchemas = {
  HookResult: HookResultSchema,
  ContentStrategyResult: ContentStrategyResultSchema,
  PerformanceAnalysisResult: PerformanceAnalysisResultSchema,
} as const;

describe('AI capability contracts', () => {
  it.each(capabilityEvaluationFixtures)('validates $operation evaluation output', (fixture) => {
    expect(fixtureSchemas[fixture.schemaName].safeParse(fixture.output).success).toBe(true);
  });

  it('registers every launch capability with a typed schema', () => {
    const launchCapabilities = [
      'brand_context',
      'content_strategy',
      'content_calendar',
      'hook_generation',
      'caption_generation',
      'post_draft_generation',
      'carousel_generation',
      'content_repurpose',
      'performance_analysis',
      'pattern_detection',
      'growth_tracking',
      'optimization_advice',
    ] as const;
    for (const capability of launchCapabilities) {
      expect(OPERATION_SCHEMA_MAP[capability]?.schema).toBeDefined();
    }
  });
});
