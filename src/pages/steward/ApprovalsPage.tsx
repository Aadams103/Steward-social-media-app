import * as React from "react";
import { usePosts } from "@/hooks/use-api";
import { useAppStore } from "@/store/app-store";
import {
  PlatformPreview,
  StewardEmptyState,
  StatusChip,
  postStatusTone,
  AIConfidenceBadge,
  SafetyWarningCard,
} from "@/components/steward";
import { mapPostStatus } from "@/lib/steward-status";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import type { Post, Platform } from "@/types/app";

const REVIEW_STATUSES = new Set(["pending", "pending_approval", "needs_review", "draft"]);

export function ApprovalsPage() {
  const { data, isLoading } = usePosts();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<"all" | "high">("all");

  const queue = (data?.posts ?? []).filter((p) => REVIEW_STATUSES.has(p.status));
  const selected = queue.find((p) => p.id === selectedId) ?? queue[0];

  React.useEffect(() => {
    if (queue.length && !selectedId) setSelectedId(queue[0]!.id);
  }, [queue, selectedId]);

  if (isLoading) return <LoadingSkeleton className="h-96 w-full" />;

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Approval Queue</h1>
        <p className="text-sm text-muted-foreground">
          Review what will be posted, where, when, and which account — before anything goes live.
        </p>
      </div>

      {queue.length === 0 ? (
        <StewardEmptyState
          title="Nothing needs review"
          description="When Steward or your team sends drafts for approval, they will appear here with safety flags and AI context."
          actionLabel="Open Create Studio"
          onAction={() => useAppStore.getState().setActiveView("studio")}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <Card className="border-border/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{queue.length} items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-2">
              {queue.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => setSelectedId(post.id)}
                  className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                    selected?.id === post.id ? "border-primary bg-primary/5" : "border-border/60 hover:bg-muted/50"
                  }`}
                >
                  <p className="line-clamp-2">{post.content}</p>
                  <div className="mt-2 flex gap-2">
                    <StatusChip label={mapPostStatus(post.status)} tone={postStatusTone(mapPostStatus(post.status))} />
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {selected && <ApprovalDetail post={selected} />}
        </div>
      )}
    </div>
  );
}

function ApprovalDetail({ post }: { post: Post }) {
  return (
    <div className="space-y-4">
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">Approval detail</CardTitle>
          <CardDescription>
            Platform: {post.platform} · Status: {mapPostStatus(post.status)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SafetyWarningCard
            title="Review checklist"
            warnings={[
              "Verify business facts against Brand Intelligence — Steward does not invent programs or times.",
              "Confirm the connected account matches the intended platform.",
              post.scheduledTime ? `Scheduled: ${post.scheduledTime}` : "Not yet scheduled",
            ]}
          />
          <div className="flex flex-wrap gap-2">
            <Button>Approve</Button>
            <Button variant="outline">Request changes</Button>
            <Button variant="ghost">Reject</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Approve/schedule actions require backend permissions and connected accounts. Actions are disabled until wired to your org role.
          </p>
        </CardContent>
      </Card>
      <PlatformPreview
        platform={post.platform as Platform}
        caption={post.content}
        hashtags={post.hashtags ?? []}
        ready={false}
        warnings={["Human review required"]}
      />
    </div>
  );
}
