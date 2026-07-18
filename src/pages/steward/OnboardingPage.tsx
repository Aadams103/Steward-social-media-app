import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, ChevronLeft, ChevronRight, Loader2, ShieldCheck, Upload } from "lucide-react";
import { toast } from "sonner";
import { PENDING_ORGANIZATION_NAME_KEY } from "@/auth/signup";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { persistWorkspaceSelection } from "@/hooks/use-current-workspace";
import { assetsApi, brandContextV1Api, workspaceApi } from "@/sdk/services/api-services";
import type { BrandContextV1 } from "@/types/steward";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

const STEPS = ["Workspace", "Identity", "Audience & voice", "Content plan", "Safety & visuals"] as const;
const FACEBOOK = "facebook" as const;
const INSTAGRAM = "instagram" as const;

function splitList(value: string): string[] {
  return value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean).slice(0, 30);
}

function splitLines(value: string): string[] {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).slice(0, 20);
}

function platformButtonClass(selected: boolean): string {
  return selected
    ? "min-h-11 rounded-lg border border-primary bg-primary/10 px-4 text-sm font-medium text-primary"
    : "min-h-11 rounded-lg border border-border bg-background px-4 text-sm font-medium text-muted-foreground hover:border-primary/50";
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const workspace = useCurrentWorkspace();
  const [step, setStep] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [loadingExisting, setLoadingExisting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const pendingOrganizationName = React.useMemo(
    () =>
      typeof window === "undefined"
        ? ""
        : localStorage.getItem(PENDING_ORGANIZATION_NAME_KEY) ?? "",
    [],
  );
  const [organizationName, setOrganizationName] = React.useState(pendingOrganizationName);
  const [brandName, setBrandName] = React.useState(pendingOrganizationName);
  const [timezone, setTimezone] = React.useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago",
  );
  const [industry, setIndustry] = React.useState("");
  const [websiteUrl, setWebsiteUrl] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [mission, setMission] = React.useState("");
  const [values, setValues] = React.useState("");
  const [audienceName, setAudienceName] = React.useState("");
  const [audienceDescription, setAudienceDescription] = React.useState("");
  const [painPoints, setPainPoints] = React.useState("");
  const [audienceInterests, setAudienceInterests] = React.useState("");
  const [voice, setVoice] = React.useState("");
  const [traits, setTraits] = React.useState("");
  const [wordsToUse, setWordsToUse] = React.useState("");
  const [wordsToAvoid, setWordsToAvoid] = React.useState("");
  const [pillars, setPillars] = React.useState("");
  const [offers, setOffers] = React.useState("");
  const [ctas, setCtas] = React.useState("");
  const [platforms, setPlatforms] = React.useState<Array<typeof FACEBOOK | typeof INSTAGRAM>>([
    FACEBOOK,
    INSTAGRAM,
  ]);
  const [postsPerWeek, setPostsPerWeek] = React.useState(3);
  const [prohibitedClaims, setProhibitedClaims] = React.useState("");
  const [complianceNotes, setComplianceNotes] = React.useState("");
  const [postingGoals, setPostingGoals] = React.useState("");
  const [exampleContent, setExampleContent] = React.useState("");
  const [primaryColor, setPrimaryColor] = React.useState("#132449");
  const [accentColor, setAccentColor] = React.useState("#B9C1CD");
  const [fonts, setFonts] = React.useState("Geist, Inter");
  const [styleNotes, setStyleNotes] = React.useState("");
  const [logoAssetId, setLogoAssetId] = React.useState<string>();
  const [documentAssetIds, setDocumentAssetIds] = React.useState<string[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const hydratedWorkspaceRef = React.useRef<string | null>(null);
  const hydratedBrandRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const workspaceKey = `${workspace.organizationId ?? "new"}:${workspace.brandId ?? "new"}`;
    if (hydratedWorkspaceRef.current === workspaceKey) return;
    if (!workspace.organization?.name && !workspace.brand?.name) return;
    hydratedWorkspaceRef.current = workspaceKey;
    if (workspace.organization?.name) setOrganizationName(workspace.organization.name);
    if (workspace.brand?.name) setBrandName(workspace.brand.name);
    if (workspace.organization?.timezone) setTimezone(workspace.organization.timezone);
  }, [workspace.brand?.name, workspace.brandId, workspace.organization?.name, workspace.organization?.timezone, workspace.organizationId]);

  React.useEffect(() => {
    if (!workspace.isRealWorkspace || !workspace.organizationId || !workspace.brandId) return;
    if (hydratedBrandRef.current === workspace.brandId) return;
    hydratedBrandRef.current = workspace.brandId;
    let cancelled = false;
    setLoadingExisting(true);
    void brandContextV1Api
      .get(workspace.organizationId, workspace.brandId)
      .then(({ context }) => {
        if (cancelled) return;
        const primaryAudience = context.audience.find((item) => item.isPrimary) ?? context.audience[0];
        const enabledStrategies = context.platformStrategies.filter((item) => item.enabled);
        setBrandName(context.identity.publicBrandName || context.identity.businessName || workspace.brand?.name || "");
        setIndustry(context.identity.industry ?? "");
        setWebsiteUrl(context.identity.websiteUrl ?? "");
        setDescription(context.identity.shortDescription ?? "");
        setMission(context.identity.missionStatement ?? "");
        setValues(context.identity.values.join(", "));
        setAudienceName(primaryAudience?.name ?? "");
        setAudienceDescription(primaryAudience?.description ?? "");
        setPainPoints(primaryAudience?.painPoints.join(", ") ?? "");
        setAudienceInterests(primaryAudience?.interests.join(", ") ?? "");
        setVoice(context.voice.summary);
        setTraits(context.voice.personalityTraits.join(", "));
        setWordsToUse(context.voice.wordsToUse.join(", "));
        setWordsToAvoid(context.voice.wordsToAvoid.join(", "));
        setPillars(context.pillars.map((item) => item.name).join(", "));
        setOffers(context.offers.map((item) => item.name).join(", "));
        setCtas(context.ctas.map((item) => item.text).join(", "));
        setPlatforms(
          enabledStrategies.length
            ? enabledStrategies.map((item) => item.platform)
            : [FACEBOOK, INSTAGRAM],
        );
        setPostsPerWeek(enabledStrategies[0]?.postingFrequencyGoal ?? 3);
        setProhibitedClaims(context.rules.prohibitedClaims.join(", "));
        setComplianceNotes(context.rules.complianceNotes);
        setPostingGoals(context.postingGoals.join(", "));
        setExampleContent(context.examples.map((item) => item.content).join("\n"));
        setPrimaryColor(context.visualKit.primaryColor ?? "#132449");
        setAccentColor(context.visualKit.secondaryColor ?? context.visualKit.accentColor ?? "#B9C1CD");
        setFonts(context.visualKit.fonts.join(", "));
        setStyleNotes(context.visualKit.styleNotes ?? "");
        setLogoAssetId(context.visualKit.logoAssetId);
        setDocumentAssetIds(context.visualKit.brandDocumentAssetIds);
      })
      .catch(() => {
        hydratedBrandRef.current = null;
      })
      .finally(() => {
        if (!cancelled) setLoadingExisting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workspace.brand?.name, workspace.brandId, workspace.isRealWorkspace, workspace.organizationId]);

  const togglePlatform = (platform: typeof FACEBOOK | typeof INSTAGRAM) => {
    setPlatforms((current) =>
      current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform],
    );
  };

  const bootstrapWorkspace = async () => {
    if (workspace.organizationId && workspace.brandId) return;
    if (organizationName.trim().length < 2 || brandName.trim().length < 2) {
      throw new Error("Enter your organization and brand names.");
    }
    const result = await workspaceApi.bootstrap({ organizationName, brandName, timezone });
    if (!result.workspace.organizationId || !result.workspace.brandId) throw new Error("Workspace setup did not finish.");
    persistWorkspaceSelection(result.workspace.organizationId, result.workspace.brandId);
    await workspace.selectOrganization(result.workspace.organizationId, result.workspace.brandId);
  };

  const buildContext = (): BrandContextV1 => ({
    version: "1.0",
    identity: {
      businessName: brandName.trim(),
      publicBrandName: brandName.trim(),
      industry: industry.trim() || undefined,
      websiteUrl: websiteUrl.trim() || undefined,
      shortDescription: description.trim() || undefined,
      missionStatement: mission.trim() || undefined,
      values: splitList(values),
    },
    audience: audienceName.trim()
      ? [{
          name: audienceName.trim(),
          description: audienceDescription.trim() || undefined,
          painPoints: splitList(painPoints),
          interests: splitList(audienceInterests),
          preferredPlatforms: platforms,
          isPrimary: true,
        }]
      : [],
    voice: {
      summary: voice.trim(),
      personalityTraits: splitList(traits),
      wordsToUse: splitList(wordsToUse),
      wordsToAvoid: splitList(wordsToAvoid),
    },
    pillars: splitList(pillars).map((name) => ({ name })),
    offers: splitList(offers).map((name) => ({ name })),
    ctas: splitList(ctas).map((text, index) => ({ label: `CTA ${index + 1}`, text })),
    rules: {
      prohibitedClaims: splitList(prohibitedClaims),
      complianceNotes: complianceNotes.trim(),
      safetyNotes: "All generated content requires human approval before publishing.",
    },
    platformStrategies: platforms.map((platform) => ({
      platform,
      enabled: true,
      postingFrequencyGoal: postsPerWeek,
      contentTypes: platform === INSTAGRAM ? ["single_image", "carousel", "reel"] : ["text", "link", "photo", "video"],
    })),
    visualKit: {
      primaryColor,
      secondaryColor: accentColor,
      fonts: splitList(fonts),
      styleNotes: styleNotes.trim() || undefined,
      logoAssetId,
      brandDocumentAssetIds: documentAssetIds,
    },
    examples: splitLines(exampleContent).map((content) => ({
      platform: platforms[0] ?? INSTAGRAM,
      content,
    })),
    postingGoals: splitList(postingGoals),
  });

  const next = async () => {
    setError(null);
    setSaving(true);
    try {
      if (step === 0) await bootstrapWorkspace();
      if (step < STEPS.length - 1) setStep((current) => current + 1);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Setup could not continue.");
    } finally {
      setSaving(false);
    }
  };

  const uploadBrandFile = async (file: File, kind: "logo" | "document") => {
    if (!workspace.organizationId || !workspace.brandId) {
      setError("Create the workspace before uploading brand files.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const result = await assetsApi.upload(
        [file],
        { organizationId: workspace.organizationId, brandId: workspace.brandId },
        [kind === "logo" ? "brand-logo" : "brand-document"],
        kind === "logo" ? "brand-assets" : "imports",
      );
      const id = result.assets[0]?.id;
      if (!id) throw new Error("The uploaded file was not saved.");
      if (kind === "logo") setLogoAssetId(id);
      else setDocumentAssetIds((current) => [...current, id]);
      toast.success(
        kind === "logo"
          ? "Logo uploaded — proposed visual facts will appear for review"
          : "Brand document uploaded — proposed facts will appear for review",
      );
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const finish = async () => {
    setSaving(true);
    setError(null);
    try {
      await bootstrapWorkspace();
      const organizationId = workspace.organizationId ?? localStorage.getItem("steward_organization_id");
      const brandId = workspace.brandId ?? localStorage.getItem("steward_active_brand_id");
      if (!organizationId || !brandId) throw new Error("Workspace details are missing.");
      await brandContextV1Api.put(organizationId, brandId, buildContext());
      await workspace.refetch();
      localStorage.removeItem(PENDING_ORGANIZATION_NAME_KEY);
      toast.success("Your brand is ready for Steward");
      void navigate({ to: "/app" });
    } catch (finishError) {
      setError(finishError instanceof Error ? finishError.message : "Brand setup could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto grid max-w-5xl gap-6 py-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:py-10">
      <aside className="rounded-2xl border border-border/70 bg-card/70 p-5 lg:sticky lg:top-6 lg:h-fit">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold">Set up Steward</p>
            <p className="text-xs text-muted-foreground">Approval-first by default</p>
          </div>
        </div>
        <nav aria-label="Onboarding progress" className="space-y-2">
          {STEPS.map((label, index) => (
            <button
              key={label}
              type="button"
              className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm ${
                index === step ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground"
              }`}
              onClick={() => index < step && setStep(index)}
              disabled={index > step}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${index < step ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                {index < step ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="space-y-5">
        <div>
          <p className="text-sm font-medium text-primary">Step {step + 1} of {STEPS.length}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Build your brand operating system</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Steward uses these approved facts to plan and draft content. You can change everything later.
          </p>
          {loadingExisting ? (
            <p className="mt-2 text-xs text-muted-foreground">Loading your saved brand context…</p>
          ) : null}
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />

        {error && (
          <Alert variant="destructive" role="alert"><AlertDescription>{error}</AlertDescription></Alert>
        )}

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>{STEPS[step]}</CardTitle>
            <CardDescription>
              {step === 0 && "Create the secure workspace that owns your brands, media, accounts, and approvals."}
              {step === 1 && "Give Steward the business facts it may safely use in content."}
              {step === 2 && "Define who you serve and how your brand should sound."}
              {step === 3 && "Choose what Steward should create and where it should publish after approval."}
              {step === 4 && "Set hard safety rules and upload the visual references Steward should follow."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            {step === 0 && <>
              <div className="space-y-2"><Label htmlFor="organization-name">Organization name</Label><Input id="organization-name" value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} placeholder="Acme Studio" disabled={workspace.isRealWorkspace} /></div>
              <div className="space-y-2"><Label htmlFor="brand-name">Brand name</Label><Input id="brand-name" value={brandName} onChange={(event) => setBrandName(event.target.value)} placeholder="Acme" /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="timezone">Scheduling timezone</Label><Input id="timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} placeholder="America/Chicago" /></div>
            </>}
            {step === 1 && <>
              <div className="space-y-2"><Label htmlFor="industry">Industry</Label><Input id="industry" value={industry} onChange={(event) => setIndustry(event.target.value)} placeholder="Fitness, consulting, retail…" /></div>
              <div className="space-y-2"><Label htmlFor="website">Website</Label><Input id="website" type="url" value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} placeholder="https://example.com" /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="description">What does the business do?</Label><Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="mission">Mission</Label><Textarea id="mission" value={mission} onChange={(event) => setMission(event.target.value)} rows={3} /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="values">Brand values</Label><Input id="values" value={values} onChange={(event) => setValues(event.target.value)} placeholder="Trust, clarity, craftsmanship" /><p className="text-xs text-muted-foreground">Separate items with commas.</p></div>
            </>}
            {step === 2 && <>
              <div className="space-y-2"><Label htmlFor="audience-name">Primary audience</Label><Input id="audience-name" value={audienceName} onChange={(event) => setAudienceName(event.target.value)} placeholder="Local business owners" /></div>
              <div className="space-y-2"><Label htmlFor="traits">Personality traits</Label><Input id="traits" value={traits} onChange={(event) => setTraits(event.target.value)} placeholder="Warm, precise, confident" /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="audience-description">Audience description</Label><Textarea id="audience-description" value={audienceDescription} onChange={(event) => setAudienceDescription(event.target.value)} rows={3} /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="pain-points">Audience pain points</Label><Input id="pain-points" value={painPoints} onChange={(event) => setPainPoints(event.target.value)} placeholder="Not enough time, inconsistent content" /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="audience-interests">Audience interests</Label><Input id="audience-interests" value={audienceInterests} onChange={(event) => setAudienceInterests(event.target.value)} placeholder="Local business growth, practical marketing, community" /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="voice">Brand voice</Label><Textarea id="voice" value={voice} onChange={(event) => setVoice(event.target.value)} placeholder="Clear, encouraging, never salesy…" rows={3} /></div>
              <div className="space-y-2"><Label htmlFor="words-use">Words to use</Label><Input id="words-use" value={wordsToUse} onChange={(event) => setWordsToUse(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="words-avoid">Words to avoid</Label><Input id="words-avoid" value={wordsToAvoid} onChange={(event) => setWordsToAvoid(event.target.value)} /></div>
            </>}
            {step === 3 && <>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="pillars">Content pillars</Label><Input id="pillars" value={pillars} onChange={(event) => setPillars(event.target.value)} placeholder="Education, behind the scenes, customer stories" /></div>
              <div className="space-y-2"><Label htmlFor="offers">Offers</Label><Input id="offers" value={offers} onChange={(event) => setOffers(event.target.value)} placeholder="Free consultation, starter package" /></div>
              <div className="space-y-2"><Label htmlFor="ctas">Preferred calls to action</Label><Input id="ctas" value={ctas} onChange={(event) => setCtas(event.target.value)} placeholder="Book a call, send us a DM" /></div>
              <fieldset className="space-y-2 sm:col-span-2"><legend className="text-sm font-medium">Launch platforms</legend><div className="flex flex-wrap gap-2"><button type="button" aria-pressed={platforms.includes(FACEBOOK)} className={platformButtonClass(platforms.includes(FACEBOOK))} onClick={() => togglePlatform(FACEBOOK)}>Facebook Pages</button><button type="button" aria-pressed={platforms.includes(INSTAGRAM)} className={platformButtonClass(platforms.includes(INSTAGRAM))} onClick={() => togglePlatform(INSTAGRAM)}>Instagram Professional</button></div></fieldset>
              <div className="space-y-2"><Label htmlFor="frequency">Posts per week, per platform</Label><Input id="frequency" type="number" min={0} max={50} value={postsPerWeek} onChange={(event) => setPostsPerWeek(Number(event.target.value))} /></div>
              <div className="space-y-2"><Label htmlFor="goals">Posting goals</Label><Input id="goals" value={postingGoals} onChange={(event) => setPostingGoals(event.target.value)} placeholder="Build trust, drive qualified inquiries" /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="examples">Example content you like</Label><Textarea id="examples" value={exampleContent} onChange={(event) => setExampleContent(event.target.value)} placeholder="Add one approved example per line." rows={4} /><p className="text-xs text-muted-foreground">These examples guide tone and structure without being copied.</p></div>
            </>}
            {step === 4 && <>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="prohibited">Prohibited claims</Label><Textarea id="prohibited" value={prohibitedClaims} onChange={(event) => setProhibitedClaims(event.target.value)} placeholder="Guaranteed results, unverified statistics…" rows={3} /><p className="text-xs text-muted-foreground">Each comma or new line becomes a blocking content rule.</p></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="compliance">Compliance notes</Label><Textarea id="compliance" value={complianceNotes} onChange={(event) => setComplianceNotes(event.target.value)} rows={3} /></div>
              <div className="space-y-2"><Label htmlFor="primary-color">Primary color</Label><div className="flex gap-2"><Input id="primary-color" type="color" className="h-11 w-16 p-1" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} /><Input value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} aria-label="Primary color hex" /></div></div>
              <div className="space-y-2"><Label htmlFor="accent-color">Secondary color</Label><div className="flex gap-2"><Input id="accent-color" type="color" className="h-11 w-16 p-1" value={accentColor} onChange={(event) => setAccentColor(event.target.value)} /><Input value={accentColor} onChange={(event) => setAccentColor(event.target.value)} aria-label="Secondary color hex" /></div></div>
              <div className="space-y-2"><Label htmlFor="fonts">Fonts</Label><Input id="fonts" value={fonts} onChange={(event) => setFonts(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="style-notes">Visual style</Label><Input id="style-notes" value={styleNotes} onChange={(event) => setStyleNotes(event.target.value)} placeholder="Premium, editorial, high contrast" /></div>
              <div className="rounded-xl border border-dashed border-border p-4"><p className="text-sm font-medium">Brand logo</p><p className="mb-3 text-xs text-muted-foreground">PNG, JPG, or WebP up to 5 MB.</p><Label htmlFor="logo-upload" className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-4 text-sm font-medium"><Upload className="h-4 w-4" />{logoAssetId ? "Replace logo" : "Upload logo"}</Label><Input id="logo-upload" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={uploading} onChange={(event) => event.target.files?.[0] && void uploadBrandFile(event.target.files[0], "logo")} />{logoAssetId && <p className="mt-2 text-xs text-emerald-600">Logo saved securely.</p>}</div>
              <div className="rounded-xl border border-dashed border-border p-4"><p className="text-sm font-medium">Brand document</p><p className="mb-3 text-xs text-muted-foreground">Upload a PDF, image, or text reference. Facts remain untrusted until approved.</p><Label htmlFor="document-upload" className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-4 text-sm font-medium"><Upload className="h-4 w-4" />Upload document</Label><Input id="document-upload" type="file" accept="application/pdf,text/plain,image/png,image/jpeg,image/webp" className="sr-only" disabled={uploading} onChange={(event) => event.target.files?.[0] && void uploadBrandFile(event.target.files[0], "document")} />{documentAssetIds.length > 0 && <p className="mt-2 text-xs text-emerald-600">{documentAssetIds.length} document saved.</p>}</div>
            </>}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" className="min-h-11" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || saving || loadingExisting}>
            <ChevronLeft className="mr-2 h-4 w-4" />Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button className="min-h-11" onClick={() => void next()} disabled={saving || loadingExisting}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save & continue<ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button className="min-h-11" onClick={() => void finish()} disabled={saving || uploading || loadingExisting}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}Finish setup
            </Button>
          )}
        </div>
      </section>
    </main>
  );
}
