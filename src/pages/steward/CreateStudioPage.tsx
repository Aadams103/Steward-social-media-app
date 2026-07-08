import * as React from "react";
import { useAppStore } from "@/store/app-store";
import { useAssets, useCurrentBrand, useUploadAssets } from "@/hooks/use-api";
import { UploadDropzone } from "@/components/uploads/UploadDropzone";
import { StewardAiActions } from "@/components/ai/StewardAiActions";
import {
  PlatformPreview,
  StewardContextPanel,
  SafetyWarningCard,
  AIConfidenceBadge,
  StewardEmptyState,
} from "@/components/steward";
import { brandIntelligenceApi, type AiGatewayResponse } from "@/sdk/services/api-services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Platform } from "@/types/app";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PLATFORMS: Platform[] = ["instagram", "facebook", "tiktok", "linkedin", "youtube"];

export function CreateStudioPage() {
  const { currentOrganization, activeBrandId, setActiveView } = useAppStore();
  const { data: brand } = useCurrentBrand();
  const { data: assetsData, refetch: refetchAssets } = useAssets();
  const upload = useUploadAssets();
  const orgId = currentOrganization?.id;
  const brandId = activeBrandId !== "all" ? activeBrandId : undefined;
  const canUseAi = Boolean(orgId && brandId && UUID_RE.test(orgId) && UUID_RE.test(brandId));

  const [selectedAssetId, setSelectedAssetId] = React.useState<string | undefined>();
  const [userNotes, setUserNotes] = React.useState("");
  const [caption, setCaption] = React.useState("");
  const [platform, setPlatform] = React.useState<Platform>("instagram");
  const [pillar, setPillar] = React.useState("");
  const [audience, setAudience] = React.useState("");
  const [lastAi, setLastAi] = React.useState<AiGatewayResponse | null>(null);
  const [contextLoading, setContextLoading] = React.useState(false);
  const [brandContext, setBrandContext] = React.useState<{
    voice?: string;
    missing?: string[];
    hashtags?: string[];
    safety?: string[];
  }>({});

  const assets = assetsData?.assets ?? [];
  const selectedAsset = assets.find((a) => a.id === selectedAssetId);

  React.useEffect(() => {
    if (!canUseAi || !orgId || !brandId) return;
    setContextLoading(true);
    void brandIntelligenceApi
      .getContext({ organizationId: orgId, brandId, operation: "post_draft_generation", platform })
      .then((res) => {
        setBrandContext({
          voice: String(res.context.brandProfile?.brand_voice_summary ?? ""),
          missing: res.context.missingContext,
          hashtags: res.context.hashtags?.map((h) => String(h.hashtag)).slice(0, 8),
          safety: res.context.brandRules?.map((r) => String(r.rule_name)).slice(0, 4),
        });
      })
      .catch(() => setBrandContext({ missing: ["brand_context_unavailable"] }))
      .finally(() => setContextLoading(false));
  }, [canUseAi, orgId, brandId, platform]);

  const handleAiResult = (result: AiGatewayResponse) => {
    setLastAi(result);
    const draft = result.result as Record<string, unknown>;
    if (typeof draft.caption === "string") setCaption(draft.caption);
  };

  const result = lastAi?.result as Record<string, unknown> | undefined;
  const safetyFlags = (result?.safety_flags as string[]) ?? [];
  const missingContext = (result?.missing_context as string[]) ?? [];
  const assumptions = (result?.assumptions_made as string[]) ?? [];
  const brandFacts = (result?.brand_facts_used as string[]) ?? [];

  return (
    <div className="mx-auto max-w-[1400px] space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Studio</h1>
        <p className="text-sm text-muted-foreground">
          Upload media, generate structured drafts, and review what Steward knows before you schedule.
        </p>
      </div>

      {!canUseAi && (
        <Card className="border-amber-500/30">
          <CardContent className="py-4 text-sm text-muted-foreground">
            Select a Supabase-backed brand to use Steward AI. Demo org IDs cannot call the AI Gateway.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr_320px]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Media & notes</CardTitle>
              <CardDescription>User content is untrusted — Steward uses approved brand context.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <UploadDropzone
                accept="image/*,video/*"
                onFilesSelected={(files) => {
                  void upload.mutateAsync({ files }).then(() => refetchAssets());
                }}
                title="Upload to library"
                helperText="Images and videos for Steward to analyze"
                isUploading={upload.isPending}
              />
              <div className="space-y-2">
                <Label>Library assets</Label>
                <div className="max-h-40 space-y-1 overflow-auto rounded-lg border p-2">
                  {assets.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No assets yet.</p>
                  ) : (
                    assets.slice(0, 12).map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setSelectedAssetId(a.id)}
                        className={`block w-full rounded px-2 py-1 text-left text-xs ${
                          selectedAssetId === a.id ? "bg-primary/10 font-medium" : "hover:bg-muted"
                        }`}
                      >
                        {a.fileName ?? a.id}
                      </button>
                    ))
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="studio-notes">Caption idea / notes</Label>
                <Textarea
                  id="studio-notes"
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="Optional direction for Steward…"
                  rows={4}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Content pillar</Label>
                  <Select value={pillar} onValueChange={setPillar}>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="community">Community</SelectItem>
                      <SelectItem value="offers">Offers / Free Trial</SelectItem>
                      <SelectItem value="education">Technique Education</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          <StewardAiActions
            organizationId={canUseAi ? orgId : undefined}
            assetId={selectedAssetId}
            caption={userNotes || caption}
            onDraftGenerated={handleAiResult}
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Draft editor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={8} />
              {lastAi && (
                <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <AIConfidenceBadge score={result?.confidence_score as number | undefined} />
                    {lastAi.needsHumanReview && <Badge variant="outline">Needs human review</Badge>}
                  </div>
                  {brandFacts.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Brand facts used</p>
                      <ul className="list-inside list-disc text-xs">{brandFacts.map((f) => <li key={f}>{f}</li>)}</ul>
                    </div>
                  )}
                  {assumptions.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Assumptions</p>
                      <ul className="list-inside list-disc text-xs">{assumptions.map((a) => <li key={a}>{a}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}
              <SafetyWarningCard warnings={[...safetyFlags, ...missingContext.map((m) => `Missing: ${m}`)]} />
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" disabled={!caption} onClick={() => setActiveView("approvals")}>
                  Send to review
                </Button>
                <Button variant="outline" onClick={() => setActiveView("calendar")}>
                  Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
          <Tabs defaultValue="preview">
            <TabsList>
              <TabsTrigger value="preview">Platform preview</TabsTrigger>
            </TabsList>
            <PlatformPreview
              platform={platform}
              handle={brand?.name ? `@${brand.name.replace(/\s+/g, "")}` : "@yourbrand"}
              caption={caption}
              mediaUrl={selectedAsset?.url}
              characterCount={caption.length}
              warnings={missingContext}
              ready={!lastAi?.needsHumanReview}
            />
          </Tabs>
        </div>

        <StewardContextPanel
          loading={contextLoading}
          voice={brandContext.voice}
          audience={audience || "From brand profile"}
          pillar={pillar || "—"}
          hashtags={brandContext.hashtags}
          missingContext={brandContext.missing}
          safetyRules={brandContext.safety}
        />
      </div>
    </div>
  );
}
