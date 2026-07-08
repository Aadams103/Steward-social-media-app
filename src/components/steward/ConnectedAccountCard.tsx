import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "./PlatformBadge";
import { StatusChip } from "./StatusChip";
import { mapAccountStatus } from "@/lib/steward-status";
import type { Platform } from "@/types/app";

export function ConnectedAccountCard({
  platform,
  handle,
  status,
  publishingEnabled,
  analyticsEnabled,
  lastSync,
  onConnect,
  onStrategy,
}: {
  platform: Platform | string;
  handle?: string;
  status?: string;
  publishingEnabled?: boolean;
  analyticsEnabled?: boolean;
  lastSync?: string;
  onConnect?: () => void;
  onStrategy?: () => void;
}) {
  const label = mapAccountStatus(status);
  const tone =
    label === "Connected" ? "success" : label === "Setup Required" ? "warning" : "muted";

  return (
    <Card className="border-border/70">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <PlatformBadge platform={platform} />
        <StatusChip label={label} tone={tone} />
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="font-medium">{handle || "Not connected"}</p>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>Publishing: {publishingEnabled ? "Enabled" : "Not enabled"}</p>
          <p>Analytics: {analyticsEnabled ? "Enabled" : "Not enabled"}</p>
          {lastSync && <p>Last sync: {lastSync}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {onConnect && (
            <Button size="sm" variant={label === "Connected" ? "outline" : "default"} onClick={onConnect}>
              {label === "Connected" ? "Reconnect" : "Connect"}
            </Button>
          )}
          {onStrategy && (
            <Button size="sm" variant="ghost" onClick={onStrategy}>
              Platform strategy
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
