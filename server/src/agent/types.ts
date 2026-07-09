/**
 * Steward AI Social Media Agent — shared types.
 *
 * The agent is approval-first: it plans and drafts, but never publishes
 * without the existing approval workflow. All decisions are recorded in
 * ai_decision_logs and audit_logs.
 */

export type AgentActionType =
  | 'ingest_analytics'
  | 'generate_draft'
  | 'generate_variants'
  | 'recommend_schedule'
  | 'moderate_backlog'
  | 'flag_setup_gap';

export interface AgentAction {
  type: AgentActionType;
  reason: string;
  /** Optional target record (post id, etc.) */
  targetId?: string;
  /** Extra parameters for execution (platform list, pillar, etc.) */
  params?: Record<string, unknown>;
}

export interface AgentPipelineSnapshot {
  draftCount: number;
  needsReviewCount: number;
  approvedUnscheduledIds: string[];
  /** Approved/scheduled posts in the next 7 days */
  scheduledNext7Days: number;
  /** Posts approved but missing platform variants */
  postsMissingVariants: { id: string; platform: string }[];
  /** Drafts without a scheduled time */
  unscheduledDraftIds: string[];
  connectedAccountPlatforms: string[];
  hasAnalyticsSource: boolean;
  ingestedPostCount: number;
  missingBrandContext: string[];
  /** Weekly posting target derived from brand posting_goals, default 3 */
  weeklyPostingTarget: number;
}

export interface AgentRunConfig {
  /** Max new drafts the agent may generate per cycle. */
  maxDraftsPerCycle: number;
  /** Max variant-generation operations per cycle. */
  maxVariantOpsPerCycle: number;
  /** Max schedule recommendations per cycle. */
  maxScheduleRecsPerCycle: number;
  /** When true, plan only — no AI calls, no writes. */
  dryRun: boolean;
}

export const DEFAULT_AGENT_CONFIG: AgentRunConfig = {
  maxDraftsPerCycle: 2,
  maxVariantOpsPerCycle: 3,
  maxScheduleRecsPerCycle: 3,
  dryRun: false,
};

export interface AgentActionResult {
  action: AgentAction;
  status: 'succeeded' | 'failed' | 'skipped' | 'planned';
  aiJobId?: string;
  resultSummary?: string;
  error?: string;
}

export interface AgentRunReport {
  organizationId: string;
  brandId: string;
  startedAt: string;
  completedAt: string;
  dryRun: boolean;
  snapshot: AgentPipelineSnapshot;
  plannedActions: AgentAction[];
  results: AgentActionResult[];
  decisionLogId: string | null;
  warnings: string[];
}
