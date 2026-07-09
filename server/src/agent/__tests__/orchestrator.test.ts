import { describe, it, expect } from 'vitest';
import { planAgentActions } from '../orchestrator.js';
import { DEFAULT_AGENT_CONFIG, type AgentPipelineSnapshot } from '../types.js';

function baseSnapshot(overrides: Partial<AgentPipelineSnapshot> = {}): AgentPipelineSnapshot {
  return {
    draftCount: 0,
    needsReviewCount: 0,
    approvedUnscheduledIds: [],
    scheduledNext7Days: 0,
    postsMissingVariants: [],
    unscheduledDraftIds: [],
    connectedAccountPlatforms: ['instagram'],
    hasAnalyticsSource: false,
    ingestedPostCount: 0,
    missingBrandContext: [],
    weeklyPostingTarget: 3,
    ...overrides,
  };
}

describe('planAgentActions', () => {
  it('generates drafts up to the per-cycle cap when the queue is empty', () => {
    const actions = planAgentActions(baseSnapshot(), DEFAULT_AGENT_CONFIG);
    const drafts = actions.filter((a) => a.type === 'generate_draft');
    expect(drafts.length).toBe(DEFAULT_AGENT_CONFIG.maxDraftsPerCycle);
  });

  it('does not generate drafts when the weekly target is met', () => {
    const actions = planAgentActions(
      baseSnapshot({ scheduledNext7Days: 3, weeklyPostingTarget: 3 }),
      DEFAULT_AGENT_CONFIG
    );
    expect(actions.filter((a) => a.type === 'generate_draft')).toHaveLength(0);
  });

  it('does not flood a full backlog even when the queue is short', () => {
    const actions = planAgentActions(
      baseSnapshot({ draftCount: 4, needsReviewCount: 2, weeklyPostingTarget: 3 }),
      DEFAULT_AGENT_CONFIG
    );
    expect(actions.filter((a) => a.type === 'generate_draft')).toHaveLength(0);
  });

  it('pauses drafting and flags setup when critical brand context is missing', () => {
    const actions = planAgentActions(
      baseSnapshot({ missingBrandContext: ['business_name', 'content_pillars'] }),
      DEFAULT_AGENT_CONFIG
    );
    expect(actions.filter((a) => a.type === 'generate_draft')).toHaveLength(0);
    const flag = actions.find((a) => a.type === 'flag_setup_gap');
    expect(flag).toBeDefined();
    expect(flag!.reason).toContain('business_name');
  });

  it('plans variant generation for approved posts missing variants', () => {
    const actions = planAgentActions(
      baseSnapshot({
        scheduledNext7Days: 3,
        postsMissingVariants: [
          { id: 'p1', platform: 'instagram' },
          { id: 'p2', platform: 'facebook' },
        ],
      }),
      DEFAULT_AGENT_CONFIG
    );
    const variantActions = actions.filter((a) => a.type === 'generate_variants');
    expect(variantActions).toHaveLength(2);
    expect(variantActions[0]!.targetId).toBe('p1');
  });

  it('respects the variant op cap', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ id: `p${i}`, platform: 'instagram' }));
    const actions = planAgentActions(
      baseSnapshot({ scheduledNext7Days: 3, postsMissingVariants: many }),
      DEFAULT_AGENT_CONFIG
    );
    expect(actions.filter((a) => a.type === 'generate_variants')).toHaveLength(
      DEFAULT_AGENT_CONFIG.maxVariantOpsPerCycle
    );
  });

  it('plans schedule recommendations for unscheduled drafts', () => {
    const actions = planAgentActions(
      baseSnapshot({ scheduledNext7Days: 3, unscheduledDraftIds: ['d1', 'd2'] }),
      DEFAULT_AGENT_CONFIG
    );
    expect(actions.filter((a) => a.type === 'recommend_schedule')).toHaveLength(2);
  });

  it('flags missing connected accounts', () => {
    const actions = planAgentActions(
      baseSnapshot({ connectedAccountPlatforms: [], scheduledNext7Days: 3 }),
      DEFAULT_AGENT_CONFIG
    );
    const flag = actions.find((a) => a.type === 'flag_setup_gap');
    expect(flag).toBeDefined();
    expect(flag!.reason).toContain('connected');
  });

  it('plans analytics ingestion only when a real source exists', () => {
    const withSource = planAgentActions(
      baseSnapshot({ hasAnalyticsSource: true, ingestedPostCount: 40, scheduledNext7Days: 3 }),
      DEFAULT_AGENT_CONFIG
    );
    expect(withSource.some((a) => a.type === 'ingest_analytics')).toBe(true);

    const withoutSource = planAgentActions(
      baseSnapshot({ hasAnalyticsSource: false, scheduledNext7Days: 3 }),
      DEFAULT_AGENT_CONFIG
    );
    expect(withoutSource.some((a) => a.type === 'ingest_analytics')).toBe(false);
  });

  it('never plans a publish action of any kind', () => {
    const actions = planAgentActions(
      baseSnapshot({
        approvedUnscheduledIds: ['p1', 'p2'],
        postsMissingVariants: [{ id: 'p1', platform: 'instagram' }],
        unscheduledDraftIds: ['d1'],
        hasAnalyticsSource: true,
        ingestedPostCount: 5,
      }),
      DEFAULT_AGENT_CONFIG
    );
    for (const a of actions) {
      expect(a.type).not.toContain('publish');
    }
  });
});
