import { useAppStore } from "@/store/app-store";
import { usePosts, useSocialAccounts } from "@/hooks/use-api";
import { MetricCard, StewardEmptyState } from "@/components/steward";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, LineChart } from "lucide-react";

export function AnalyticsHubPage() {
  const setActiveView = useAppStore((s) => s.setActiveView);
  const { data: postsData } = usePosts();
  const { data: accountsData } = useSocialAccounts();

  const posts = postsData?.posts ?? [];
  const published = posts.filter((p) => p.status === "published");
  const accounts = accountsData?.accounts ?? [];
  const connected = accounts.filter((a) => a.status === "connected");
  const hasData = published.length > 0 && connected.length > 0;

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
          description="Connect social accounts, publish your first scheduled post, and metrics will populate from ingestion."
          actionLabel="Connect accounts"
          onAction={() => setActiveView("accounts")}
        />
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

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Performance from synced platform metrics.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Published posts" value={published.length} />
        <MetricCard title="Connected accounts" value={connected.length} />
        <MetricCard title="Reach" value="—" hint="Sync in progress" />
        <MetricCard title="Engagement" value="—" hint="Sync in progress" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Post performance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Detailed metrics snapshots appear when analytics ingestion is connected to ingested_posts / content_insights.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
