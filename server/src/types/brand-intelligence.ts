/**
 * Steward Brand Intelligence — typed context package for AI operations.
 */

export interface StewardBrandContextInput {
  organizationId: string;
  brandId: string;
  userId: string;
  operation: string;
  platform?: string;
  contentPillarId?: string;
  assetIds?: string[];
  postId?: string;
}

export interface StewardBrandContext {
  organization: Record<string, unknown>;
  brand: Record<string, unknown>;
  brandProfile: Record<string, unknown> | null;
  userPreferences: Record<string, unknown> | null;
  audienceSegments: Record<string, unknown>[];
  contentPillars: Record<string, unknown>[];
  hashtags: Record<string, unknown>[];
  ctas: Record<string, unknown>[];
  locations: Record<string, unknown>[];
  schedules: Record<string, unknown>[];
  offers: Record<string, unknown>[];
  reusableSnippets: Record<string, unknown>[];
  brandRules: Record<string, unknown>[];
  platformStrategy: Record<string, unknown>[];
  approvedMemoryFacts: Record<string, unknown>[];
  recentPosts: Record<string, unknown>[];
  recentFeedback: Record<string, unknown>[];
  performanceInsights: Record<string, unknown>[];
  automationRules: Record<string, unknown>[];
  missingContext: string[];
  safetyRules: Record<string, unknown>[];
  approvalRules: Record<string, unknown>[];
  meta: {
    organizationId: string;
    brandId: string;
    userId: string;
    operation: string;
    assembledAt: string;
    contextVersion: string;
  };
}

export interface CompiledAiContext {
  systemContext: string;
  brandContextBlock: string;
  operationContext: string;
  safetyContext: string;
  userRequestContext: string;
  outputSchemaRequirement: string;
  missingContextWarnings: string[];
  compactSummary: string;
}
