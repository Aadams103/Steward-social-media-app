import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { agentApi, type AgentRunReport } from "@/sdk/services/api-services";
import { StewardEmptyState, StatusChip } from "@/components/steward";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Bot, Play, ShieldCheck, Sparkles, History } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { viewToPath } from "@/lib/steward-routes";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

/** Automations hub — real AI Social Media Agent controls, no fake toggles. */
export function AutomationsHubPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { organizationId, brandId, isRealWorkspace, permissions } = useCurrentWorkspace();
  const [lastReport, setLastReport] = React.useState<AgentRunReport | null>(null);

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ["agent-status", organizationId, brandId],
    queryFn: () => agentApi.status({ organizationId: organizationId!, brandId: brandId ?? undefined }),
    enabled: isRealWorkspace,
    refetchInterval: 60 * 1000,
  });

  const { data: decisionsData } = useQuery({
    queryKey: ["agent-decisions", organizationId, brandId],
    queryFn: () =>
      agentApi.decisions({ organizationId: organizationId!, brandId: brandId ?? undefined, limit: 10 }),
    enabled: isRealWorkspace,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["agent-status"] });
    void queryClient.invalidateQueries({ queryKey: ["agent-decisions"] });
    void queryClient.invalidateQueries({ queryKey: ["approval-posts"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    void queryClient.invalidateQueries({ queryKey: ["ai-jobs"] });
  };

  const runMutation = useMutation({
    mutationFn: (dryRun: boolean) =>
      agentApi.run({ organizationId: organizationId!, brandId: brandId!, dryRun }),
    onSuccess: (data) => {
      setLastReport(data.report);
      toast.success(
        data.report.dryRun
          ? `Dry run: ${data.report.plannedActions.length} action(s) planned`
          : `Agent cycle complete: ${data.report.results.filter((r) => r.status === "succeeded").length}/${data.report.plannedActions.length} action(s) succeeded`,
      );
      invalidate();
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: () => agentApi.createRule({ organizationId: organizationId!, brandId: brandId! }),
    onSuccess: () => {
      toast.success("Recurring agent rule created — runs hourly when the worker is enabled.");
      invalidate();
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  const toggleRuleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      agentApi.patchRule(id, { organizationId: organizationId!, enabled }),
    onSuccess: () => {
      invalidate();
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  if (!isRealWorkspace) {
    return (
      <div className="mx-auto max-w-[1280px] space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Automations</h1>
          <p className="text-sm text-muted-foreground">
            The Steward agent drafts, recommends, and queues for approval — it never publishes on its own.
          </p>
        </div>
        <StewardEmptyState
          icon={Bot}
          title="Workspace setup required"
          description="The AI agent needs a real organization and brand. Complete onboarding first."
          actionLabel="Complete onboarding"
          onAction={() => void navigate({ to: viewToPath("onboarding") })}
        />
      </div>
    );
  }

  const status = statusData?.status;
  const rules = status?.rules ?? [];
  const decisions = decisionsData?.decisions ?? [];
  const canRun = permissions?.canEditPosts ?? false;
  const canManage = permissions?.canManageWorkspace ?? false;

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Automations</h1>
        <p className="text-sm text-muted-foreground">
          The Steward agent assesses your pipeline, drafts content from approved brand context, and queues
          everything for human approval. It never publishes on its own.
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" />
            Safety contract
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Every agent action flows through the AI Gateway (budget, rate limits, moderation, context snapshots).
          Drafts land in the Approval Queue. Schedule recommendations wait for a human. Analytics come only from
          real ingested data.
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Play className="h-4 w-4" />
              Run agent cycle
            </CardTitle>
            <CardDescription>
              Assess the pipeline and execute bounded actions now. Use dry run to preview the plan without AI calls.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={!canRun || runMutation.isPending}
                onClick={() => runMutation.mutate(false)}
              >
                {runMutation.isPending ? "Running…" : "Run now"}
              </Button>
              <Button
                variant="outline"
                disabled={!canRun || runMutation.isPending}
                onClick={() => runMutation.mutate(true)}
              >
                Dry run (plan only)
              </Button>
            </div>
            {!canRun && (
              <p className="text-xs text-muted-foreground">
                Your role cannot run agent cycles. Ask an editor, admin, or owner.
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className={`inline-block h-2 w-2 rounded-full ${status?.worker_enabled ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
              />
              Background worker: {status?.worker_enabled ? "enabled" : "disabled (server env AGENT_WORKER_ENABLED)"}
            </div>
            {status?.last_run && (
              <p className="text-xs text-muted-foreground">
                Last automatic run{" "}
                {formatDistanceToNow(new Date(status.last_run.created_at), { addSuffix: true })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-4 w-4" />
              Recurring agent rules
            </CardTitle>
            <CardDescription>Scheduled cycles run via the background worker.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusLoading ? (
              <LoadingSkeleton className="h-16 w-full" />
            ) : rules.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">No recurring rules yet.</p>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!canManage || createRuleMutation.isPending}
                  onClick={() => createRuleMutation.mutate()}
                >
                  Create hourly agent rule
                </Button>
                {!canManage && (
                  <p className="text-xs text-muted-foreground">Only owners/admins can create rules.</p>
                )}
              </div>
            ) : (
              rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{rule.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Every {Number(rule.trigger_config?.interval_minutes) || 60} min ·{" "}
                      {rule.last_run_at
                        ? `last ran ${formatDistanceToNow(new Date(rule.last_run_at), { addSuffix: true })}`
                        : "never ran"}
                    </p>
                  </div>
                  <Switch
                    checked={rule.enabled}
                    disabled={!canManage || toggleRuleMutation.isPending}
                    onCheckedChange={(enabled) => toggleRuleMutation.mutate({ id: rule.id, enabled })}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {lastReport && (
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              {lastReport.dryRun ? "Planned actions (dry run)" : "Latest cycle results"}
            </CardTitle>
            <CardDescription>
              Pipeline: {lastReport.snapshot.draftCount} drafts · {lastReport.snapshot.needsReviewCount} in review ·{" "}
              {lastReport.snapshot.scheduledNext7Days}/{lastReport.snapshot.weeklyPostingTarget} scheduled this week
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {lastReport.results.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing to do — the pipeline is healthy for the current weekly target.
              </p>
            ) : (
              lastReport.results.map((r, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
                  <StatusChip
                    label={r.status}
                    tone={
                      r.status === "succeeded"
                        ? "success"
                        : r.status === "failed"
                          ? "danger"
                          : "muted"
                    }
                  />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium capitalize">{r.action.type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.resultSummary ?? r.error ?? r.action.reason}
                    </p>
                  </div>
                </div>
              ))
            )}
            {lastReport.warnings.length > 0 && (
              <p className="text-xs text-amber-600">{lastReport.warnings.join(" · ")}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Agent decision history
          </CardTitle>
          <CardDescription>Every cycle is recorded with its reasoning — full transparency.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {decisions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No agent runs yet. Run a cycle above and the history will appear here.
            </p>
          ) : (
            decisions.map((d) => (
              <div key={d.id} className="rounded-lg border border-border/60 p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {d.decision_type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}
                  </span>
                </div>
                {d.reasoning_summary && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{d.reasoning_summary}</p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
