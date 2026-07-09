/**
 * Workspace resolution: auth user → organization → brand.
 */

import { getSupabaseClient } from '../supabase.js';
import { verifyOrgMembership } from './ai-jobs-db.js';
import { getPermissions, type WorkspacePermissions } from './permissions.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SetupStep = 'organization' | 'brand' | 'brand_profile' | 'onboarding';

export interface WorkspaceUser {
  id: string;
  email?: string;
}

export interface WorkspaceProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface WorkspaceOrganization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  defaultBrandId: string | null;
  onboardingStatus: string;
  timezone: string;
}

export interface WorkspaceBrand {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  businessName: string | null;
  isDefault: boolean;
}

export interface WorkspaceState {
  user: WorkspaceUser;
  profile: WorkspaceProfile | null;
  organization: WorkspaceOrganization | null;
  organizationId: string | null;
  organizationRole: string | null;
  brand: WorkspaceBrand | null;
  brandId: string | null;
  brands: WorkspaceBrand[];
  organizations: WorkspaceOrganization[];
  permissions: WorkspacePermissions;
  missingSetupSteps: SetupStep[];
  supabaseConfigured: boolean;
}

function isUuid(value: string | undefined | null): value is string {
  return Boolean(value && UUID_RE.test(value));
}

export async function loadUserOrganizations(userId: string): Promise<{
  organizations: WorkspaceOrganization[];
  roles: Record<string, string>;
}> {
  const client = getSupabaseClient();
  if (!client) return { organizations: [], roles: {} };

  const roles: Record<string, string> = {};

  const { data: memberships } = await client
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', userId);

  for (const m of memberships ?? []) {
    roles[m.organization_id as string] = m.role as string;
  }

  const { data: owned } = await client.from('organizations').select('*').eq('owner_id', userId);

  for (const org of owned ?? []) {
    if (!roles[org.id as string]) roles[org.id as string] = 'owner';
  }

  const orgIds = Object.keys(roles);
  if (orgIds.length === 0) return { organizations: [], roles };

  const { data: orgs } = await client.from('organizations').select('*').in('id', orgIds).is('archived_at', null);

  const organizations: WorkspaceOrganization[] = (orgs ?? []).map((o) => ({
    id: o.id as string,
    name: o.name as string,
    slug: o.slug as string,
    ownerId: o.owner_id as string,
    defaultBrandId: (o.default_brand_id as string) ?? null,
    onboardingStatus: (o.onboarding_status as string) ?? 'pending',
    timezone: (o.timezone as string) ?? 'UTC',
  }));

  return { organizations, roles };
}

export async function loadOrganizationBrands(organizationId: string): Promise<WorkspaceBrand[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data } = await client
    .from('brands')
    .select('id, organization_id, name, slug, business_name, is_default')
    .eq('organization_id', organizationId)
    .is('archived_at', null)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });

  return (data ?? []).map((b) => ({
    id: b.id as string,
    organizationId: b.organization_id as string,
    name: b.name as string,
    slug: b.slug as string,
    businessName: (b.business_name as string) ?? null,
    isDefault: Boolean(b.is_default),
  }));
}

