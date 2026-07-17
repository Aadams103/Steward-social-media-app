import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Check, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ConnectedAccountCard, PlatformBadge, StewardEmptyState } from "@/components/steward";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { viewToPath } from "@/lib/steward-routes";
import { oauthApi } from "@/sdk/services/api-services";

const PLATFORMS = ["facebook", "instagram"] as const;

export function SocialAccountsHubPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { organizationId, brandId, isRealWorkspace } = useCurrentWorkspace();
  const [selectionId, setSelectionId] = React.useState<string | null>(() => {
    const value = new URLSearchParams(window.location.search).get("metaSelection");
    return value && /^[0-9a-f-]{36}$/i.test(value) ? value : null;
  });
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set());
  const popupRef = React.useRef<Window | null>(null);
  const callbackOriginRef = React.useRef<string | null>(null);

  const connectionsQuery = useQuery({
    queryKey: ["oauth-connections", organizationId, brandId],
    queryFn: () => oauthApi.list(organizationId!, brandId ?? undefined),
    enabled: Boolean(isRealWorkspace && organizationId),
  });
  const selectionQuery = useQuery({
    queryKey: ["meta-selection", selectionId],
    queryFn: () => oauthApi.getSelection(selectionId!),
    enabled: Boolean(selectionId),
    retry: false,
  });

  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const payload = event.data as { type?: string; sessionId?: string };
      if (
        event.origin !== callbackOriginRef.current ||
        event.source !== popupRef.current ||
        payload.type !== "steward:meta-selection"
      ) return;
      if (payload.sessionId && /^[0-9a-f-]{36}$/i.test(payload.sessionId)) {
        setSelectionId(payload.sessionId);
        setSelectedKeys(new Set());
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const connect = async (platform: (typeof PLATFORMS)[number]) => {
    if (!organizationId || !brandId) return;
    try {
      const response = await oauthApi.initiate(platform, organizationId, brandId);
      callbackOriginRef.current = response.callbackOrigin;
      popupRef.current = window.open(
        response.authUrl,
        "steward-meta-oauth",
        "popup,width=640,height=760,noopener=false,noreferrer=false",
      );
      if (!popupRef.current) window.location.assign(response.authUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Meta connection could not start.");
    }
  };

  const complete = useMutation({
    mutationFn: () => oauthApi.completeSelection(selectionId!, Array.from(selectedKeys)),
    onSuccess: async () => {
      toast.success("Meta accounts connected");
      setSelectionId(null);
      setSelectedKeys(new Set());
      window.history.replaceState({}, "", window.location.pathname);
      await queryClient.invalidateQueries({ queryKey: ["oauth-connections"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const disconnect = useMutation({
    mutationFn: (id: string) => oauthApi.disconnect(id, organizationId!),
    onSuccess: async () => {
      toast.success("Account disconnected");
      await queryClient.invalidateQueries({ queryKey: ["oauth-connections"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const connections = connectionsQuery.data?.connections ?? [];
  const candidates = selectionQuery.data?.session.candidates ?? [];
  const clearSelection = () => {
    setSelectionId(null);
    setSelectedKeys(new Set());
    window.history.replaceState({}, "", window.location.pathname);
  };
  const toggleCandidate = (key: string) => {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <main className="mx-auto max-w-[1120px] space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Meta launch accounts</p>
          <h1 className="text-3xl font-semibold tracking-tight">Accounts</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Connect Facebook Pages and linked Instagram Professional accounts. Steward stores provider tokens in Vault and never exposes them here.
          </p>
        </div>
        <div className="flex min-h-11 items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 text-sm text-emerald-700 dark:text-emerald-300">
          <ShieldCheck className="h-4 w-4" />Approval required to publish
        </div>
      </div>

      {!isRealWorkspace && (
        <Alert><AlertDescription>Finish onboarding before connecting social accounts.</AlertDescription></Alert>
      )}

      {selectionId && (
        <Card className="border-primary/30 shadow-sm">
          <CardHeader>
            <CardTitle>Choose the accounts Steward may manage</CardTitle>
            <CardDescription>Nothing is selected automatically. Choose each Page or Instagram account explicitly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectionQuery.isLoading ? (
              <div className="flex min-h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : selectionQuery.error ? (
              <Alert variant="destructive"><AlertDescription>{selectionQuery.error.message}</AlertDescription></Alert>
            ) : candidates.length === 0 ? (
              <Alert><AlertDescription>Meta did not return an eligible Facebook Page or linked Instagram Professional account. Check the account permissions in Meta and try again.</AlertDescription></Alert>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {candidates.map((candidate) => {
                  const selected = selectedKeys.has(candidate.key);
                  return (
                    <button
                      key={candidate.key}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleCandidate(candidate.key)}
                      className={`flex min-h-20 items-center gap-3 rounded-xl border p-4 text-left transition-colors ${selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                    >
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{selected && <Check className="h-4 w-4" />}</span>
                      <span className="min-w-0 flex-1"><span className="mb-1 block"><PlatformBadge platform={candidate.platform} /></span><span className="block truncate text-sm font-medium">{candidate.accountName}</span><span className="block truncate text-xs text-muted-foreground">{candidate.username ? `@${candidate.username}` : candidate.pageName}</span></span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={clearSelection}>Cancel</Button>
              <Button onClick={() => complete.mutate()} disabled={selectedKeys.size === 0 || complete.isPending}>
                {complete.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Connect selected
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">Connection health</CardTitle>
          <CardDescription>{connections.length} connected account{connections.length === 1 ? "" : "s"}. Metrics appear only after a real provider sync.</CardDescription>
        </CardHeader>
      </Card>

      {connectionsQuery.isLoading && (
        <div className="flex min-h-32 items-center justify-center rounded-xl border border-border/70" aria-label="Loading connected accounts">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      {connectionsQuery.error && (
        <Alert variant="destructive"><AlertDescription>{connectionsQuery.error.message}</AlertDescription></Alert>
      )}

      {!connectionsQuery.isLoading && !connectionsQuery.error && <div className="grid gap-4 sm:grid-cols-2">
        {PLATFORMS.map((platform) => {
          const account = connections.find((connection) => connection.platform === platform);
          return (
            <ConnectedAccountCard
              key={platform}
              platform={platform}
              handle={account?.username ? `@${account.username}` : account?.accountName}
              status={account?.status ?? "setup_required"}
              publishingEnabled={account?.status === "connected"}
              analyticsEnabled={account?.status === "connected"}
              lastSync={undefined}
              onConnect={isRealWorkspace ? () => void connect(platform) : undefined}
              onDisconnect={account ? () => disconnect.mutate(account.id) : undefined}
              onStrategy={() => void navigate({ to: viewToPath("brand-intelligence") })}
            />
          );
        })}
      </div>}

      {!connectionsQuery.isLoading && connections.length === 0 && !selectionId && (
        <StewardEmptyState
          icon={ExternalLink}
          title="Connect your first Meta account"
          description="Start with a Facebook Page or a linked Instagram Professional account. You will choose the exact accounts after Meta authorization."
          actionLabel="Connect with Meta"
          onAction={isRealWorkspace ? () => void connect("facebook") : undefined}
        />
      )}
    </main>
  );
}
