import * as React from "react";
import { useSocialAccounts } from "@/hooks/use-api";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { ConnectedAccountCard, StewardEmptyState } from "@/components/steward";
import { SOCIAL_PLATFORMS } from "@/config/social-platforms";
import { oauthApi } from "@/sdk/services/api-services";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { viewToPath } from "@/lib/steward-routes";

import type { Platform } from "@/types/app";

const OAUTH_PLATFORMS = new Set<Platform>(["instagram", "facebook", "linkedin", "tiktok"]);

export function SocialAccountsHubPage() {
  const navigate = useNavigate();
  const { organizationId, isRealWorkspace } = useCurrentWorkspace();
  const { data, isLoading } = useSocialAccounts();
  const accounts = data?.accounts ?? [];
  const orgId = organizationId ?? undefined;

  const connectedPlatforms = new Set(accounts.map((a) => a.platform));

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Social Accounts</h1>
        <p className="text-sm text-muted-foreground">
          Connected platforms for publishing and analytics. Status reflects database records only.
        </p>
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">Connection status</CardTitle>
          <CardDescription>
            {accounts.filter((a) => a.status === "connected").length} connected ·{" "}
            {SOCIAL_PLATFORMS.length - connectedPlatforms.size} not connected
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SOCIAL_PLATFORMS.map((platform) => {
          const account = accounts.find((a) => a.platform === platform);
          return (
            <ConnectedAccountCard
              key={platform}
              platform={platform}
              handle={account?.username ?? account?.displayName}
              status={account?.status ?? (account?.isConnected ? "connected" : "setup_required")}
              publishingEnabled={account?.status === "connected"}
              analyticsEnabled={account?.status === "connected"}
              onConnect={
                OAUTH_PLATFORMS.has(platform) && orgId
                  ? () => {
                      void oauthApi.initiate(platform, orgId).catch(() => undefined);
                    }
                  : undefined
              }
              onStrategy={() => void navigate({ to: viewToPath("brand-intelligence") })}
            />
          );
        })}
      </div>

      {!isLoading && accounts.length === 0 && (
        <StewardEmptyState
          title="No accounts connected yet"
          description="Connect Facebook, Instagram, or other platforms to publish and sync analytics. OAuth must be configured on the server."
          actionLabel="View integrations settings"
          onAction={() => void navigate({ to: viewToPath("settings") })}
        />
      )}
    </div>
  );
}
