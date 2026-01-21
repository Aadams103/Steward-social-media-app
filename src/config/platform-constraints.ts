/**
 * Platform Constraints Configuration
 * Single source of truth for platform-specific posting rules and limits
 */

import type { Platform } from '@/types/app';

export interface PlatformConstraint {
  maxMediaCount: number;
  supportedMediaTypes: ('image' | 'video')[];
  captionLengthLimit: number;
  aspectRatioGuidance?: {
    recommended: string[];
    min?: string;
    max?: string;
  };
  specialNotes?: string[];
}

export const PLATFORM_CONSTRAINTS: Record<Platform, PlatformConstraint> = {
  facebook: {
    maxMediaCount: 10,
    supportedMediaTypes: ['image', 'video'],
    captionLengthLimit: 63206,
    aspectRatioGuidance: {
      recommended: ['1:1', '16:9', '4:5'],
      min: '1:1',
      max: '16:9',
    },
    specialNotes: [
      'Supports carousel posts with up to 10 images/videos',
      'Video length: up to 240 minutes',
      'Image size: max 4MB',
    ],
  },
  instagram: {
    maxMediaCount: 10,
    supportedMediaTypes: ['image', 'video'],
    captionLengthLimit: 2200,
    aspectRatioGuidance: {
      recommended: ['1:1', '4:5', '9:16'],
      min: '1:1',
      max: '9:16',
    },
    specialNotes: [
      'Carousel posts support up to 10 images/videos',
      'Video length: 3-60 seconds for feed, up to 15 minutes for IGTV',
      'Square (1:1) recommended for feed posts',
      'Stories: 9:16 aspect ratio',
    ],
  },
  linkedin: {
    maxMediaCount: 9,
    supportedMediaTypes: ['image', 'video'],
    captionLengthLimit: 3000,
    aspectRatioGuidance: {
      recommended: ['1.91:1', '1:1'],
      min: '1:1',
      max: '1.91:1',
    },
    specialNotes: [
      'Carousel posts support up to 9 images',
      'Video length: 3 seconds to 10 minutes',
      'Professional tone recommended',
    ],
  },
  tiktok: {
    maxMediaCount: 1,
    supportedMediaTypes: ['video'],
    captionLengthLimit: 2200,
    aspectRatioGuidance: {
      recommended: ['9:16'],
      min: '9:16',
      max: '9:16',
    },
    specialNotes: [
      'Vertical video only (9:16)',
      'Video length: 15 seconds to 10 minutes',
      'Hashtags recommended (3-5)',
    ],
  },
  pinterest: {
    maxMediaCount: 5,
    supportedMediaTypes: ['image', 'video'],
    captionLengthLimit: 500,
    aspectRatioGuidance: {
      recommended: ['2:3', '1:1'],
      min: '2:3',
      max: '2:3',
    },
    specialNotes: [
      'Vertical images perform best (2:3)',
      'Image size: recommended 1000x1500px',
      'Rich Pins require specific metadata',
    ],
  },
  reddit: {
    maxMediaCount: 1,
    supportedMediaTypes: ['image'],
    captionLengthLimit: 40000,
    aspectRatioGuidance: {
      recommended: ['16:9', '1:1'],
    },
    specialNotes: [
      'No video support in standard posts',
      'Subreddit-specific rules may apply',
      'Long-form text posts are common',
    ],
  },
  slack: {
    maxMediaCount: 0,
    supportedMediaTypes: [],
    captionLengthLimit: 4000,
    specialNotes: [
      'Text-only posts',
      'File attachments handled separately',
      'Markdown formatting supported',
    ],
  },
  notion: {
    maxMediaCount: 0,
    supportedMediaTypes: [],
    captionLengthLimit: 20000,
    specialNotes: [
      'Text and rich content blocks',
      'Media embedded as blocks, not inline',
      'Markdown and rich text formatting',
    ],
  },
  youtube: {
    maxMediaCount: 1,
    supportedMediaTypes: ['video'],
    captionLengthLimit: 5000,
    aspectRatioGuidance: {
      recommended: ['16:9'],
      min: '16:9',
      max: '16:9',
    },
    specialNotes: [
      'Video length: 1 minute to 12 hours',
      'Horizontal video only (16:9)',
      'Supports captions and descriptions',
    ],
  },
  x: {
    maxMediaCount: 4,
    supportedMediaTypes: ['image', 'video'],
    captionLengthLimit: 280,
    aspectRatioGuidance: {
      recommended: ['16:9', '1:1'],
    },
    specialNotes: [
      'Character limit: 280 characters',
      'Video length: up to 2 minutes 20 seconds',
      'Threads supported for longer content',
    ],
  },
  google_business_profile: {
    maxMediaCount: 10,
    supportedMediaTypes: ['image', 'video'],
    captionLengthLimit: 1500,
    aspectRatioGuidance: {
      recommended: ['16:9', '1:1'],
    },
    specialNotes: [
      'Supports posts, events, offers, and updates',
      'Image size: max 5MB',
      'Video length: up to 30 seconds',
    ],
  },
};

/**
 * Validate media count against platform constraints
 */
export function validateMediaCount(platform: Platform, mediaCount: number): { valid: boolean; error?: string } {
  const constraint = PLATFORM_CONSTRAINTS[platform];
  if (mediaCount > constraint.maxMediaCount) {
    return {
      valid: false,
      error: `${platform} supports a maximum of ${constraint.maxMediaCount} media item(s). You have ${mediaCount}.`,
    };
  }
  return { valid: true };
}

/**
 * Validate caption length against platform constraints
 */
export function validateCaptionLength(platform: Platform, captionLength: number): { valid: boolean; warning?: string; error?: string } {
  const constraint = PLATFORM_CONSTRAINTS[platform];
  const warningThreshold = constraint.captionLengthLimit * 0.9; // Warn at 90% of limit
  
  if (captionLength > constraint.captionLengthLimit) {
    return {
      valid: false,
      error: `Caption exceeds ${platform}'s limit of ${constraint.captionLengthLimit} characters (${captionLength} characters).`,
    };
  }
  
  if (captionLength > warningThreshold) {
    return {
      valid: true,
      warning: `Caption is approaching ${platform}'s limit (${captionLength}/${constraint.captionLengthLimit} characters).`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate media types against platform constraints
 */
export function validateMediaTypes(platform: Platform, mediaTypes: ('image' | 'video')[]): { valid: boolean; error?: string } {
  const constraint = PLATFORM_CONSTRAINTS[platform];
  
  for (const mediaType of mediaTypes) {
    if (!constraint.supportedMediaTypes.includes(mediaType)) {
      return {
        valid: false,
        error: `${platform} does not support ${mediaType} media. Supported types: ${constraint.supportedMediaTypes.join(', ')}.`,
      };
    }
  }
  
  return { valid: true };
}

/**
 * Get platform constraint for a given platform
 */
export function getPlatformConstraint(platform: Platform): PlatformConstraint {
  return PLATFORM_CONSTRAINTS[platform];
}