export async function resolveWorkspace(
  user: WorkspaceUser,
  options?: { organizationId?: string; brandId?: string }
): Promise<WorkspaceState> {
  const client = getSupabaseClient();
  const emptyPerms = getPermissions('viewer');

  if (!client) {
    return {
      user,
      profile: null,
      organization: null,
      organizationId: null,
      organizationRole: null,
      brand: null,
      brandId: null,
      brands: [],
      organizations: [],
      permissions: emptyPerms,
      missingSetupSteps: ['organization'],
      supabaseConfigured: false,
    };
  }

  const { data: profileRow } = await client
    .from('profiles')
    .select('id, email, display_name, full_name, avatar_url, organization_id')
    .eq('id', user.id)
    .maybeSingle();

  const profile: WorkspaceProfile | null = profileRow
    ? {
        id: profileRow.id as string,
        email: (profileRow.email as string) ?? user.email ?? null,
        displayName: (profileRow.display_name as string) ?? null,
        fullName: (profileRow.full_name as string) ?? null,
        avatarUrl: (profileRow.avatar_url as string) ?? null,
      }
    : null;

  const { organizations, roles } = await loadUserOrganizations(user.id);

  if (organizations.length === 0) {
    return {
      user,
      profile,
      organization: null,
      organizationId: null,
      organizationRole: null,
      brand: null,
      brandId: null,
      brands: [],
      organizations: [],
      permissions: emptyPerms,
      missingSetupSteps: ['organization'],
      supabaseConfigured: true,
    };
  }

  let organizationId = options?.organizationId;
  if (organizationId && !isUuid(organizationId)) {
    const err = new Error('Invalid organization ID');
    (err as Error & { code: string }).code = 'INVALID_ORG';
    throw err;
  }

  if (organizationId && !roles[organizationId]) {
    const err = new Error('You are not a member of this organization');
    (err as Error & { code: string }).code = 'ORG_ACCESS_DENIED';
    throw err;
  }

  if (!organizationId) {
    const profileOrg = profileRow?.organization_id as string | undefined;
    if (profileOrg && roles[profileOrg]) {
      organizationId = profileOrg;
    } else {
      organizationId = organizations[0]!.id;
    }
  }

  const organization = organizations.find((o) => o.id === organizationId) ?? null;
  const organizationRole = roles[organizationId] ?? 'member';
  const permissions = getPermissions(organizationRole);

  const brands = await loadOrganizationBrands(organizationId);
  const missingSetupSteps: SetupStep[] = [];

  if (!organization) {
    missingSetupSteps.push('organization');
  }

  if (brands.length === 0) {
    missingSetupSteps.push('brand');
  }

  let brandId = options?.brandId;
  if (brandId && !isUuid(brandId)) {
    const err = new Error('Invalid brand ID');
    (err as Error & { code: string }).code = 'INVALID_BRAND';
    throw err;
  }

  if (brandId) {
    const belongs = brands.some((b) => b.id === brandId);
    if (!belongs) {
      const err = new Error('Brand does not belong to this organization');
      (err as Error & { code: string }).code = 'BRAND_ACCESS_DENIED';
      throw err;
    }
  } else if (organization?.defaultBrandId && brands.some((b) => b.id === organization.defaultBrandId)) {
    brandId = organization.defaultBrandId;
  } else if (brands.length > 0) {
    brandId = brands.find((b) => b.isDefault)?.id ?? brands[0]!.id;
  }

  const brand = brandId ? (brands.find((b) => b.id === brandId) ?? null) : null;

  if (organization?.onboardingStatus && organization.onboardingStatus !== 'completed') {
    missingSetupSteps.push('onboarding');
  }

  if (brandId) {
    const { data: brandProfile } = await client
      .from('brand_profiles')
      .select('id')
      .eq('brand_id', brandId)
      .maybeSingle();
    if (!brandProfile) missingSetupSteps.push('brand_profile');
  }

  return {
    user,
    profile,
    organization,
    organizationId,
    organizationRole,
    brand,
    brandId: brandId ?? null,
    brands,
    organizations,
    permissions,
    missingSetupSteps,
    supabaseConfigured: true,
  };
}

export async function assertWorkspaceAccess(
  userId: string,
  organizationId: string,
  brandId?: string
): Promise<string> {
  const role = await verifyOrgMembership(userId, organizationId);
  if (brandId && isUuid(brandId)) {
    const brands = await loadOrganizationBrands(organizationId);
    if (!brands.some((b) => b.id === brandId)) {
      const err = new Error('Brand does not belong to this organization');
      (err as Error & { code: string }).code = 'BRAND_ACCESS_DENIED';
      throw err;
    }
  }
  return role;
}

export async function logAuditEvent(input: {
  organizationId: string;
  brandId?: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.from('audit_logs').insert({
    organization_id: input.organizationId,
    brand_id: input.brandId ?? null,
    actor_user_id: input.actorUserId,
    actor_type: 'user',
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    before_state: input.beforeState ?? null,
    after_state: input.afterState ?? null,
    metadata: input.metadata ?? {},
  });
}
