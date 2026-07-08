import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChip } from "./StatusChip";
import { AIConfidenceBadge } from "./AIConfidenceBadge";
import { mapAiJobStatus } from "@/lib/steward-status";
import { formatDistanceToNow } from "date-fns";

export function AIJobStatusCard({
  operation,
  status,
  createdAt,
  confidence,
  validationStatus,
  onOpen,
}: {
  operation: string;
  status: string;
  createdAt?: string;
  confidence?: number;
  validationStatus?: string;
  onOpen?: () => void;
}) {
  const label = mapAiJobStatus(status);
  const tone =
    label === "Succeeded" ? "success" : label === "Failed" || label === "Blocked" ? "danger" : "info";

  return (
    <Card
      className="cursor-pointer border-border/70 transition-shadow hover:shadow-sm"
      onClick={onOpen}
      role={onOpen ? "button" : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium capitalize">{operation.replace(/_/g, " ")}</CardTitle>
        <StatusChip label={label} tone={tone} />
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {createdAt && <span>{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>}
        {confidence != null && <AIConfidenceBadge score={confidence} />}
        {validationStatus && <StatusChip label={validationStatus} tone="muted" />}
      </CardContent>
    </Card>
  );
}
