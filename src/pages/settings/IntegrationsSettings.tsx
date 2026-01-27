import * as React from "react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Plug, 
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { OAUTH_PLATFORMS, type OAuthPlatform } from "@/types/app";

export function IntegrationsSettings() {
  const { oauthConnections } = useAppStore();

  const handleConnect = async (platform: OAuthPlatform) => {
    try {
      // TODO: Implement OAuth connection flow
      toast.info(`Connecting to ${platform}...`);
    } catch (error) {
      toast.error(`Failed to connect to ${platform}`);
      console.error(error);
    }
  };

  const handleDisconnect = async (connectionId: string, platform: OAuthPlatform) => {
    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) {
      return;
    }

    try {
      // TODO: Implement disconnect API call
      toast.success(`Disconnected from ${platform}`);
    } catch (error) {
      toast.error(`Failed to disconnect from ${platform}`);
      console.error(error);
    }
  };

  const getConnectionStatus = (platform: OAuthPlatform) => {
    const connection = oauthConnections.find((c) => c.platform === platform);
    if (!connection) return null;
    return connection;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            Social Media Integrations
          </CardTitle>
          <CardDescription>
            Connect your social media accounts to enable posting, scheduling, and analytics.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {OAUTH_PLATFORMS.map((platform) => {
            const connection = getConnectionStatus(platform.id);
            const isConnected = connection !== null && connection.status === "active";

            return (
              <div
                key={platform.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${platform.color}`}
                  >
                    <span className="text-white font-semibold text-sm">
                      {platform.label.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{platform.label}</p>
                      {isConnected ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Not Connected
                        </Badge>
                      )}
                    </div>
                    {isConnected && connection && (
                      <p className="text-sm text-muted-foreground">
                        Connected as: {connection.username}
                      </p>
                    )}
                  </div>
                </div>
                {isConnected ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => connection && handleDisconnect(connection.id, platform.id)}
                    >
                      Disconnect
                    </Button>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => handleConnect(platform.id)}>
                    Connect
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Other Integrations</CardTitle>
          <CardDescription>
            Additional integrations and API connections.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            More integrations coming soon. Check back later for additional connection options.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
