import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export function SafetyWarningCard({
  title = "Review required",
  warnings,
  severity = "warning",
  className,
}: {
  title?: string;
  warnings: string[];
  severity?: "warning" | "block";
  className?: string;
}) {
  if (!warnings.length) return null;
  const Icon = severity === "block" ? ShieldAlert : AlertTriangle;
  return (
    <Alert
      variant={severity === "block" ? "destructive" : "default"}
      className={cn("border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20", className)}
    >
      <Icon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
