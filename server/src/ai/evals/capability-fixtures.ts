/** Small deterministic fixtures used to catch prompt/schema contract drift in CI. */
export const capabilityEvaluationFixtures = [
  {
    operation: 'hook_generation',
    schemaName: 'HookResult',
    output: {
      hooks: [
        { text: 'A clearer way to plan next week.', angle: 'practical', platform: 'instagram', risk_flags: [] },
      ],
      recommended_index: 0,
      reasoning_summary: 'Specific and aligned to the planning goal.',
      missing_brand_context: [],
    },
  },
  {
    operation: 'content_strategy',
    schemaName: 'ContentStrategyResult',
    output: {
      strategy_summary: 'Educate first, then invite the audience to take one clear next step.',
      objectives: ['Increase qualified profile visits'],
      audience_priorities: ['Existing followers'],
      pillars: [{ name: 'Education', purpose: 'Build trust', formats: ['post'], cadence_per_week: 2 }],
      platform_priorities: [{ platform: 'instagram', role: 'Discovery', cadence_per_week: 2 }],
      campaign_ideas: ['Weekly practical tip'],
      metrics_to_watch: ['Profile visits'],
      risks: [],
      missing_brand_context: [],
      confidence_score: 0.8,
      needs_human_review: true,
    },
  },
  {
    operation: 'performance_analysis',
    schemaName: 'PerformanceAnalysisResult',
    output: {
      summary: 'The supplied sample is too small for a strong conclusion.',
      observations: [{ statement: 'Post A had more saves', evidence: '12 saves versus 4', confidence: 0.9 }],
      strongest_content: [],
      weakest_content: [],
      recommendations: [{ action: 'Repeat the topic once', reason: 'Validate the signal', confidence: 0.65 }],
      insufficient_data: ['Only two posts were supplied'],
      needs_human_review: true,
    },
  },
] as const;
