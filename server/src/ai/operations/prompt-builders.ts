/**
 * Steward AI Gateway — operation-specific user prompt builders.
 */

import { wrapUserContent } from '../guardrails.js';
import type { StewardBrandContext } from '../../types/brand-intelligence.js';

export function buildMediaAnalysisUserPrompt(input: {
  assetDescription: string;
  mimeType?: string;
  fileName?: string;
  userNotes?: string;
}): string {
  return [
    'Analyze this media for social content opportunities.',
    `MIME type: ${input.mimeType ?? 'unknown'}`,
    `File name: ${input.fileName ?? 'unknown'}`,
    wrapUserContent('MEDIA DESCRIPTION', input.assetDescription),
    input.userNotes ? wrapUserContent('USER NOTES', input.userNotes) : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function buildPostDraftUserPrompt(input: {
  ctx: StewardBrandContext;
  assetSummaries?: string[];
  userPrompt?: string;
  platforms?: string[];
}): string {
  return [
    'Generate one post draft grounded in brand context.',
    input.platforms?.length ? `Target platforms: ${input.platforms.join(', ')}` : '',
    input.assetSummaries?.length
      ? `Media context:\n${input.assetSummaries.map((s) => `- ${s}`).join('\n')}`
      : '',
    input.userPrompt ? wrapUserContent('USER REQUEST', input.userPrompt) : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function buildPlatformVariantUserPrompt(input: {
  postContent: string;
  platforms: string[];
  hook?: string;
  hashtags?: string[];
}): string {
  return [
    'Generate platform-specific variants for the post draft below.',
    `Platforms: ${input.platforms.join(', ')}`,
    input.hook ? `Hook: ${input.hook}` : '',
    input.hashtags?.length ? `Seed hashtags: ${input.hashtags.join(' ')}` : '',
    wrapUserContent('POST DRAFT', input.postContent),
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function buildScheduleUserPrompt(input: {
  platform: string;
  timezone: string;
  contentPillar?: string;
  draftCaption?: string;
  existingScheduled: string[];
}): string {
  return [
    `Recommend a posting datetime for platform: ${input.platform}`,
    `Timezone: ${input.timezone}`,
    input.contentPillar ? `Content pillar: ${input.contentPillar}` : '',
    input.draftCaption ? wrapUserContent('DRAFT CAPTION', input.draftCaption) : '',
    input.existingScheduled.length
      ? `Existing scheduled posts:\n${input.existingScheduled.map((s) => `- ${s}`).join('\n')}`
      : 'No existing scheduled posts in the next 7 days.',
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function buildContentScoreUserPrompt(input: {
  caption: string;
  platform: string;
  hook?: string;
}): string {
  return [
    `Score this content for platform: ${input.platform}`,
    input.hook ? `Hook: ${input.hook}` : '',
    wrapUserContent('CAPTION', input.caption),
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function buildModerationUserPrompt(input: {
  caption: string;
  platform: string;
  isKidsContent?: boolean;
}): string {
  return [
    `Moderate this content for platform: ${input.platform}`,
    input.isKidsContent ? 'This content relates to kids/family programming — apply extra safety checks.' : '',
    wrapUserContent('CONTENT', input.caption),
  ]
    .filter(Boolean)
    .join('\n\n');
}
