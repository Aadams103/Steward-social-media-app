import { PlatformBadge } from "./PlatformBadge";
import { AIConfidenceBadge } from "./AIConfidenceBadge";
import { StatusChip, postStatusTone } from "./StatusChip";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Platform } from "@/types/app";
import { mapPostStatus } from "@/lib/steward-status";

export function PlatformPreview({
  platform,
  handle = "@yourbrand",
  caption,
  hashtags = [],
  mediaUrl,
  characterCount,
  warnings = [],
  ready = false,
  className,
}: {
  platform: Platform | string;
  handle?: string;
  caption?: string;
  hashtags?: string[];
  mediaUrl?: string | null;
  characterCount?: number;
  warnings?: string[];
  ready?: boolean;
  className?: string;
}) {
  const label = mapPostStatus(ready ? "approved" : "needs review");
  return (
    <Card className={cn("overflow-hidden border-border/70", className)}>
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2">
          <PlatformBadge platform={platform} />
          <span className="text-xs text-muted-foreground">{handle}</span>
        </div>
        <StatusChip label={label} tone={postStatusTone(label)} />
      </div>
      {mediaUrl ? (
        <div className="aspect-square bg-muted">
          <img src={mediaUrl} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center bg-muted/50 text-xs text-muted-foreground">
          Media preview
        </div>
      )}
      <CardContent className="space-y-2 p-3">
        <p className="whitespace-pre-wrap text-sm">{caption || "Caption preview…"}</p>
        {hashtags.length > 0 && (
          <p className="text-xs text-primary">{hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          <span>Preview only — not exact platform rendering</span>
          {characterCount != null && <span>· {characterCount} chars</span>}
        </div>
        {warnings.length > 0 && (
          <ul className="text-xs text-amber-700 dark:text-amber-300">
            {warnings.map((w) => (
              <li key={w}>⚠ {w}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function StewardContextPanel({
  voice,
  audience,
  pillar,
  hashtags,
  cta,
  missingContext,
  safetyRules,
  loading,
}: {
  voice?: string;
  audience?: string;
  pillar?: string;
  hashtags?: string[];
  cta?: string;
  missingContext?: string[];
  safetyRules?: string[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border/70 bg-background p-4 text-sm text-muted-foreground">
        Loading brand context…
      </div>
    );
  }
  return (
    <aside className="sticky top-4 space-y-4 rounded-xl border border-border/70 bg-background p-4 shadow-sm">
      <div>
        <h3 className="text-sm font-semibold">Steward context</h3>
        <p className="text-xs text-muted-foreground">Approved brand facts for this draft.</p>
      </div>
      <ContextRow label="Voice" value={voice} />
      <ContextRow label="Audience" value={audience} />
      <ContextRow label="Content pillar" value={pillar} />
      <ContextRow label="CTA" value={cta} />
      {hashtags && hashtags.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground">Hashtag bank</p>
          <p className="mt-1 text-xs">{hashtags.slice(0, 8).join(" ")}</p>
        </div>
      )}
      {missingContext && missingContext.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-50/50 p-2 dark:bg-amber-950/20">
          <p className="text-xs font-medium text-amber-900 dark:text-amber-200">Missing context</p>
          <ul className="mt-1 list-inside list-disc text-xs text-amber-800 dark:text-amber-300">
            {missingContext.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}
      {safetyRules && safetyRules.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground">Safety rules</p>
          <ul className="mt-1 space-y-1 text-xs">
            {safetyRules.slice(0, 4).map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

function ContextRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value || "—"}</p>
    </div>
  );
}
