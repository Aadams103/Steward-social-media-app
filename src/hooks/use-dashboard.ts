import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/sdk/services/api-services";

export function useDashboardSummary(organizationId?: string, brandId?: string) {
  return useQuery({
    queryKey: ["dashboard-summary", organizationId, brandId],
    queryFn: () =>
      dashboardApi.getSummary({
        organizationId: organizationId!,
        brandId: brandId!,
      }),
    enabled: Boolean(organizationId && brandId),
    staleTime: 60 * 1000,
  });
}
