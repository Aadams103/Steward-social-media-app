import * as React from "react";
import { format } from "date-fns";
import {
  ImagePlus,
  PenSquare,
  ShieldCheck,
  Sparkles,
  Upload,
  CalendarDays,
  Link2,
  Brain,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/app-store";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { usePosts, useSocialAccounts, useAssets } from "@/hooks/use-api";
import { useDashboardSummary } from "@/hooks/use-dashboard";
import { useQuery } from "@tanstack/react-query";
import { publishHealthApi, analyticsSummaryApi } from "@/sdk/services/api-services";
import { useNavigate } from "@tanstack/react-router";
import { viewToPath } from "@/lib/steward-routes";
import {
  MetricCard,
  QuickActionGrid,
  SystemStatusBar,
  BrandCompletenessCard,
  StewardEmptyState,
  StatusChip,
  postStatusTone,
} from "@/components/steward";
import { mapPostStatus } from "@/lib/steward-status";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import type { Platform } from "@/types/app";

export function CommandCenterPage() {
  const routerNavigate = useNavigate();
  const { organizationId, brandId, isRealWorkspace, organization, brand, missingSetupSteps } =
    useCurrentWorkspace();
  const setActiveView = useAppStore((s) => s.setActiveView);
  const [displayName, setDisplayName] = React.useState<string>("there");

  const goToView = (view: string) => {
    setActiveView(view);
    void routerNavigate({ to: viewToPath(view) });
  };

  const { data: summaryData, isLoading: summaryLoading } = useDashboardSummary(
    isRealWorkspace ? organizationId! : undefined,
    isRealWorkspace ? brandId! : undefined,
  );

  const { data: publishHealth } = useQuery({
    queryKey: ["publish-health", organizationId, brandId],
    queryFn: () => publishHealthApi.get({ organizationId: organizationId!, brandId: brandId! }),
    enabled: isRealWorkspace,
  });

  const { data: analyticsSummary } = useQuery({
    queryKey: ["analytics-summary", organizationId, brandId],
    queryFn: () => analyticsSummaryApi.get({ organizationId: organizationId!, brandId: brandId! }),
    enabled: isRealWorkspace,
  });

  const { data: postsData, isLoading: postsLoading } = usePosts(
    isRealWorkspace ? { organizationId: organizationId!, brandId: brandId! } : undefined,
  );
  const { data: accountsData } = useSocialAccounts();
  const { data: assetsData } = useAssets();

  React.useEffect(() => {
    const client = supabase;
    if (!client) return;
    void client.auth.getSession().then(({ data }) => {
      const name = data.session?.user?.user_metadata?.display_name as string | undefined;
      if (name) setDisplayName(name.split(" ")[0] ?? "there");
    });
  }, []);

  const summary = summaryData?.summary;
  const posts = postsData?.posts ?? [];
  const accounts = accountsData?.accounts ?? [];
  const assets = assetsData?.assets ?? [];

  const needsReview =
    summary?.needsReview ??
    posts.filter((p) => ["pending", "pending_approval", "needs_review"].includes(p.status)).length;
  const draftsReady = summary?.draftsReady ?? posts.filter((p) => p.status === "draft").length;
  const connectedCount = summary?.connectedAccounts ?? accounts.filter((a) => a.status === "connected").length;
  const scheduledWeek = summary?.scheduledThisWeek ?? posts.filter((p) => p.status === "scheduled").length;

  const upcoming = posts
    .filter((p) => p.scheduledTime && p.status === "scheduled")
    .slice(0, 5);

  const recentAssets = summary?.recentAssets?.length
    ? summary.recentAssets
    : assets.slice(0, 4).map((a) => ({
        id: a.id,
        fileName: a.metadata?.filename,
        mimeType: a.metadata?.mimeType,
      }));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const health = publishHealth?.health as Record<string, unknown> | undefined;
  const analyticsHasData = Boolean(analyticsSummary?.has_data);

  if (postsLoading && isRealWorkspace && !posts.length) {
    return <LoadingSkeleton className="h-96 w-full" />;
  }

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-background via-background to-primary/5 p-6 shadow-sm md:p-8">
        <div className="relative z-10 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {greeting}, {displayName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {summary?.brandName || brand?.name
                ? `Operating as ${summary?.brandName ?? brand?.name}${organization?.name ? ` · ${organization.name}` : ""}`
                : "Your Steward command center — content, approvals, and publish health at a glance."}
            </p>
          </div>
          <SystemStatusBar
            brandName={summary?.brandName ?? brand?.name ?? undefined}
            connectedCount={connectedCount}
            needsReview={needsReview}
            aiJobsRunning={summary?.aiJobsRunning ?? 0}
            publishFailures={(health?.failed_24h as number) ?? summary?.publishFailures ?? 0}
            planWarning={!isRealWorkspace ? "Complete workspace setup for full intelligence" : null}
          />
          <QuickActionGrid
            actions={[
              { label: "Upload media", icon: Upload, onClick: () => goToView("assets") },
              { label: "Create Studio", icon: PenSquare, onClick: () => goToView("studio") },
              { label: "Approval queue", icon: ShieldCheck, onClick: () => goToView("approvals") },
              { label: "Brand intelligence", icon: Brain, onClick: () => goToView("brand-intelligence") },
              { label: "Connect accounts", icon: Link2, onClick: () => goToView("accounts") },
              { label: "Open calendar", icon: CalendarDays, onClick: () => goToView("calendar") },
            ]}
          />
        </div>
      </div>

      {!isRealWorkspace && (
        <Card className="border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Setup required for full Steward AI
            </CardTitle>
            <CardDescription>
              No real Supabase organization is selected. Complete onboarding to unlock brand intelligence, AI jobs,
              and publish tracking.
              {missingSetupSteps.length > 0 && ` Missing: ${missingSetupSteps.join(", ")}.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm" onClick={() => goToView("onboarding")}>
              Complete setup
            </Button>
          </CardContent>
        </Card>
      )}

      {isRealWorkspace && health && (
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base">Publish health</CardTitle>
            <CardDescription>
              {health.setup_required
                ? String(health.message ?? "Connect accounts to publish.")
                : `${health.queued_count ?? 0} queued · ${health.failed_24h ?? 0} failed (24h)`}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {(health.recent_failures as unknown[])?.length ? (
              <ul className="list-disc pl-4">
                {(health.recent_failures as { platform?: string; error_message?: string }[]).map((f, i) => (
                  <li key={i}>
                    {f.platform}: {f.error_message ?? "Publish failed"}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No recent publish failures.</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Scheduled this week" value={scheduledWeek} hint="Across all platforms" />
        <MetricCard title="Drafts ready" value={draftsReady} hint="Ready to review or schedule" />
        <MetricCard title="Needs review" value={needsReview} hint="Approval queue" onClick={() => goToView("approvals")} />
        <MetricCard title="Connected accounts" value={connectedCount} hint="Publishing & analytics" onClick={() => goToView("accounts")} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/70">
          <CardHeader>
            <CardTitle className="text-base">Today&apos;s queue</CardTitle>
            <CardDescription>Scheduled for today — nothing publishes without your rules.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(summary?.todaysQueue?.length ? summary.todaysQueue : upcoming).length === 0 ? (
              <StewardEmptyState
                icon={CalendarDays}
                title="Nothing scheduled for today"
                description="Open the calendar to schedule content or generate drafts in Create Studio."
                actionLabel="Open calendar"
                onAction={() => goToView("calendar")}
              />
            ) : (
              (summary?.todaysQueue?.length ? summary.todaysQueue : upcoming).map((post) => (
                <div
                  key={post.id}
                  className="flex items-start gap-3 rounded-lg border border-border/60 bg-background p-3"
                >
                  {post.platform && (
                    <PlatformIcon platform={post.platform as Platform} className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm">{"title" in post ? post.title : "content" in post ? post.content?.slice(0, 60) : "Scheduled post"}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      {post.scheduledTime && (
                        <span>{format(new Date(post.scheduledTime), "h:mm a")}</span>
                      )}
                      <StatusChip
                        label={mapPostStatus(post.status)}
                        tone={postStatusTone(mapPostStatus(post.status))}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <BrandCompletenessCard
          score={summary?.brandCompleteness ?? (isRealWorkspace ? 40 : 0)}
          missingItems={summary?.missingBrandContext ?? missingSetupSteps}
          onOpenBrand={() => goToView("brand-intelligence")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base">Needs review</CardTitle>
          </CardHeader>
          <CardContent>
            {needsReview === 0 ? (
              <p className="text-sm text-muted-foreground">No items waiting for approval.</p>
            ) : (
              <Button variant="secondary" onClick={() => goToView("approvals")}>
                Open approval queue ({needsReview})
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              AI suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(summary?.suggestions ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Upload media or connect accounts — Steward will suggest next steps.
              </p>
            ) : (
              summary!.suggestions.map((s) => (
                <div key={s.id} className="rounded-lg border border-border/60 p-3">
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                  <Button size="sm" variant="link" className="h-auto px-0 mt-1" onClick={() => goToView(s.action)}>
                    Go →
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ImagePlus className="h-4 w-4" />
            Recently uploaded
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentAssets.length === 0 ? (
            <StewardEmptyState
              icon={Upload}
              title="No content in your library yet"
              description="Upload photos or videos and Steward can turn them into draft posts."
              actionLabel="Open library"
              onAction={() => goToView("assets")}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {recentAssets.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs"
                >
                  <p className="truncate font-medium">{a.fileName ?? "Asset"}</p>
                  <p className="text-muted-foreground">{a.mimeType ?? "media"}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isRealWorkspace && !analyticsHasData && (
        <Card className="border-dashed border-border/70">
          <CardHeader>
            <CardTitle className="text-base">Analytics snapshot</CardTitle>
            <CardDescription>
              {String(analyticsSummary?.message ?? "Analytics will appear after posts are published and synced.")}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {summaryLoading && isRealWorkspace && (
        <p className="text-center text-xs text-muted-foreground">Refreshing live dashboard data…</p>
      )}
    </div>
  );
}
