import { describe, it, expect } from 'vitest';
import { getPermissions, normalizeRole } from '../permissions.js';

describe('permissions', () => {
  it('viewer cannot approve posts', () => {
    const perms = getPermissions('viewer');
    expect(perms.canApprovePosts).toBe(false);
    expect(perms.canRejectPosts).toBe(false);
    expect(perms.canReadAiJobs).toBe(true);
  });

  it('owner can approve posts and memory', () => {
    const perms = getPermissions('owner');
    expect(perms.canApprovePosts).toBe(true);
    expect(perms.canApproveMemory).toBe(true);
    expect(perms.canManageWorkspace).toBe(true);
  });

  it('editor can send to review but not approve', () => {
    const perms = getPermissions('editor');
    expect(perms.canSendToReview).toBe(true);
    expect(perms.canApprovePosts).toBe(false);
  });

  it('normalizes unknown roles to member', () => {
    expect(normalizeRole('unknown')).toBe('member');
  });
});
