import * as React from "react";
import { BrandIntelligenceSettings } from "@/pages/settings/BrandIntelligenceSettings";
import { BrandCompletenessCard, MetricCard, StewardEmptyState } from "@/components/steward";
import { brandIntelligenceApi } from "@/sdk/services/api-services";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Hash, Megaphone, Shield, Users } from "lucide-react";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function BrandIntelligencePage() {
  const { organizationId, brandId, isRealWorkspace, permissions } = useCurrentWorkspace();
  const canLoad = isRealWorkspace;

  const [ctx, setCtx] = React.useState<Awaited<ReturnType<typeof brandIntelligenceApi.getContext>> | null>(null);

  React.useEffect(() => {
    if (!canLoad || !organizationId || !brandId) return;
    void brandIntelligenceApi
      .getContext({ organizationId, brandId, operation: "brand_intelligence_dashboard" })
      .then(setCtx)
      .catch(() => setCtx(null));
  }, [canLoad, organizationId, brandId]);

  const missing = ctx?.context.missingContext ?? [];
  const completeness = Math.max(0, Math.min(100, Math.round(((10 - missing.length) / 10) * 100)));

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Brand Intelligence</h1>
        <p className="text-sm text-muted-foreground">
          What Steward knows about your business — voice, audiences, rules, and approved memory.
        </p>
      </div>

      {!canLoad && (
        <StewardEmptyState
          icon={Brain}
          title="Connect a Supabase organization"
          description="Brand Intelligence requires real organization and brand UUIDs. Enter them below or complete onboarding."
        />
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Content pillars" value={ctx?.context.contentPillars?.length ?? "—"} />
        <MetricCard title="Audience segments" value={ctx?.context.audienceSegments?.length ?? "—"} />
        <MetricCard title="Brand rules" value={ctx?.context.brandRules?.length ?? "—"} />
        <MetricCard title="Approved memory" value={ctx?.context.approvedMemoryFacts?.length ?? "—"} />
      </div>

      <BrandCompletenessCard score={completeness} missingItems={missing} />

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="voice">Voice & tone</TabsTrigger>
          <TabsTrigger value="audiences">Audiences</TabsTrigger>
          <TabsTrigger value="pillars">Content pillars</TabsTrigger>
          <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
          <TabsTrigger value="ctas">CTAs</TabsTrigger>
          <TabsTrigger value="rules">Brand rules</TabsTrigger>
          <TabsTrigger value="memory">AI memory</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Brand profile</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
              <InfoRow label="Business" value={String(ctx?.context.brandProfile?.business_name ?? "—")} />
              <InfoRow label="Voice" value={String(ctx?.context.brandProfile?.brand_voice_summary ?? "—")} />
              <InfoRow label="City" value={String(ctx?.context.brandProfile?.city ?? "—")} />
              <InfoRow label="Website" value={String(ctx?.context.brandProfile?.website_url ?? "—")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audiences" className="mt-4 grid gap-3 md:grid-cols-2">
          {(ctx?.context.audienceSegments ?? []).map((seg, i) => (
            <Card key={String(seg.id ?? i)}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  {String(seg.name)}
                </CardTitle>
                <CardDescription>{String(seg.description ?? "")}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pillars" className="mt-4 flex flex-wrap gap-2">
          {(ctx?.context.contentPillars ?? []).map((p, i) => (
            <Badge key={String(p.id ?? i)} variant="secondary" className="px-3 py-1">
              {String(p.name)}
            </Badge>
          ))}
        </TabsContent>

        <TabsContent value="hashtags" className="mt-4">
          <div className="flex flex-wrap gap-2">
            {(ctx?.context.hashtags ?? []).map((h, i) => (
              <Badge key={String(h.id ?? i)} variant="outline">
                <Hash className="mr-1 h-3 w-3" />
                {String(h.hashtag)}
              </Badge>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ctas" className="mt-4 space-y-2">
          {(ctx?.context.ctas ?? []).map((c, i) => (
            <div key={String(c.id ?? i)} className="flex items-center gap-2 rounded-lg border p-3 text-sm">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              {String(c.cta_text)}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="rules" className="mt-4 space-y-2">
          {(ctx?.context.brandRules ?? []).map((r, i) => (
            <div key={String(r.id ?? i)} className="flex items-start gap-2 rounded-lg border p-3 text-sm">
              <Shield className="mt-0.5 h-4 w-4" />
              <div>
                <p className="font-medium">{String(r.rule_name)}</p>
                <p className="text-xs text-muted-foreground">{String(r.rule_description)}</p>
              </div>
              <Badge variant="outline" className="ml-auto">
                {String(r.severity)}
              </Badge>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="memory" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Approved memory facts</CardTitle>
              <CardDescription>Only approved facts are trusted in AI context.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(ctx?.context.approvedMemoryFacts ?? []).length === 0 ? (
                <p className="text-muted-foreground">No approved memory yet. Proposed facts require admin approval.</p>
              ) : (
                ctx!.context.approvedMemoryFacts.map((f, i) => (
                  <p key={String(f.id ?? i)}>
                    <span className="font-medium">{String(f.fact_key)}:</span> {JSON.stringify(f.fact_value)}
                  </p>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="mt-4">
          <BrandIntelligenceSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
