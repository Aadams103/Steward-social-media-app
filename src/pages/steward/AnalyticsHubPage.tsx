import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { analyticsSummaryApi } from "@/sdk/services/api-services";
import { MetricCard, StewardEmptyState } from "@/components/steward";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, LineChart } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { viewToPath } from "@/lib/steward-routes";

export function AnalyticsHubPage() {
  const navigate = useNavigate();
  const { organizationId, brandId, isRealWorkspace } = useCurrentWorkspace();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics-summary", organizationId, brandId],
    queryFn: () => analyticsSummaryApi.get({ organizationId: organizationId!, brandId: brandId! }),
    enabled: isRealWorkspace,
  });

  if (!isRealWorkspace) {
    return (
      <div className="mx-auto max-w-[1280px] space-y-6">
        <StewardEmptyState
          icon={BarChart3}
          title="Workspace setup required"
          description="Analytics requires a real Supabase organization and published/synced posts."
          actionLabel="Complete onboarding"
          onAction={() => void navigate({ to: viewToPath("onboarding") })}
        />
      </div>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading analytics…</p>;
  }

  const hasData = Boolean(analytics?.has_data);

  if (!hasData) {
    return (
      <div className="mx-auto max-w-[1280px] space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">Real performance data — no fabricated metrics.</p>
        </div>
        <StewardEmptyState
          icon={BarChart3}
          title="Analytics will appear after Steward publishes or syncs posts"
          description={String(
            analytics?.message ??
              "Connect social accounts, publish your first scheduled post, and metrics will populate from ingestion."
          )}
          actionLabel="Connect accounts"
          onAction={() => void navigate({ to: viewToPath("accounts") })}
        />
        {(analytics?.setup_required as string[] | undefined)?.length ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Setup required</CardTitle>
              <CardDescription>{(analytics?.setup_required as string[]).join(", ")}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">What you&apos;ll see</CardTitle>
            <CardDescription>Reach, impressions, engagement, top posts, and best content pillars.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
            <LineChart className="h-12 w-12 opacity-30" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const summary = analytics?.summary as Record<string, unknown> | undefined;

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Performance from synced platform metrics.{" "}
          {analytics?.message ? String(analytics.message) : ""}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Published posts" value={String(summary?.published_posts ?? "—")} />
        <MetricCard title="Connected accounts" value={String(summary?.connected_accounts ?? "—")} />
        <MetricCard
          title="Content insights"
          value={String((summary?.content_insights as unknown[])?.length ?? 0)}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Partial data sources</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Missing: {((analytics?.missing_sources as string[]) ?? []).join(", ") || "none"}
        </CardContent>
      </Card>
    </div>
  );
}
