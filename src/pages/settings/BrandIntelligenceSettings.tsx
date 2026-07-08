import * as React from "react";
import { useAppStore } from "@/store/app-store";
import { brandIntelligenceApi } from "@/sdk/services/api-services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Brain, Hash, Megaphone, RefreshCw, Shield } from "lucide-react";
import { toast } from "sonner";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/**
 * Brand Intelligence admin preview — shows what Steward knows before AI generates content.
 */
export function BrandIntelligenceSettings() {
  const { organization, activeBrandId, brands } = useAppStore();
  const defaultBrandId =
    activeBrandId && activeBrandId !== "all" ? activeBrandId : brands[0]?.id ?? "";

  const [organizationId, setOrganizationId] = React.useState(organization?.id ?? "");
  const [brandId, setBrandId] = React.useState(defaultBrandId);
  const [loading, setLoading] = React.useState(false);
  const [preview, setPreview] = React.useState<Awaited<
    ReturnType<typeof brandIntelligenceApi.getContext>
  > | null>(null);

  const canLoad = isUuid(organizationId) && isUuid(brandId);

  const loadContext = React.useCallback(async () => {
    if (!canLoad) {
      toast.error("Enter valid organization and brand UUIDs (Supabase-backed orgs only).");
      return;
    }
    setLoading(true);
    try {
      const data = await brandIntelligenceApi.getContext({
        organizationId,
        brandId,
        operation: "brand_context_preview",
      });
      setPreview(data);
    } catch (err) {
      toast.error("Could not load brand intelligence context.");
      console.error(err);
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }, [canLoad, organizationId, brandId]);

  const ctx = preview?.context;
  const missing = ctx?.missingContext ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Brand Intelligence
          </CardTitle>
          <CardDescription>
            Steward builds a trusted context package before every AI operation. Preview what the AI
            knows — missing data is flagged instead of invented.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bi-org-id">Organization ID</Label>
              <Input
                id="bi-org-id"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                placeholder="UUID from Supabase organizations"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bi-brand-id">Brand ID</Label>
              <Input
                id="bi-brand-id"
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                placeholder="UUID from Supabase brands"
              />
            </div>
          </div>
          {!canLoad && (
            <p className="text-sm text-muted-foreground">
              Local demo org IDs (e.g. org1) are not Supabase-backed. Connect a real organization to
              preview brand intelligence.
            </p>
          )}
          <Button type="button" onClick={() => void loadContext()} disabled={loading || !canLoad}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Load brand context
          </Button>
        </CardContent>
      </Card>

      {ctx && (
        <>
          {missing.length > 0 && (
            <Card className="border-amber-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Missing context ({missing.length})
                </CardTitle>
                <CardDescription>
                  Steward will flag these gaps in AI output instead of guessing.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {missing.map((item) => (
                  <Badge key={item} variant="outline">
                    {item}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Brand profile</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Business:</span>{" "}
                  {String(ctx.brandProfile?.business_name ?? "—")}
                </p>
                <p>
                  <span className="text-muted-foreground">Voice:</span>{" "}
                  {String(ctx.brandProfile?.brand_voice_summary ?? "—")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4" />
                  Brand rules ({ctx.brandRules.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {ctx.brandRules.slice(0, 5).map((rule, i) => (
                  <div key={String(rule.id ?? i)} className="text-sm">
                    <Badge variant="secondary" className="mr-2">
                      {String(rule.severity ?? "info")}
                    </Badge>
                    {String(rule.rule_name ?? rule.rule_description)}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Hash className="h-4 w-4" />
                  Hashtag bank ({ctx.hashtags.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1">
                {ctx.hashtags.slice(0, 12).map((h, i) => (
                  <Badge key={String(h.id ?? i)} variant="outline">
                    #{String(h.hashtag)}
                  </Badge>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Megaphone className="h-4 w-4" />
                  CTA bank ({ctx.ctas.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {ctx.ctas.slice(0, 6).map((c, i) => (
                  <p key={String(c.id ?? i)}>{String(c.cta_text)}</p>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Content pillars & audiences</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {ctx.contentPillars.map((p, i) => (
                <Badge key={String(p.id ?? i)}>{String(p.name)}</Badge>
              ))}
              {ctx.audienceSegments.map((a, i) => (
                <Badge key={String(a.id ?? i)} variant="secondary">
                  {String(a.name)}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Approved memory facts ({ctx.approvedMemoryFacts.length})
              </CardTitle>
              <CardDescription>Only approved facts are trusted in AI context.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              {ctx.approvedMemoryFacts.length === 0 ? (
                <p className="text-muted-foreground">No approved memory facts yet.</p>
              ) : (
                ctx.approvedMemoryFacts.slice(0, 8).map((f, i) => (
                  <p key={String(f.id ?? i)}>
                    {String(f.fact_key)}: {JSON.stringify(f.fact_value)}
                  </p>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
