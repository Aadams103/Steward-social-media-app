import { afterEach, describe, expect, it } from 'vitest';
import { validateMetaReturnOrigin } from './oauth-meta.js';

const keys = ['NODE_ENV', 'FRONTEND_URL', 'FRONTEND_URLS', 'VERCEL_PREVIEW_SUFFIX', 'VERCEL_PREVIEW_PROJECT_PREFIX'] as const;
const originals = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of keys) {
    const value = originals[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe('validateMetaReturnOrigin', () => {
  it('accepts the configured production frontend', () => {
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_URL = 'https://steward.example.com';
    expect(validateMetaReturnOrigin('https://steward.example.com')).toBe('https://steward.example.com');
  });

  it('accepts only previews with the configured suffix and project prefix', () => {
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_URL = 'https://steward.example.com';
    process.env.VERCEL_PREVIEW_SUFFIX = 'team.vercel.app';
    process.env.VERCEL_PREVIEW_PROJECT_PREFIX = 'steward-';
    expect(validateMetaReturnOrigin('https://steward-abc-team.vercel.app')).toBe('https://steward-abc-team.vercel.app');
    expect(() => validateMetaReturnOrigin('https://other-abc-team.vercel.app')).toThrow('INVALID_RETURN_ORIGIN');
  });

  it('rejects unapproved redirects and URL paths', () => {
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_URL = 'https://steward.example.com';
    expect(() => validateMetaReturnOrigin('https://evil.example.com')).toThrow('INVALID_RETURN_ORIGIN');
    expect(() => validateMetaReturnOrigin('https://steward.example.com/redirect')).toThrow('INVALID_RETURN_ORIGIN');
  });
});
