import { useAppStore } from "@/store/app-store";
import { StewardEmptyState, AIJobStatusCard } from "@/components/steward";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Shield } from "lucide-react";

/** AI Activity / Trust Center — transparent job history. */
export function AIActivityPage() {
  const { autopilotNotifications } = useAppStore();

  // Real ai_jobs list API can be wired when available; show honest empty for now.
  const jobs: {
    id: string;
    operation: string;
    status: string;
    createdAt?: string;
  }[] = [];

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

      {jobs.length === 0 ? (
        <StewardEmptyState
          icon={Bot}
          title="No AI jobs yet"
          description="Run Analyze Media or Generate Draft in Create Studio. Job history will appear here with validation status and context snapshot IDs."
          actionLabel="Open Create Studio"
          onAction={() => useAppStore.getState().setActiveView("studio")}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <AIJobStatusCard
              key={job.id}
              operation={job.operation}
              status={job.status}
              createdAt={job.createdAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
