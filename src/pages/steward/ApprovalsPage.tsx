import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CalendarClock, Send } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  PlatformPreview,
  SafetyWarningCard,
  StatusChip,
  StewardEmptyState,
  postStatusTone,
} from "@/components/steward";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { viewToPath } from "@/lib/steward-routes";
import { mapPostStatus } from "@/lib/steward-status";
import { oauthApi, postsApi } from "@/sdk/services/api-services";
import type { Platform, Post } from "@/types/app";

const ACTIONABLE_STATUSES = new Set(["pending", "pending_approval", "needs_review", "draft", "in_review", "approved"]);
type QueuePost = Post & { approvalState?: string };

function defaultLocalSchedule(): string {
  const date = new Date(Date.now() + 15 * 60 * 1000);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function ApprovalsPage() {
  const { organizationId, brandId, isRealWorkspace, permissions } = useCurrentWorkspace();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["approval-posts", organizationId, brandId],
    queryFn: () => postsApi.list({ organizationId: organizationId!, brandId: brandId! }),
    enabled: isRealWorkspace,
  });
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const queue = (data?.posts ?? []).filter((post) => ACTIONABLE_STATUSES.has(post.status));
  const selected = queue.find((post) => post.id === selectedId) ?? queue[0];

  React.useEffect(() => {
    if (queue.length && !selectedId) setSelectedId(queue[0]!.id);
  }, [queue, selectedId]);

  if (!isRealWorkspace) {
    return (
      <div className="mx-auto max-w-[1280px] space-y-6">
        <StewardEmptyState
          title="Workspace setup required"
          description="Finish owner onboarding before reviewing and publishing content."
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
          Nothing goes live until you approve it and choose Publish now or Schedule.
        </p>
      </div>
      {queue.length === 0 ? (
        <StewardEmptyState
          title="Nothing needs review"
          description="Drafts sent for review will appear here before any live publishing action is available."
          actionLabel="Open Create Studio"
          onAction={() => void navigate({ to: viewToPath("studio") })}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <Card className="border-border/70">
            <CardHeader className="pb-2"><CardTitle className="text-base">{queue.length} items</CardTitle></CardHeader>
            <CardContent className="space-y-2 p-2">
              {queue.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => setSelectedId(post.id)}
                  className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${selected?.id === post.id ? "border-primary bg-primary/5" : "border-border/60 hover:bg-muted/50"}`}
                >
                  <p className="line-clamp-2">{post.content}</p>
                  <div className="mt-2 flex gap-2">
                    <StatusChip label={mapPostStatus(post.status)} tone={postStatusTone(mapPostStatus(post.status))} />
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
          {selected && organizationId && brandId ? (
            <ApprovalDetail
              post={selected}
              organizationId={organizationId}
              brandId={brandId}
              canApprove={permissions?.canApprovePosts ?? false}
              canReject={permissions?.canRejectPosts ?? false}
              canRequestChanges={permissions?.canRequestChanges ?? false}
              canPublish={permissions?.canPublish ?? false}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

function ApprovalDetail({
  post,
  organizationId,
  brandId,
  canApprove,
  canReject,
  canRequestChanges,
  canPublish,
}: {
  post: QueuePost;
  organizationId: string;
  brandId: string;
  canApprove: boolean;
  canReject: boolean;
  canRequestChanges: boolean;
  canPublish: boolean;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [comment, setComment] = React.useState("");
  const [scheduleTime, setScheduleTime] = React.useState(defaultLocalSchedule);
  const [selectedAccounts, setSelectedAccounts] = React.useState<string[]>([]);
  const isApproved = post.status === "approved" || post.approvalState === "approved";
  const { data: connectionData, isLoading: loadingConnections } = useQuery({
    queryKey: ["oauth-connections", organizationId, brandId],
    queryFn: () => oauthApi.list(organizationId, brandId),
  });
  const matchingConnections = (connectionData?.connections ?? []).filter((connection) => connection.platform === post.platform);
  const usableConnections = matchingConnections.filter((connection) => {
    const expired = connection.tokenExpiresAt && new Date(connection.tokenExpiresAt).getTime() <= Date.now();
    return connection.status === "connected" && !expired;
  });
  const unavailableConnections = matchingConnections.filter((connection) => !usableConnections.some((usable) => usable.id === connection.id));
  const instagramNeedsMedia = post.platform === "instagram" && (post.mediaAssetIds?.length ?? 0) === 0;

  React.useEffect(() => {
    setSelectedAccounts(usableConnections.map((connection) => connection.id));
  }, [post.id, connectionData]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["approval-posts"] });
    void queryClient.invalidateQueries({ queryKey: ["posts"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    void queryClient.invalidateQueries({ queryKey: ["publish-health"] });
  };
  const approveMutation = useMutation({
    mutationFn: () => postsApi.approve(post.id, { organizationId }),
    onSuccess: () => { toast.success("Post approved. Choose where and when to publish it."); invalidate(); },
    onError: (error: Error) => { toast.error(error.message); },
  });
  const changesMutation = useMutation({
    mutationFn: () => postsApi.requestChanges(post.id, { organizationId, comment }),
    onSuccess: () => { toast.success("Changes requested"); setComment(""); invalidate(); },
    onError: (error: Error) => { toast.error(error.message); },
  });
  const rejectMutation = useMutation({
    mutationFn: () => postsApi.reject(post.id, { organizationId, reason: comment }),
    onSuccess: () => { toast.success("Post rejected"); setComment(""); invalidate(); },
    onError: (error: Error) => { toast.error(error.message); },
  });
  const publishMutation = useMutation({
    mutationFn: () => postsApi.publish(post.id, { organizationId, socialAccountIds: selectedAccounts }),
    onSuccess: () => { toast.success("Post queued for publishing now"); invalidate(); },
    onError: (error: Error) => { toast.error(error.message); },
  });
  const scheduleMutation = useMutation({
    mutationFn: () => postsApi.schedule(post.id, {
      organizationId,
      socialAccountIds: selectedAccounts,
      scheduledTime: new Date(scheduleTime).toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
    onSuccess: () => { toast.success("Post scheduled"); invalidate(); },
    onError: (error: Error) => { toast.error(error.message); },
  });
  const canQueue = canPublish && selectedAccounts.length > 0 && !instagramNeedsMedia;

  return (
    <div className="space-y-4">
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">Approval detail</CardTitle>
          <CardDescription>Platform: {post.platform} · Status: {mapPostStatus(post.status)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SafetyWarningCard
            title="Review checklist"
            warnings={[
              "Verify business facts against Brand Intelligence.",
              "Confirm the connected account matches the intended platform.",
              post.scheduledTime ? `Previous requested time: ${String(post.scheduledTime)}` : "No publishing time selected yet",
            ]}
          />
          {!isApproved ? (
            <>
              <Textarea
                placeholder="Comment or rejection reason (required for request changes / reject)"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button disabled={!canApprove || approveMutation.isPending} onClick={() => approveMutation.mutate()}>Approve</Button>
                <Button variant="outline" disabled={!canRequestChanges || !comment.trim() || changesMutation.isPending} onClick={() => changesMutation.mutate()}>Request changes</Button>
                <Button variant="ghost" disabled={!canReject || !comment.trim() || rejectMutation.isPending} onClick={() => rejectMutation.mutate()}>Reject</Button>
              </div>
            </>
          ) : (
            <div className="space-y-4 rounded-lg border border-border/70 p-4">
              <div>
                <h3 className="font-medium">Publish approved post</h3>
                <p className="text-sm text-muted-foreground">Select the exact live account. This remains a manual owner action.</p>
              </div>
              {loadingConnections ? <LoadingSkeleton className="h-16 w-full" /> : null}
              {!loadingConnections && usableConnections.length === 0 ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
                    No active {post.platform} account is connected for this brand.
                    <Button size="sm" variant="outline" onClick={() => void navigate({ to: viewToPath("accounts") })}>Connect account</Button>
                  </AlertDescription>
                </Alert>
              ) : null}
              {usableConnections.map((connection) => (
                <Label key={connection.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border p-3 font-normal">
                  <Checkbox
                    checked={selectedAccounts.includes(connection.id)}
                    onCheckedChange={(checked) => setSelectedAccounts((current) => checked ? [...new Set([...current, connection.id])] : current.filter((id) => id !== connection.id))}
                  />
                  <span><strong>{connection.accountName}</strong><span className="block text-xs text-muted-foreground">{connection.username ? `@${connection.username}` : connection.platform}</span></span>
                </Label>
              ))}
              {unavailableConnections.length > 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
                    A connection is expired or unavailable. Reconnect it before retrying.
                    <Button size="sm" variant="outline" onClick={() => void navigate({ to: viewToPath("accounts") })}>Reconnect</Button>
                  </AlertDescription>
                </Alert>
              ) : null}
              {instagramNeedsMedia ? (
                <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>Instagram requires an approved image or video. Return this post to Create and attach media.</AlertDescription></Alert>
              ) : null}
              <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="space-y-2">
                  <Label htmlFor={`schedule-${post.id}`}>Local date and time</Label>
                  <Input id={`schedule-${post.id}`} type="datetime-local" value={scheduleTime} onChange={(event) => setScheduleTime(event.target.value)} />
                </div>
                <Button variant="outline" disabled={!canQueue || scheduleMutation.isPending || !scheduleTime} onClick={() => scheduleMutation.mutate()}>
                  <CalendarClock className="mr-2 h-4 w-4" /> Schedule
                </Button>
              </div>
              <Button className="w-full" disabled={!canQueue || publishMutation.isPending} onClick={() => publishMutation.mutate()}>
                <Send className="mr-2 h-4 w-4" /> Publish now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <PlatformPreview
        platform={post.platform as Platform}
        caption={post.content}
        hashtags={post.hashtags ?? []}
        ready={isApproved && !instagramNeedsMedia}
        warnings={isApproved ? [] : ["Human approval required"]}
      />
    </div>
  );
}
