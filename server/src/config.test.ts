import { afterEach, describe, expect, it } from 'vitest';
import {
  checkUserAccess,
  getProductionReadiness,
  getSupabaseServerCredentials,
  isDevelopmentIdentityEnabled,
  isWorkerEnabled,
  type WorkerFlag,
} from './config.js';

const flags: WorkerFlag[] = [
  'PUBLISH_WORKER_ENABLED',
  'ANALYTICS_WORKER_ENABLED',
  'AGENT_WORKER_ENABLED',
];
const originalNodeEnv = process.env.NODE_ENV;
const originals = Object.fromEntries(flags.map((flag) => [flag, process.env[flag]]));
const accessVariables = [
  'STEWARD_ACCESS_MODE',
  'STEWARD_OWNER_USER_IDS',
  'SUPABASE_URL',
  'SUPABASE_SECRET_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SERVICE_KEY',
  'STEWARD_ENABLE_DEMO_DATA',
] as const;
const originalAccess = Object.fromEntries(accessVariables.map((key) => [key, process.env[key]]));

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  for (const flag of flags) {
    const value = originals[flag];
    if (value === undefined) delete process.env[flag];
    else process.env[flag] = value;
  }
  for (const key of accessVariables) {
    const value = originalAccess[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe('owner access', () => {
  it('allows only configured owners in owner mode', () => {
    process.env.STEWARD_ACCESS_MODE = 'owner';
    process.env.STEWARD_OWNER_USER_IDS = 'owner-one, owner-two';
    expect(checkUserAccess('owner-two')).toMatchObject({ allowed: true, configured: true, mode: 'owner' });
    expect(checkUserAccess('someone-else')).toMatchObject({ allowed: false, configured: true, mode: 'owner' });
  });

  it('fails production readiness when owner access or Supabase is missing', () => {
    process.env.NODE_ENV = 'production';
    process.env.STEWARD_ACCESS_MODE = 'owner';
    delete process.env.STEWARD_OWNER_USER_IDS;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(getProductionReadiness()).toEqual({
      ready: false,
      missing: ['SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'STEWARD_OWNER_USER_IDS'],
    });
  });

  it('never enables a development identity in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.STEWARD_ACCESS_MODE = 'open';
    process.env.STEWARD_ENABLE_DEMO_DATA = 'true';
    expect(isDevelopmentIdentityEnabled()).toBe(false);
  });

  it('removes invisible byte-order marks and whitespace from Supabase credentials', () => {
    process.env.SUPABASE_URL = '\uFEFF https://example.supabase.co \r\n';
    process.env.SUPABASE_SECRET_KEY = '\uFEFFsb_secret_example';
    expect(getSupabaseServerCredentials()).toEqual({
      url: 'https://example.supabase.co',
      key: 'sb_secret_example',
    });
  });
});

describe('isWorkerEnabled', () => {
  it('starts workers by default in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.PUBLISH_WORKER_ENABLED;
    expect(isWorkerEnabled('PUBLISH_WORKER_ENABLED')).toBe(true);
  });

  it('keeps workers off by default outside production', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.ANALYTICS_WORKER_ENABLED;
    expect(isWorkerEnabled('ANALYTICS_WORKER_ENABLED')).toBe(false);
  });

  it('honors an explicit operator override', () => {
    process.env.NODE_ENV = 'production';
    process.env.AGENT_WORKER_ENABLED = 'false';
    expect(isWorkerEnabled('AGENT_WORKER_ENABLED')).toBe(false);
  });
});
