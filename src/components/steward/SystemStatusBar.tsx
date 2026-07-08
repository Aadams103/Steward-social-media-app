import { AlertCircle, Bot, Link2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function SystemStatusBar({
  brandName,
  connectedCount,
  needsReview,
  aiJobsRunning,
  publishFailures,
  planWarning,
  className,
}: {
  brandName?: string;
  connectedCount: number;
  needsReview: number;
  aiJobsRunning: number;
  publishFailures: number;
  planWarning?: string | null;
  className?: string;
}) {
  const items = [
    brandName ? { icon: ShieldCheck, text: brandName } : null,
    { icon: Link2, text: `${connectedCount} connected` },
    needsReview > 0 ? { icon: AlertCircle, text: `${needsReview} need review`, warn: true } : null,
    aiJobsRunning > 0 ? { icon: Bot, text: `${aiJobsRunning} AI running` } : null,
    publishFailures > 0 ? { icon: AlertCircle, text: `${publishFailures} publish failed`, warn: true } : null,
    planWarning ? { icon: AlertCircle, text: planWarning, warn: true } : null,
  ].filter(Boolean) as { icon: typeof Bot; text: string; warn?: boolean }[];

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-xs text-muted-foreground",
        className,
      )}
    >
      {items.map(({ icon: Icon, text, warn }) => (
        <span key={text} className={cn("inline-flex items-center gap-1.5", warn && "text-amber-700 dark:text-amber-400")}>
          <Icon className="h-3.5 w-3.5 shrink-0" />
          {text}
        </span>
      ))}
    </div>
  );
}
