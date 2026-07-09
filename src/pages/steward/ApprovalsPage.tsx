import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { postsApi } from "@/sdk/services/api-services";
import {
  PlatformPreview,
  StewardEmptyState,
  StatusChip,
  postStatusTone,
  SafetyWarningCard,
} from "@/components/steward";
import { mapPostStatus } from "@/lib/steward-status";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { viewToPath } from "@/lib/steward-routes";
import type { Post, Platform } from "@/types/app";

const REVIEW_STATUSES = new Set(["pending", "pending_approval", "needs_review", "draft", "in_review"]);

type QueuePost = Post & { approvalState?: string };

export function ApprovalsPage() {
  const { organizationId, brandId, isRealWorkspace, permissions } = useCurrentWorkspace();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["approval-posts", organizationId, brandId],
    queryFn: () =>
      postsApi.list({
        organizationId: organizationId!,
        brandId: brandId!,
      }),
    enabled: isRealWorkspace,
  });

  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const queue = (data?.posts ?? []).filter((p) => REVIEW_STATUSES.has(p.status));
  const selected = queue.find((p) => p.id === selectedId) ?? queue[0];

  React.useEffect(() => {
    if (queue.length && !selectedId) setSelectedId(queue[0]!.id);
  }, [queue, selectedId]);

  if (!isRealWorkspace) {
    return (
      <div className="mx-auto max-w-[1280px] space-y-6">
        <StewardEmptyState
          title="Workspace setup required"
          description="Approval queue requires a real Supabase organization and brand."
          actionLabel="Complete onboarding"
          onAction={() => void navigate({ to: viewToPath("onboarding") })}
        />
      </div>
    );
  }

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
          onAction={() => void navigate({ to: viewToPath("studio") })}
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

          {selected && organizationId && (
            <ApprovalDetail
              post={selected}
              organizationId={organizationId}
              canApprove={permissions?.canApprovePosts ?? false}
              canReject={permissions?.canRejectPosts ?? false}
              canRequestChanges={permissions?.canRequestChanges ?? false}
            />
          )}
        </div>
      )}
    </div>
  );
}

function ApprovalDetail({
  post,
  organizationId,
  canApprove,
  canReject,
  canRequestChanges,
}: {
  post: QueuePost;
  organizationId: string;
  canApprove: boolean;
  canReject: boolean;
  canRequestChanges: boolean;
}) {
  const queryClient = useQueryClient();
  const [comment, setComment] = React.useState("");

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["approval-posts"] });
    void queryClient.invalidateQueries({ queryKey: ["posts"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
  };

  const approveMutation = useMutation({
    mutationFn: () => postsApi.approve(post.id, { organizationId }),
    onSuccess: () => {
      toast.success("Post approved");
      invalidate();
    },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const changesMutation = useMutation({
    mutationFn: () => postsApi.requestChanges(post.id, { organizationId, comment }),
    onSuccess: () => {
      toast.success("Changes requested");
      setComment("");
      invalidate();
    },
    onError: (e: Error) => { toast.error(e.message); },
  });

  const rejectMutation = useMutation({
    mutationFn: () => postsApi.reject(post.id, { organizationId, reason: comment }),
    onSuccess: () => {
      toast.success("Post rejected");
      setComment("");
      invalidate();
    },
    onError: (e: Error) => { toast.error(e.message); },
  });

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
          <Textarea
            placeholder="Comment or rejection reason (required for request changes / reject)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={!canApprove || approveMutation.isPending}
              onClick={() => approveMutation.mutate()}
            >
              Approve
            </Button>
            <Button
              variant="outline"
              disabled={!canRequestChanges || !comment.trim() || changesMutation.isPending}
              onClick={() => changesMutation.mutate()}
            >
              Request changes
            </Button>
            <Button
              variant="ghost"
              disabled={!canReject || !comment.trim() || rejectMutation.isPending}
              onClick={() => rejectMutation.mutate()}
            >
              Reject
            </Button>
          </div>
          {!canApprove && (
            <p className="text-xs text-muted-foreground">
              Your role cannot approve posts. Contact an owner, admin, or approver.
            </p>
          )}
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
