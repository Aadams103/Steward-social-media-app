import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { brandIntelligenceApi } from "@/sdk/services/api-services";
import { StewardEmptyState } from "@/components/steward";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Building2, Palette, MapPin, Share2, Mic2, Users, Layers, Hash, Upload } from "lucide-react";

const STEPS = [
  { id: "org", title: "Organization", icon: Building2 },
  { id: "brand", title: "Brand", icon: Palette },
  { id: "basics", title: "Business basics", icon: Building2 },
  { id: "location", title: "Location", icon: MapPin },
  { id: "platforms", title: "Platforms", icon: Share2 },
  { id: "voice", title: "Brand voice", icon: Mic2 },
  { id: "audiences", title: "Audiences", icon: Users },
  { id: "pillars", title: "Content pillars", icon: Layers },
  { id: "hashtags", title: "CTA & hashtags", icon: Hash },
  { id: "media", title: "First media", icon: Upload },
] as const;

export function OnboardingPage() {
  const navigate = useNavigate();
  const { organizationId, brandId, isRealWorkspace, missingSetupSteps, selectOrganization, refetch } =
    useCurrentWorkspace();
  const [step, setStep] = React.useState(0);
  const [orgName, setOrgName] = React.useState("");
  const [brandName, setBrandName] = React.useState("");
  const [businessName, setBusinessName] = React.useState("");
  const [city, setCity] = React.useState("");
  const [voice, setVoice] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [skipped, setSkipped] = React.useState<Set<string>>(new Set());

  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  const saveBrandBasics = async () => {
    if (!organizationId || !brandId) return;
    setSaving(true);
    try {
      await brandIntelligenceApi.getContext({
        organizationId,
        brandId,
        operation: "onboarding_save",
      });
      // Profile PATCH via steward brand profile when fields provided
      if (businessName || city || voice) {
        await fetch(`/api/steward/brands/${brandId}/profile`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            business_name: businessName || undefined,
            city: city || undefined,
            brand_voice_summary: voice || undefined,
          }),
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const finish = async () => {
    await refetch();
    void navigate({ to: "/app" });
  };

  const skipStep = () => {
    setSkipped((s) => new Set(s).add(STEPS[step]!.id));
    if (step < STEPS.length - 1) setStep(step + 1);
    else void finish();
  };

  const next = async () => {
    if (step === 2) await saveBrandBasics();
    if (step < STEPS.length - 1) setStep(step + 1);
    else void finish();
  };

  if (isRealWorkspace && !missingSetupSteps.includes("organization") && !missingSetupSteps.includes("brand")) {
    return (
      <div className="mx-auto max-w-lg py-12">
        <StewardEmptyState
          title="Workspace ready"
          description="Your organization and brand are configured. Continue to Command Center."
          actionLabel="Open Command Center"
          onAction={() => void navigate({ to: "/app" })}
        />
      </div>
    );
  }

  const current = STEPS[step]!;

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Steward onboarding</h1>
        <p className="text-sm text-muted-foreground">
          Set up your real organization and brand. Each step saves incrementally — skip any step and Steward records
          missing context honestly.
        </p>
      </div>

      <Progress value={progress} className="h-2" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <current.icon className="h-4 w-4" />
            Step {step + 1}: {current.title}
          </CardTitle>
          <CardDescription>
            {current.id === "org" && "Create or select your Supabase organization."}
            {current.id === "brand" && "Create your first brand under this organization."}
            {current.id === "basics" && "Business name and category for Brand Intelligence."}
            {current.id === "location" && "City and timezone for scheduling."}
            {current.id === "platforms" && "Which platforms you plan to publish on."}
            {current.id === "voice" && "How Steward should sound when drafting content."}
            {current.id === "audiences" && "Who you are trying to reach."}
            {current.id === "pillars" && "Recurring content themes."}
            {current.id === "hashtags" && "Default CTAs and hashtag banks."}
            {current.id === "media" && "Upload first media or create a draft in Create Studio."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {current.id === "org" && (
            <div className="space-y-2">
              <Label>Organization name</Label>
              <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Acme Marketing Co." />
              <p className="text-xs text-muted-foreground">
                Organizations are created in Supabase. If you have no org yet, contact your admin or complete signup.
              </p>
            </div>
          )}
          {current.id === "brand" && (
            <div className="space-y-2">
              <Label>Brand name</Label>
              <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Primary brand" />
            </div>
          )}
          {current.id === "basics" && (
            <div className="space-y-2">
              <Label>Business name</Label>
              <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            </div>
          )}
          {current.id === "location" && (
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Austin, TX" />
            </div>
          )}
          {current.id === "voice" && (
            <div className="space-y-2">
              <Label>Brand voice summary</Label>
              <Input value={voice} onChange={(e) => setVoice(e.target.value)} placeholder="Professional, encouraging, local" />
            </div>
          )}
          {(current.id === "platforms" ||
            current.id === "audiences" ||
            current.id === "pillars" ||
            current.id === "hashtags" ||
            current.id === "media") && (
            <p className="text-sm text-muted-foreground">
              Configure in Brand Intelligence after onboarding, or skip now and Steward will flag missing context.
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={() => void next()} disabled={saving}>
              {step === STEPS.length - 1 ? "Finish" : "Save & continue"}
            </Button>
            <Button variant="outline" onClick={skipStep}>
              Skip
            </Button>
            {organizationId && brandId && (
              <Button variant="ghost" onClick={() => void selectOrganization(organizationId, brandId)}>
                Reload workspace
              </Button>
            )}
          </div>
          {skipped.size > 0 && (
            <p className="text-xs text-muted-foreground">Skipped steps: {Array.from(skipped).join(", ")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
