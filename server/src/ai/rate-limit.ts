/**
 * Steward AI Gateway — in-memory rate limits (swap for Redis in production scale).
 */

import { AiGatewayError } from './errors.js';
import type { AiOperation } from './types.js';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const DEFAULT_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  user_default: { limit: 30, windowMs: 60 * 60 * 1000 },
  org_default: { limit: 200, windowMs: 60 * 60 * 1000 },
  operation_heavy: { limit: 10, windowMs: 60 * 60 * 1000 },
};

const HEAVY_OPS: AiOperation[] = [
  'media_analysis',
  'platform_variant_generation',
  'post_draft_generation',
];

function tierMultiplier(tier?: string): number {
  switch ((tier || 'free').toLowerCase()) {
    case 'agency':
    case 'pro_expert':
    case 'professional':
    case 'enterprise':
      return 5;
    case 'basic':
    case 'starter':
      return 2;
    default:
      return 1;
  }
}

function checkBucket(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (bucket.count >= limit) {
    throw new AiGatewayError('RATE_LIMITED', 'Rate limit exceeded. Please try again later.', 429, {
      key,
      retryAfterMs: bucket.resetAt - now,
    });
  }
  bucket.count += 1;
}

export function enforceRateLimits(input: {
  userId: string;
  organizationId: string;
  operation: AiOperation;
  subscriptionTier?: string;
}): void {
  const mult = tierMultiplier(input.subscriptionTier);
  checkBucket(
    `user:${input.userId}`,
    DEFAULT_LIMITS.user_default.limit * mult,
    DEFAULT_LIMITS.user_default.windowMs
  );
  checkBucket(
    `org:${input.organizationId}`,
    DEFAULT_LIMITS.org_default.limit * mult,
    DEFAULT_LIMITS.org_default.windowMs
  );
  if (HEAVY_OPS.includes(input.operation)) {
    checkBucket(
      `org:${input.organizationId}:heavy`,
      DEFAULT_LIMITS.operation_heavy.limit * mult,
      DEFAULT_LIMITS.operation_heavy.windowMs
    );
  }
}

export function resetRateLimitsForTests(): void {
  buckets.clear();
}
