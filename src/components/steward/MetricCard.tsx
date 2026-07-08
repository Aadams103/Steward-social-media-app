import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  title,
  value,
  hint,
  icon: Icon,
  trend,
  className,
  onClick,
}: {
  title: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  trend?: string;
  className?: string;
  onClick?: () => void;
}) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Card
      className={cn(
        "overflow-hidden border-border/70 bg-gradient-to-br from-background to-muted/20 shadow-sm",
        onClick && "cursor-pointer transition-shadow hover:shadow-md",
        className,
      )}
      {...(onClick ? { onClick, type: "button" as const } : {})}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
        {(hint || trend) && (
          <p className="mt-1 text-xs text-muted-foreground">
            {trend && <span className="text-foreground/80">{trend} · </span>}
            {hint}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
