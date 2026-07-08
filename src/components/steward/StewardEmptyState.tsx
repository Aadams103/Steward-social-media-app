import * as React from "react";
import { EmptyState } from "@/components/ui/empty-state";
import type { LucideIcon } from "lucide-react";

export function StewardEmptyState(props: React.ComponentProps<typeof EmptyState>) {
  return <EmptyState {...props} />;
}

export type { LucideIcon };
