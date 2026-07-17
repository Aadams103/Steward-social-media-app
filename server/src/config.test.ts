import { afterEach, describe, expect, it } from 'vitest';
import { isWorkerEnabled, type WorkerFlag } from './config.js';

const flags: WorkerFlag[] = [
  'PUBLISH_WORKER_ENABLED',
  'ANALYTICS_WORKER_ENABLED',
  'AGENT_WORKER_ENABLED',
];
const originalNodeEnv = process.env.NODE_ENV;
const originals = Object.fromEntries(flags.map((flag) => [flag, process.env[flag]]));

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  for (const flag of flags) {
    const value = originals[flag];
    if (value === undefined) delete process.env[flag];
    else process.env[flag] = value;
  }
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
