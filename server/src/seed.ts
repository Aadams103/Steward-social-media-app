/**
 * Centralized seed data for backend initialization
 * All initial data should be defined here to prevent drift
 */

import type {
  Organization,
  Brand,
  AutopilotSettings,
} from './types';

/**
 * Default organization seed data
 */
export const defaultOrg: Organization = {
  id: 'org1',
  name: 'Default Organization',
  slug: 'default-org',
  logoUrl: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  ownerId: 'user1',
  billingPlan: 'professional',
  billingStatus: 'active',
  settings: {
    timezone: 'America/New_York',
    defaultApprovalWindow: '2h',
    autoEnableNewAccounts: false,
    requireMfaForPublishing: false,
  },
};

/**
 * Default autopilot settings
 */
export const defaultAutopilotSettings: AutopilotSettings = {
  operatingMode: 'approval',
  approvalWindow: '2h',
  noResponseAction: 'hold',
  timezone: 'America/New_York',
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  blackoutDates: [],
  platformCadence: {
    facebook: 7,
    instagram: 7,
    linkedin: 3,
    tiktok: 5,
    pinterest: 3,
    reddit: 5,
    slack: 10,
    notion: 3,
  },
  enableWebResearch: true,
  enableImageGeneration: false,
  notificationChannels: {
    inApp: true,
    email: true,
    sms: false,
    slack: false,
  },
  isPaused: false,
};

/**
 * Generate a default brand (used when no brands exist)
 */
export function createDefaultBrand(generateId: () => string): Brand {
  return {
    id: generateId(),
    name: 'Primary',
    slug: 'primary',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
