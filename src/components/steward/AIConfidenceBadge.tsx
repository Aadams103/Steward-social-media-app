import { cn } from "@/lib/utils";
import { StatusChip } from "./StatusChip";

export function AIConfidenceBadge({ score, className }: { score?: number | null; className?: string }) {
  if (score == null || Number.isNaN(score)) {
    return <StatusChip label="No score" tone="muted" className={className} />;
  }
  const pct = Math.round(score * 100);
  const tone = pct >= 80 ? "success" : pct >= 55 ? "warning" : "danger";
  return (
    <StatusChip
      label={`${pct}% confidence`}
      tone={tone}
      className={cn("tabular-nums", className)}
    />
  );
}
