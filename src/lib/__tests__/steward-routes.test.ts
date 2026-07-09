import { describe, it, expect } from 'vitest';
import { STEWARD_VIEW_ROUTES, pathToView, viewToPath } from '../../../src/lib/steward-routes';

describe('steward-routes', () => {
  it('maps studio view to /app/studio', () => {
    expect(viewToPath('studio')).toBe('/app/studio');
  });

  it('maps /app/approvals to approvals view', () => {
    expect(pathToView('/app/approvals')).toBe('approvals');
  });

  it('maps /app to dashboard', () => {
    expect(pathToView('/app')).toBe('dashboard');
    expect(pathToView('/app/')).toBe('dashboard');
  });

  it('has no org1 in route map', () => {
    const values = Object.values(STEWARD_VIEW_ROUTES).join(' ');
    expect(values).not.toContain('org1');
  });
});
