import * as React from "react";
import { toast } from "sonner";
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
import {
  brandIntelligenceApi,
  aiApi,
  contentBriefsApi,
  postsApi,
  stewardApi,
  type AiGatewayResponse,
} from "@/sdk/services/api-services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Platform } from "@/types/app";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PLATFORMS: Platform[] = ["instagram", "facebook"];

export function CreateStudioPage() {
  const { currentOrganization, activeBrandId, setActiveView } = useAppStore();
  const { data: brand } = useCurrentBrand();
  const orgId = currentOrganization?.id;
  const brandId = activeBrandId && activeBrandId !== "all" ? activeBrandId : undefined;
  const { data: assetsData, refetch: refetchAssets } = useAssets(
    { organizationId: orgId, brandId },
    { enabled: Boolean(orgId && brandId) },
  );
  const upload = useUploadAssets();
  const canUseAi = Boolean(orgId && brandId && UUID_RE.test(orgId) && UUID_RE.test(brandId));

  const [selectedAssetId, setSelectedAssetId] = React.useState<string | undefined>();
  const [userNotes, setUserNotes] = React.useState("");
  const [caption, setCaption] = React.useState("");
  const [platform, setPlatform] = React.useState<Platform>("instagram");
  const [pillar, setPillar] = React.useState("");
  const [audience, setAudience] = React.useState("");
  const [lastAi, setLastAi] = React.useState<AiGatewayResponse | null>(null);
  const [draftPostId, setDraftPostId] = React.useState<string | undefined>();
  const [saveState, setSaveState] = React.useState<"idle" | "saving" | "saved">("idle");
  const [visualGenerating, setVisualGenerating] = React.useState(false);
  const activeBriefId = React.useRef<string | undefined>(undefined);
  const lastSavedSignature = React.useRef("");
  const [contextLoading, setContextLoading] = React.useState(false);
  const [brandContext, setBrandContext] = React.useState<{
    voice?: string;
    missing?: string[];
    hashtags?: string[];
    safety?: string[];
  }>({});

  const assets = assetsData?.assets ?? [];
  const selectedAsset = assets.find((a) => a.id === selectedAssetId);
  const result = lastAi?.result as Record<string, unknown> | undefined;

  React.useEffect(() => {
    if (!canUseAi || !orgId || !brandId) return;
    let cancelled = false;
    setContextLoading(true);
    void brandIntelligenceApi
      .getContext({ organizationId: orgId, brandId, operation: "post_draft_generation", platform })
      .then((res) => {
        if (cancelled) return;
        setBrandContext({
          voice: String(res.context.brandProfile?.brand_voice_summary ?? ""),
          missing: res.context.missingContext,
          hashtags: res.context.hashtags?.map((h) => String(h.hashtag)).slice(0, 8),
          safety: res.context.brandRules?.map((r) => String(r.rule_name)).slice(0, 4),
        });
      })
      .catch(() => {
        if (!cancelled) setBrandContext({ missing: ["brand_context_unavailable"] });
      })
      .finally(() => {
        if (!cancelled) setContextLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [canUseAi, orgId, brandId, platform]);

  const handleAiResult = (result: AiGatewayResponse) => {
    setLastAi(result);
    const draft = result.result as Record<string, unknown>;
    if (typeof draft.caption === "string") {
      setCaption(draft.caption);
      lastSavedSignature.current = JSON.stringify({
        caption: draft.caption,
        platform,
        assets: selectedAssetId ? [selectedAssetId] : [],
      });
    }
    if (result.relatedPostId) setDraftPostId(result.relatedPostId);
    if (activeBriefId.current && orgId) {
      void contentBriefsApi.complete(activeBriefId.current, {
        organizationId: orgId,
        aiJobId: result.aiJobId,
      });
    }
  };

  const prepareDraftInput = React.useCallback(async (): Promise<Record<string, unknown>> => {
    if (!orgId || !brandId) throw new Error("Finish workspace setup before generating content.");
    const response = await contentBriefsApi.create({
      organizationId: orgId,
      brandId,
      goal: userNotes || undefined,
      targetAudience: audience || undefined,
      contentPillar: pillar || undefined,
      contentFormat: "post",
      platforms: [platform as "facebook" | "instagram"],
      assetIds: selectedAssetId ? [selectedAssetId] : [],
      notes: userNotes || undefined,
    });
    activeBriefId.current = response.brief.id as string;
    return {
      contentBriefId: activeBriefId.current,
      assetIds: selectedAssetId ? [selectedAssetId] : [],
      platforms: [platform],
      contentPillar: pillar || undefined,
      targetAudience: audience || undefined,
    };
  }, [audience, brandId, orgId, pillar, platform, selectedAssetId, userNotes]);

  const saveDraft = React.useCallback(async (notify = true): Promise<string> => {
    if (!orgId || !brandId || !caption.trim()) throw new Error("Add a caption before saving.");
    setSaveState("saving");
    try {
      const payload = {
        organizationId: orgId,
        content: caption.trim(),
        platform: platform as "facebook" | "instagram",
        title: typeof result?.internal_title === "string" ? result.internal_title : undefined,
        mediaAssetIds: selectedAssetId ? [selectedAssetId] : [],
        aiJobId: lastAi?.aiJobId,
      };
      let postId = draftPostId;
      if (postId) {
        await postsApi.updateDraft(postId, payload);
      } else {
        const created = await stewardApi.createPostDraft({
          ...payload,
          brandId,
          status: "draft",
          metadata: { aiJobId: lastAi?.aiJobId, source: lastAi ? "ai-gateway" : "create-studio" },
        });
        postId = created.post.id as string;
        setDraftPostId(postId);
      }
      lastSavedSignature.current = JSON.stringify({
        caption: caption.trim(),
        platform,
        assets: selectedAssetId ? [selectedAssetId] : [],
      });
      setSaveState("saved");
      if (notify) toast.success("Draft saved");
      return postId;
    } catch (error) {
      setSaveState("idle");
      throw error;
    }
  }, [brandId, caption, draftPostId, lastAi, orgId, platform, result, selectedAssetId]);

  React.useEffect(() => {
    if (!draftPostId || !caption.trim()) return;
    const signature = JSON.stringify({
      caption: caption.trim(),
      platform,
      assets: selectedAssetId ? [selectedAssetId] : [],
    });
    if (signature === lastSavedSignature.current) return;
    const timer = window.setTimeout(() => {
      void saveDraft(false).catch(() => setSaveState("idle"));
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [caption, draftPostId, platform, saveDraft, selectedAssetId]);

  const sendToReview = async () => {
    if (!orgId) return;
    try {
      const postId = await saveDraft(false);
      await postsApi.sendToReview(postId, { organizationId: orgId });
      toast.success("Sent to Approvals");
      setActiveView("approvals");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The draft could not be sent to review.");
    }
  };

  const generateVisual = async () => {
    if (!orgId || !brandId || !userNotes.trim()) {
      toast.error("Add a creative brief before generating a visual.");
      return;
    }
    setVisualGenerating(true);
    try {
      const response = await aiApi.generateImage({
        organizationId: orgId,
        brandId,
        prompt: userNotes.trim(),
        sourceAssetId: selectedAsset?.type === "image" ? selectedAsset.id : undefined,
        size: "1024x1024",
        quality: "medium",
        outputFormat: "png",
      });
      await refetchAssets();
      setSelectedAssetId(response.asset.id);
      toast.success(selectedAsset?.type === "image" ? "Visual edit ready for review" : "Visual ready for review");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Steward could not create that visual.");
    } finally {
      setVisualGenerating(false);
    }
  };

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
                  if (!orgId || !brandId) return;
                  void upload.mutateAsync({ files, organizationId: orgId, brandId }).then(() => refetchAssets());
                }}
                disabled={!orgId || !brandId}
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
                        {a.metadata?.filename ?? a.id}
                      </button>
                    ))
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="studio-audience">Target audience</Label>
                <Input
                  id="studio-audience"
                  value={audience}
                  onChange={(event) => setAudience(event.target.value)}
                  placeholder="Who should this post reach?"
                />
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
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 w-full"
                  disabled={visualGenerating || !canUseAi || !userNotes.trim()}
                  onClick={() => void generateVisual()}
                >
                  {visualGenerating
                    ? "Creating visual…"
                    : selectedAsset?.type === "image"
                      ? "Create a branded edit"
                      : "Generate a branded visual"}
                </Button>
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
                  <Input
                    value={pillar}
                    onChange={(event) => setPillar(event.target.value)}
                    placeholder="e.g. Education"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <StewardAiActions
            organizationId={canUseAi ? orgId : undefined}
            assetId={selectedAssetId}
            caption={userNotes || caption}
            platform={platform as "facebook" | "instagram"}
            postId={draftPostId}
            prepareDraftInput={prepareDraftInput}
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
                <Button
                  variant="outline"
                  disabled={!caption || saveState === "saving"}
                  onClick={() => void saveDraft().catch((error) => toast.error(error.message))}
                >
                  {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Save draft"}
                </Button>
                <Button variant="secondary" disabled={!caption || saveState === "saving"} onClick={() => void sendToReview()}>
                  Send to review
                </Button>
                <Button variant="ghost" onClick={() => setActiveView("approvals")}>
                  Approve before scheduling
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
