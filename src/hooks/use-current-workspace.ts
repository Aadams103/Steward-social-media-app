/**
 * Central workspace state — auth user → organization → brand.
 */

import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { workspaceApi, type WorkspaceResponse } from "@/sdk/services/api-services";
import { useAppStore } from "@/store/app-store";

const ORG_STORAGE_KEY = "steward_organization_id";
const BRAND_STORAGE_KEY = "steward_active_brand_id";

export type CurrentWorkspace = WorkspaceResponse["workspace"];

let cachedWorkspace: CurrentWorkspace | null = null;

export function getStoredOrganizationId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ORG_STORAGE_KEY);
}

export function getStoredBrandId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(BRAND_STORAGE_KEY);
}

export function persistWorkspaceSelection(organizationId: string | null, brandId: string | null) {
  if (typeof window === "undefined") return;
  if (organizationId) {
    localStorage.setItem(ORG_STORAGE_KEY, organizationId);
  } else {
    localStorage.removeItem(ORG_STORAGE_KEY);
  }
  if (brandId) {
    localStorage.setItem(BRAND_STORAGE_KEY, brandId);
  } else {
    localStorage.removeItem(BRAND_STORAGE_KEY);
  }
}

export function getCurrentWorkspace(): CurrentWorkspace | null {
  return cachedWorkspace;
}

export function requireCurrentWorkspace(): CurrentWorkspace {
  const ws = getCurrentWorkspace();
  if (!ws?.organizationId || !ws.brandId) {
    throw new Error("Workspace not ready — organization and brand are required.");
  }
  return ws;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isRealWorkspace(ws: CurrentWorkspace | null | undefined): boolean {
  return Boolean(
    ws?.organizationId &&
      ws.brandId &&
      UUID_RE.test(ws.organizationId) &&
      UUID_RE.test(ws.brandId)
  );
}

function syncAppStore(workspace: CurrentWorkspace) {
  const { setCurrentOrganization, setActiveBrandId, setBrands } = useAppStore.getState();

  if (workspace.organization) {
    setCurrentOrganization({
      id: workspace.organization.id,
      name: workspace.organization.name,
      slug: workspace.organization.slug,
      ownerId: workspace.organization.ownerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      billingPlan: "free",
      billingStatus: "active",
      settings: {
        timezone: workspace.organization.timezone,
        defaultApprovalWindow: "2h",
        autoEnableNewAccounts: false,
        requireMfaForPublishing: false,
      },
    });
  } else {
    setCurrentOrganization(null);
  }

  if (workspace.brandId) {
    setActiveBrandId(workspace.brandId);
  }

  if (workspace.brands.length > 0) {
    setBrands(
      workspace.brands.map((b) => ({
        id: b.id,
        organizationId: b.organizationId,
        name: b.name,
        slug: b.slug,
        businessName: b.businessName ?? undefined,
        isDefault: b.isDefault,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );
  }
}

export function useCurrentWorkspace() {
  const queryClient = useQueryClient();
  const storedOrgId = getStoredOrganizationId();
  const storedBrandId = getStoredBrandId();

  const query = useQuery({
    queryKey: ["workspace", storedOrgId, storedBrandId],
    queryFn: async () => {
      const res = await workspaceApi.get({
        organizationId: storedOrgId ?? undefined,
        brandId: storedBrandId && storedBrandId !== "all" ? storedBrandId : undefined,
      });
      cachedWorkspace = res.workspace;
      syncAppStore(res.workspace);
      if (res.workspace.organizationId && res.workspace.brandId) {
        persistWorkspaceSelection(res.workspace.organizationId, res.workspace.brandId);
      }
      return res.workspace;
    },
    staleTime: 60 * 1000,
    retry: (failureCount, error) => {
      const code = (error as { code?: string })?.code;
      if (code === "FORBIDDEN" || code === "INVALID_ORG") return false;
      return failureCount < 2;
    },
  });

  useEffect(() => {
    if (query.error) {
      const code = (query.error as { code?: string })?.code;
      if (code === "FORBIDDEN" || code === "INVALID_ORG" || code === "BRAND_ACCESS_DENIED") {
        persistWorkspaceSelection(null, null);
        cachedWorkspace = null;
      }
    }
  }, [query.error]);

  const selectOrganization = useCallback(
    async (organizationId: string, brandId?: string) => {
      persistWorkspaceSelection(organizationId, brandId ?? null);
      const res = await workspaceApi.select({ organizationId, brandId });
      cachedWorkspace = res.workspace;
      syncAppStore(res.workspace);
      if (res.workspace.organizationId && res.workspace.brandId) {
        persistWorkspaceSelection(res.workspace.organizationId, res.workspace.brandId);
      }
      await queryClient.invalidateQueries({ queryKey: ["workspace"] });
      return res.workspace;
    },
    [queryClient]
  );

  const selectBrand = useCallback(
    async (brandId: string) => {
      const orgId = query.data?.organizationId ?? storedOrgId;
      if (!orgId) throw new Error("No organization selected");
      return selectOrganization(orgId, brandId);
    },
    [query.data?.organizationId, selectOrganization, storedOrgId]
  );

  const workspace = query.data ?? null;
  const needsOnboarding =
    workspace?.missingSetupSteps?.includes("organization") ||
    workspace?.missingSetupSteps?.includes("brand") ||
    workspace?.missingSetupSteps?.includes("onboarding");

  return {
    user: workspace?.user ?? null,
    profile: workspace?.profile ?? null,
    organization: workspace?.organization ?? null,
    organizationId: workspace?.organizationId ?? null,
    organizationRole: workspace?.organizationRole ?? null,
    brand: workspace?.brand ?? null,
    brandId: workspace?.brandId ?? null,
    brands: workspace?.brands ?? [],
    organizations: workspace?.organizations ?? [],
    permissions: workspace?.permissions ?? null,
    loading: query.isLoading,
    error: query.error as Error | null,
    missingSetupSteps: workspace?.missingSetupSteps ?? [],
    supabaseConfigured: workspace?.supabaseConfigured ?? false,
    isRealWorkspace: isRealWorkspace(workspace),
    needsOnboarding: Boolean(needsOnboarding),
    selectOrganization,
    selectBrand,
    refetch: query.refetch,
  };
}
