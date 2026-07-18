import * as React from "react";
import { Loader2, Sparkles, Wand2, CalendarDays, ShieldCheck, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { aiApi, type AiGatewayResponse } from "@/sdk/services/api-services";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface StewardAiActionsProps {
  organizationId?: string;
  assetId?: string;
  postId?: string;
  caption?: string;
  platform?: 'facebook' | 'instagram';
  prepareDraftInput?: () => Promise<Record<string, unknown>>;
  onDraftGenerated?: (result: AiGatewayResponse) => void;
}

export function StewardAiActions({
  organizationId,
  assetId,
  postId,
  caption,
  platform = 'instagram',
  prepareDraftInput,
  onDraftGenerated,
}: StewardAiActionsProps) {
  const activeBrandId = useAppStore((s) => s.activeBrandId);
  const [loading, setLoading] = React.useState<string | null>(null);
  const [lastResult, setLastResult] = React.useState<AiGatewayResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const brandId = activeBrandId !== "all" ? activeBrandId : undefined;
  const orgId = organizationId;

  const disabled = !orgId || !brandId;

  const run = async (key: string, fn: () => Promise<AiGatewayResponse>) => {
    if (disabled) {
      toast.error("Select a brand with an organization to use Steward AI.");
      return;
    }
    setLoading(key);
    setError(null);
    try {
      const result = await fn();
      setLastResult(result);
      if (result.needsHumanReview) {
        toast.message("AI result ready — review recommended", {
          description: result.warnings.join(" "),
        });
      } else {
        toast.success("Steward AI completed successfully.");
      }
      onDraftGenerated?.(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Steward AI request failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(null);
    }
  };

  const basePayload = { organizationId: orgId!, brandId: brandId! };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Steward AI
        </CardTitle>
        <CardDescription>
          Secure AI actions via the Steward AI Gateway. Nothing publishes automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={disabled || !assetId || loading !== null}
            onClick={() =>
              run("analyze", () =>
                aiApi.analyzeMedia({ ...basePayload, assetId, description: caption })
              )
            }
          >
            {loading === "analyze" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            Analyze with Steward AI
          </Button>
          <Button
            size="sm"
            disabled={disabled || loading !== null}
            onClick={() =>
              run("draft", async () => {
                const prepared = prepareDraftInput ? await prepareDraftInput() : {};
                return aiApi.generatePostDraft({
                  ...basePayload,
                  userPrompt: caption,
                  platforms: [platform],
                  persistDraft: true,
                  ...prepared,
                });
              })
            }
          >
            {loading === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate Draft
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={disabled || !postId || loading !== null}
            onClick={() =>
              run("variants", () =>
                aiApi.generatePlatformVariants({
                  ...basePayload,
                  postId,
                  platforms: ["instagram", "facebook"],
                  persistVariants: true,
                })
              )
            }
          >
            Generate Platform Variants
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={disabled || loading !== null}
            onClick={() =>
              run("schedule", () =>
                aiApi.recommendSchedule({
                  ...basePayload,
                  postId,
                  platform,
                  draftCaption: caption,
                })
              )
            }
          >
            <CalendarDays className="h-4 w-4" />
            Recommend Schedule
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={disabled || !caption || loading !== null}
            onClick={() =>
              run("score", () =>
                aiApi.scoreContent({ ...basePayload, caption: caption!, platform })
              )
            }
          >
            <BarChart3 className="h-4 w-4" />
            Score Content
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={disabled || !caption || loading !== null}
            onClick={() =>
              run("moderate", () =>
                aiApi.moderateContent({ ...basePayload, caption: caption!, platform })
              )
            }
          >
            <ShieldCheck className="h-4 w-4" />
            Safety check
          </Button>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>AI error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {lastResult ? (
          <div className="rounded-md border p-3 text-sm space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Job {lastResult.aiJobId.slice(0, 8)}</Badge>
              <Badge>{lastResult.model}</Badge>
              {lastResult.needsHumanReview ? <Badge variant="outline">Needs review</Badge> : null}
            </div>
            {lastResult.warnings.length ? (
              <p className="text-muted-foreground">{lastResult.warnings.join(" ")}</p>
            ) : null}
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-xs bg-muted/40 p-2 rounded">
              {JSON.stringify(lastResult.result, null, 2)}
            </pre>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
