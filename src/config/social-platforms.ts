/**
 * Social Media Platforms Configuration
 * 
 * This file defines which platforms are considered "social media" for calendar,
 * posting cadence, and platform filters. Slack and Notion are NOT social platforms
 * and should be excluded from these contexts.
 */

import type { Platform } from '@/types/app';

/**
 * List of social media platforms only (excludes Slack and Notion)
 * Based on the Platform type, we include: facebook, instagram, linkedin, tiktok, pinterest, reddit
 */
export const SOCIAL_PLATFORMS: Platform[] = [
  'instagram',
  'facebook',
  'linkedin',
  'tiktok',
  'pinterest',
  'reddit',
];

/**
 * Check if a platform is a social media platform
 */
export function isSocialPlatform(platform: Platform | string): boolean {
  // Map 'x' and 'twitter' to handle both naming conventions
  const normalized = platform === 'twitter' ? 'x' : platform;
  return SOCIAL_PLATFORMS.includes(normalized as Platform);
}

/**
 * Filter platforms array to only include social platforms
 */
export function filterSocialPlatforms<T extends { platform: Platform | string }>(
  items: T[]
): T[] {
  return items.filter(item => isSocialPlatform(item.platform));
}
