import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { aiJobsApi, type AiJobSummary } from "@/sdk/services/api-services";
import { StewardEmptyState, AIJobStatusCard } from "@/components/steward";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Bot, Shield, Copy } from "lucide-react";
import { viewToPath } from "@/lib/steward-routes";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

/** AI Activity / Trust Center — transparent job history from real ai_jobs. */
export function AIActivityPage() {
  const navigate = useNavigate();
  const { organizationId, brandId, isRealWorkspace, permissions } = useCurrentWorkspace();
  const [selectedJobId, setSelectedJobId] = React.useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ai-jobs", organizationId, brandId],
    queryFn: () =>
      aiJobsApi.list({
        organizationId: organizationId!,
        brandId: brandId ?? undefined,
        limit: 50,
      }),
    enabled: isRealWorkspace,
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["ai-job", selectedJobId],
    queryFn: () => aiJobsApi.get(selectedJobId!),
    enabled: Boolean(selectedJobId),
  });

  const jobs = data?.jobs ?? [];

  if (!isRealWorkspace) {
    return (
      <div className="mx-auto max-w-[1280px] space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Activity</h1>
          <p className="text-sm text-muted-foreground">Connect a real Supabase organization to view AI job history.</p>
        </div>
        <StewardEmptyState
          icon={Bot}
          title="Workspace setup required"
          description="AI Activity requires real organization and brand UUIDs from your authenticated session."
          actionLabel="Complete onboarding"
          onAction={() => void navigate({ to: viewToPath("onboarding") })}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Activity</h1>
        <p className="text-sm text-muted-foreground">
          Every Steward AI operation — status, validation, context snapshots, and safety review.
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Trust principles
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Steward never invents brand facts. Context snapshots are saved per job. OAuth tokens and API keys are never
          included in AI context.
        </CardContent>
      </Card>

      {isLoading ? (
        <LoadingSkeleton className="h-48 w-full" />
      ) : jobs.length === 0 ? (
        <StewardEmptyState
          icon={Bot}
          title="No AI jobs yet"
          description="Run Analyze Media or Generate Draft in Create Studio. Job history will appear here with validation status and context snapshot IDs."
          actionLabel="Open Create Studio"
          onAction={() => void navigate({ to: viewToPath("studio") })}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job: AiJobSummary) => (
            <AIJobStatusCard
              key={job.id}
              operation={job.operation}
              status={job.status}
              createdAt={job.created_at}
              validationStatus={job.validation_status ?? undefined}
              onOpen={() => setSelectedJobId(job.id)}
            />
          ))}
        </div>
      )}

      <Sheet open={Boolean(selectedJobId)} onOpenChange={(open) => !open && setSelectedJobId(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>AI job detail</SheetTitle>
            <SheetDescription>Safe summary — no secrets or raw prompts.</SheetDescription>
          </SheetHeader>
          {detailLoading ? (
            <LoadingSkeleton className="mt-4 h-40" />
          ) : detailData ? (
            <div className="mt-4 space-y-4 text-sm">
              <div className="flex items-center gap-2">
                <code className="rounded bg-muted px-2 py-1 text-xs">{detailData.job.id}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    void navigator.clipboard.writeText(detailData.job.id);
                    toast.success("Job ID copied");
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p>
                <span className="text-muted-foreground">Operation:</span> {detailData.job.operation}
              </p>
              <p>
                <span className="text-muted-foreground">Status:</span> {detailData.job.status}
              </p>
              {detailData.error_message && (
                <p className="text-destructive">{detailData.error_message}</p>
              )}
              {detailData.context_snapshot_summary && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Context snapshot</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs">
                    <p>Prompt version: {String(detailData.context_snapshot_summary.prompt_version ?? "—")}</p>
                    <p>
                      Missing context:{" "}
                      {JSON.stringify(detailData.context_snapshot_summary.missing_context ?? [])}
                    </p>
                  </CardContent>
                </Card>
              )}
              {detailData.can_retry && permissions?.canEditPosts && (
                <p className="text-xs text-muted-foreground">Retry is available when backend safe-retry is enabled.</p>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
