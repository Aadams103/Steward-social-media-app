/**
 * Organization role permissions for Steward workspace operations.
 */

export type OrganizationRole =
  | 'owner'
  | 'admin'
  | 'approver'
  | 'editor'
  | 'viewer'
  | 'client'
  | 'strategist'
  | 'member';

export interface WorkspacePermissions {
  canReadAiJobs: boolean;
  canReadAiJobDetails: boolean;
  canApprovePosts: boolean;
  canRejectPosts: boolean;
  canRequestChanges: boolean;
  canSendToReview: boolean;
  canEditPosts: boolean;
  canPublish: boolean;
  canApproveMemory: boolean;
  canProposeMemory: boolean;
  canManageWorkspace: boolean;
}

const POST_APPROVER_ROLES = new Set<string>(['owner', 'admin', 'approver']);
const MEMORY_APPROVER_ROLES = new Set<string>(['owner', 'admin', 'strategist']);
const EDITOR_ROLES = new Set<string>(['owner', 'admin', 'approver', 'editor', 'strategist', 'member']);

export function normalizeRole(role: string): OrganizationRole {
  const known: OrganizationRole[] = [
    'owner',
    'admin',
    'approver',
    'editor',
    'viewer',
    'client',
    'strategist',
    'member',
  ];
  return known.includes(role as OrganizationRole) ? (role as OrganizationRole) : 'member';
}

export function getPermissions(role: string): WorkspacePermissions {
  const r = normalizeRole(role);
  const isViewer = r === 'viewer';
  const isClient = r === 'client';
  const canApprove = POST_APPROVER_ROLES.has(r);
  const canEdit = EDITOR_ROLES.has(r) && !isViewer && !isClient;

  return {
    canReadAiJobs: true,
    canReadAiJobDetails: !isViewer || true,
    canApprovePosts: canApprove,
    canRejectPosts: canApprove,
    canRequestChanges: canApprove,
    canSendToReview: canEdit,
    canEditPosts: canEdit,
    canPublish: canApprove,
    canApproveMemory: MEMORY_APPROVER_ROLES.has(r),
    canProposeMemory: canEdit,
    canManageWorkspace: r === 'owner' || r === 'admin',
  };
}

export function assertPermission(
  role: string,
  permission: keyof WorkspacePermissions,
  message = 'You do not have permission for this action.'
): void {
  const perms = getPermissions(role);
  if (!perms[permission]) {
    const err = new Error(message);
    (err as Error & { code: string }).code = 'FORBIDDEN';
    throw err;
  }
}
