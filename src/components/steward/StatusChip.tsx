import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type StatusTone = "default" | "success" | "warning" | "danger" | "info" | "muted";

const toneClasses: Record<StatusTone, string> = {
  default: "border-border bg-background text-foreground",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  danger: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
  info: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200",
  muted: "border-border bg-muted text-muted-foreground",
};

export function StatusChip({
  label,
  tone = "default",
  className,
}: {
  label: string;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("font-medium capitalize", toneClasses[tone], className)}>
      {label}
    </Badge>
  );
}

export function postStatusTone(status: string): StatusTone {
  const s = status.toLowerCase();
  if (["published", "approved", "succeeded"].includes(s)) return "success";
  if (["failed", "rejected", "blocked"].includes(s)) return "danger";
  if (["needs review", "pending", "scheduled", "publishing", "warning"].includes(s)) return "warning";
  if (["draft", "generated", "idea"].includes(s)) return "info";
  return "muted";
}
