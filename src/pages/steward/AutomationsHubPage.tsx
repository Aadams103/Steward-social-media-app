import { useAutopilotSettings } from "@/hooks/use-api";
import { useAppStore } from "@/store/app-store";
import { StewardEmptyState, StatusChip } from "@/components/steward";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bot } from "lucide-react";

export function AutomationsHubPage() {
  const { currentOrganization } = useAppStore();
  const orgId = currentOrganization?.id ?? "org1";
  const { data: settings } = useAutopilotSettings(orgId);

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Automations</h1>
        <p className="text-sm text-muted-foreground">
          Powerful but safe — draft automatically, recommend schedules, queue for approval. Never publish without rules.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AutomationRuleCard
          title="Draft automatically when media uploads"
          description="Generate post drafts when new assets arrive in the library."
          enabled={false}
          approvalRequired
        />
        <AutomationRuleCard
          title="Recommend schedule"
          description="Suggest best posting windows based on platform strategy."
          enabled={settings?.enabled ?? false}
          approvalRequired
        />
        <AutomationRuleCard
          title="Queue for approval"
          description="All AI-generated content requires human review before scheduling."
          enabled={true}
          approvalRequired
        />
        <AutomationRuleCard
          title="Publish automatically only when allowed"
          description="Blocked unless platform strategy and user preferences allow auto-publish."
          enabled={false}
          blocked
        />
      </div>

      <StewardEmptyState
        icon={Bot}
        title="Automation rules from database"
        description="Full automation_rules CRUD will list active triggers and execution history when wired to Supabase."
        actionLabel="Open Autopilot"
        onAction={() => useAppStore.getState().setActiveView("autopilot")}
      />
    </div>
  );
}

function AutomationRuleCard({
  title,
  description,
  enabled,
  approvalRequired,
  blocked,
}: {
  title: string;
  description: string;
  enabled?: boolean;
  approvalRequired?: boolean;
  blocked?: boolean;
}) {
  return (
    <Card className="border-border/70">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <Switch checked={enabled} disabled aria-label={title} />
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {approvalRequired && <StatusChip label="Approval required" tone="warning" />}
        {blocked && <StatusChip label="Auto-publish blocked" tone="danger" />}
        {enabled ? <StatusChip label="Active" tone="success" /> : <StatusChip label="Disabled" tone="muted" />}
      </CardContent>
    </Card>
  );
}
