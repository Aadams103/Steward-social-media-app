import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function QuickActionGrid({
  actions,
  className,
}: {
  actions: { label: string; icon: LucideIcon; onClick: () => void; disabled?: boolean }[];
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4", className)}>
      {actions.map(({ label, icon: Icon, onClick, disabled }) => (
        <Button
          key={label}
          variant="outline"
          className="h-auto flex-col gap-2 py-4 text-xs"
          onClick={onClick}
          disabled={disabled}
        >
          <Icon className="h-5 w-5" />
          {label}
        </Button>
      ))}
    </div>
  );
}
