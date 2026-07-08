import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { cn } from "@/lib/utils";
import type { Platform } from "@/types/app";

export function PlatformBadge({
  platform,
  label,
  className,
}: {
  platform: Platform | string;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-2 py-0.5 text-xs font-medium capitalize",
        className,
      )}
    >
      <PlatformIcon platform={platform as Platform} className="h-3.5 w-3.5" />
      {label ?? platform}
    </span>
  );
}
