import * as React from "react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Save } from "lucide-react";
import { toast } from "sonner";
import {
  type BrandStrategy,
  type MarketPositioning,
  type BrandIdentity,
  type BrandExperience,
} from "@/types/app";

export function MyBrandSettings() {
  const { brandProfile, updateBrandProfile } = useAppStore();

  if (!brandProfile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No brand profile found. Please create one.</p>
      </div>
    );
  }

  const [isSaving, setIsSaving] = React.useState(false);

  // Local state for editing
  const [brandStrategy, setBrandStrategy] = React.useState<BrandStrategy>(
    brandProfile.brandStrategy || {
      purpose: "",
      mission: "",
      vision: "",
      coreValues: [],
      brandArchetype: "",
    }
  );

  const [marketPositioning, setMarketPositioning] = React.useState<MarketPositioning>(
    brandProfile.marketPositioning || {
      targetPersonas: [],
      competitiveLandscape: "",
      uniqueValueProposition: "",
      positioningStatement: "",
    }
  );

  const [brandIdentity, setBrandIdentity] = React.useState<BrandIdentity>(
    brandProfile.brandIdentity || {
      visualDirection: {
        colorIntent: [],
        typographyIntent: "",
      },
      verbalIdentity: {
        tone: "",
        vocabulary: [],
        messagingRules: [],
      },
    }
  );

  const [brandExperience, setBrandExperience] = React.useState<BrandExperience>(
    brandProfile.brandExperience || {
      customerJourney: [],
      touchpoints: [],
      consistencyRules: [],
    }
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      updateBrandProfile({
        brandStrategy,
        marketPositioning,
        brandIdentity,
        brandExperience,
      });
      toast.success("Brand settings saved successfully");
    } catch (error) {
      toast.error("Failed to save brand settings");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* I. Brand Strategy */}
      <Card>
        <CardHeader>
          <CardTitle>I. Brand Strategy</CardTitle>
          <CardDescription>
            The foundational purpose, mission, vision, values, and archetype that define your brand.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea
              id="purpose"
              value={brandStrategy.purpose}
              onChange={(e) => setBrandStrategy({ ...brandStrategy, purpose: e.target.value })}
              placeholder="Why does your brand exist?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mission">Mission</Label>
            <Textarea
              id="mission"
              value={brandStrategy.mission}
              onChange={(e) => setBrandStrategy({ ...brandStrategy, mission: e.target.value })}
              placeholder="What does your brand do?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vision">Vision</Label>
            <Textarea
              id="vision"
              value={brandStrategy.vision}
              onChange={(e) => setBrandStrategy({ ...brandStrategy, vision: e.target.value })}
              placeholder="Where is your brand going?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Core Values</Label>
            <div className="flex flex-wrap gap-2">
              {brandStrategy.coreValues.map((value, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {value}
                  <button
                    onClick={() => {
                      setBrandStrategy({
                        ...brandStrategy,
                        coreValues: brandStrategy.coreValues.filter((_, i) => i !== index),
                      });
                    }}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a core value"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
                    setBrandStrategy({
                      ...brandStrategy,
                      coreValues: [...brandStrategy.coreValues, e.currentTarget.value.trim()],
                    });
                    e.currentTarget.value = "";
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="archetype">Brand Archetype</Label>
            <Input
              id="archetype"
              value={brandStrategy.brandArchetype}
              onChange={(e) => setBrandStrategy({ ...brandStrategy, brandArchetype: e.target.value })}
              placeholder="e.g., The Sage, The Hero, The Explorer"
            />
          </div>
        </CardContent>
      </Card>

      {/* II. Market Positioning */}
      <Card>
        <CardHeader>
          <CardTitle>II. Market Positioning</CardTitle>
          <CardDescription>
            Target audience, competitive landscape, unique value proposition, and positioning statement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <Label>Target Personas</Label>
            {marketPositioning.targetPersonas.map((persona, index) => (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <Input
                    value={persona.name}
                    onChange={(e) => {
                      const newPersonas = [...marketPositioning.targetPersonas];
                      newPersonas[index] = { ...persona, name: e.target.value };
                      setMarketPositioning({ ...marketPositioning, targetPersonas: newPersonas });
                    }}
                    placeholder="Persona name"
                    className="mb-2"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setMarketPositioning({
                        ...marketPositioning,
                        targetPersonas: marketPositioning.targetPersonas.filter((_, i) => i !== index),
                      });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={persona.description}
                  onChange={(e) => {
                    const newPersonas = [...marketPositioning.targetPersonas];
                    newPersonas[index] = { ...persona, description: e.target.value };
                    setMarketPositioning({ ...marketPositioning, targetPersonas: newPersonas });
                  }}
                  placeholder="Description"
                  rows={2}
                  className="mb-2"
                />
                <Input
                  value={persona.demographics || ""}
                  onChange={(e) => {
                    const newPersonas = [...marketPositioning.targetPersonas];
                    newPersonas[index] = { ...persona, demographics: e.target.value };
                    setMarketPositioning({ ...marketPositioning, targetPersonas: newPersonas });
                  }}
                  placeholder="Demographics (optional)"
                  className="mb-2"
                />
                <Input
                  value={persona.psychographics || ""}
                  onChange={(e) => {
                    const newPersonas = [...marketPositioning.targetPersonas];
                    newPersonas[index] = { ...persona, psychographics: e.target.value };
                    setMarketPositioning({ ...marketPositioning, targetPersonas: newPersonas });
                  }}
                  placeholder="Psychographics (optional)"
                />
              </Card>
            ))}
            <Button
              variant="outline"
              onClick={() => {
                setMarketPositioning({
                  ...marketPositioning,
                  targetPersonas: [
                    ...marketPositioning.targetPersonas,
                    { name: "", description: "" },
                  ],
                });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Persona
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="competitive-landscape">Competitive Landscape</Label>
            <Textarea
              id="competitive-landscape"
              value={marketPositioning.competitiveLandscape}
              onChange={(e) =>
                setMarketPositioning({ ...marketPositioning, competitiveLandscape: e.target.value })
              }
              placeholder="Analysis of competitors and market position"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="uvp">Unique Value Proposition</Label>
            <Textarea
              id="uvp"
              value={marketPositioning.uniqueValueProposition}
              onChange={(e) =>
                setMarketPositioning({ ...marketPositioning, uniqueValueProposition: e.target.value })
              }
              placeholder="What makes your brand unique?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="positioning-statement">Positioning Statement</Label>
            <Textarea
              id="positioning-statement"
              value={marketPositioning.positioningStatement}
              onChange={(e) =>
                setMarketPositioning({ ...marketPositioning, positioningStatement: e.target.value })
              }
              placeholder="Clear positioning statement"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* III. Brand Identity */}
      <Card>
        <CardHeader>
          <CardTitle>III. Brand Identity</CardTitle>
          <CardDescription>
            Visual direction, verbal identity, and tagline that define how your brand looks and sounds.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label>Visual Direction</Label>
              <div className="space-y-2 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="logo-usage" className="text-sm">Logo Usage Guidelines</Label>
                  <Textarea
                    id="logo-usage"
                    value={brandIdentity.visualDirection.logoUsage || ""}
                    onChange={(e) =>
                      setBrandIdentity({
                        ...brandIdentity,
                        visualDirection: {
                          ...brandIdentity.visualDirection,
                          logoUsage: e.target.value,
                        },
                      })
                    }
                    placeholder="Guidelines for logo usage"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color-intent" className="text-sm">Color Intent</Label>
                  <div className="flex flex-wrap gap-2">
                    {brandIdentity.visualDirection.colorIntent.map((color, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {color}
                        <button
                          onClick={() => {
                            setBrandIdentity({
                              ...brandIdentity,
                              visualDirection: {
                                ...brandIdentity.visualDirection,
                                colorIntent: brandIdentity.visualDirection.colorIntent.filter(
                                  (_, i) => i !== index
                                ),
                              },
                            });
                          }}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Add color with intent (e.g., Blue - Trust)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        setBrandIdentity({
                          ...brandIdentity,
                          visualDirection: {
                            ...brandIdentity.visualDirection,
                            colorIntent: [
                              ...brandIdentity.visualDirection.colorIntent,
                              e.currentTarget.value.trim(),
                            ],
                          },
                        });
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="typography-intent" className="text-sm">Typography Intent</Label>
                  <Textarea
                    id="typography-intent"
                    value={brandIdentity.visualDirection.typographyIntent}
                    onChange={(e) =>
                      setBrandIdentity({
                        ...brandIdentity,
                        visualDirection: {
                          ...brandIdentity.visualDirection,
                          typographyIntent: e.target.value,
                        },
                      })
                    }
                    placeholder="Typography direction and style"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <Label>Verbal Identity</Label>
              <div className="space-y-2 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="tone" className="text-sm">Tone</Label>
                  <Textarea
                    id="tone"
                    value={brandIdentity.verbalIdentity.tone}
                    onChange={(e) =>
                      setBrandIdentity({
                        ...brandIdentity,
                        verbalIdentity: {
                          ...brandIdentity.verbalIdentity,
                          tone: e.target.value,
                        },
                      })
                    }
                    placeholder="Overall brand tone"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vocabulary" className="text-sm">Vocabulary</Label>
                  <div className="flex flex-wrap gap-2">
                    {brandIdentity.verbalIdentity.vocabulary.map((word, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {word}
                        <button
                          onClick={() => {
                            setBrandIdentity({
                              ...brandIdentity,
                              verbalIdentity: {
                                ...brandIdentity.verbalIdentity,
                                vocabulary: brandIdentity.verbalIdentity.vocabulary.filter(
                                  (_, i) => i !== index
                                ),
                              },
                            });
                          }}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Add preferred word/phrase"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        setBrandIdentity({
                          ...brandIdentity,
                          verbalIdentity: {
                            ...brandIdentity.verbalIdentity,
                            vocabulary: [
                              ...brandIdentity.verbalIdentity.vocabulary,
                              e.currentTarget.value.trim(),
                            ],
                          },
                        });
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="messaging-rules" className="text-sm">Messaging Rules</Label>
                  <div className="flex flex-wrap gap-2">
                    {brandIdentity.verbalIdentity.messagingRules.map((rule, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {rule}
                        <button
                          onClick={() => {
                            setBrandIdentity({
                              ...brandIdentity,
                              verbalIdentity: {
                                ...brandIdentity.verbalIdentity,
                                messagingRules: brandIdentity.verbalIdentity.messagingRules.filter(
                                  (_, i) => i !== index
                                ),
                              },
                            });
                          }}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Add messaging rule"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        setBrandIdentity({
                          ...brandIdentity,
                          verbalIdentity: {
                            ...brandIdentity.verbalIdentity,
                            messagingRules: [
                              ...brandIdentity.verbalIdentity.messagingRules,
                              e.currentTarget.value.trim(),
                            ],
                          },
                        });
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline / Slogan</Label>
              <Input
                id="tagline"
                value={brandIdentity.tagline || ""}
                onChange={(e) => setBrandIdentity({ ...brandIdentity, tagline: e.target.value })}
                placeholder="Brand tagline or slogan"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* IV. Brand Experience */}
      <Card>
        <CardHeader>
          <CardTitle>IV. Brand Experience</CardTitle>
          <CardDescription>
            Customer journey, touchpoints, and consistency rules that define the brand experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <Label>Customer Journey</Label>
            {brandExperience.customerJourney.map((stage, index) => (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <Input
                    value={stage.stage}
                    onChange={(e) => {
                      const newJourney = [...brandExperience.customerJourney];
                      newJourney[index] = { ...stage, stage: e.target.value };
                      setBrandExperience({ ...brandExperience, customerJourney: newJourney });
                    }}
                    placeholder="Stage name"
                    className="mb-2"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setBrandExperience({
                        ...brandExperience,
                        customerJourney: brandExperience.customerJourney.filter((_, i) => i !== index),
                      });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={stage.description}
                  onChange={(e) => {
                    const newJourney = [...brandExperience.customerJourney];
                    newJourney[index] = { ...stage, description: e.target.value };
                    setBrandExperience({ ...brandExperience, customerJourney: newJourney });
                  }}
                  placeholder="Stage description"
                  rows={2}
                  className="mb-2"
                />
                <div className="space-y-2">
                  <Label className="text-sm">Touchpoints</Label>
                  <div className="flex flex-wrap gap-2">
                    {stage.touchpoints.map((touchpoint, tpIndex) => (
                      <Badge key={tpIndex} variant="secondary" className="gap-1">
                        {touchpoint}
                        <button
                          onClick={() => {
                            const newJourney = [...brandExperience.customerJourney];
                            newJourney[index] = {
                              ...stage,
                              touchpoints: stage.touchpoints.filter((_, i) => i !== tpIndex),
                            };
                            setBrandExperience({ ...brandExperience, customerJourney: newJourney });
                          }}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder="Add touchpoint"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        const newJourney = [...brandExperience.customerJourney];
                        newJourney[index] = {
                          ...stage,
                          touchpoints: [...stage.touchpoints, e.currentTarget.value.trim()],
                        };
                        setBrandExperience({ ...brandExperience, customerJourney: newJourney });
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </div>
              </Card>
            ))}
            <Button
              variant="outline"
              onClick={() => {
                setBrandExperience({
                  ...brandExperience,
                  customerJourney: [
                    ...brandExperience.customerJourney,
                    { stage: "", description: "", touchpoints: [] },
                  ],
                });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Journey Stage
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>All Touchpoints</Label>
            <div className="flex flex-wrap gap-2">
              {brandExperience.touchpoints.map((touchpoint, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {touchpoint}
                  <button
                    onClick={() => {
                      setBrandExperience({
                        ...brandExperience,
                        touchpoints: brandExperience.touchpoints.filter((_, i) => i !== index),
                      });
                    }}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Add touchpoint"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  setBrandExperience({
                    ...brandExperience,
                    touchpoints: [...brandExperience.touchpoints, e.currentTarget.value.trim()],
                  });
                  e.currentTarget.value = "";
                }
              }}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Consistency Rules</Label>
            <div className="flex flex-wrap gap-2">
              {brandExperience.consistencyRules.map((rule, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {rule}
                  <button
                    onClick={() => {
                      setBrandExperience({
                        ...brandExperience,
                        consistencyRules: brandExperience.consistencyRules.filter((_, i) => i !== index),
                      });
                    }}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Add consistency rule"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  setBrandExperience({
                    ...brandExperience,
                    consistencyRules: [...brandExperience.consistencyRules, e.currentTarget.value.trim()],
                  });
                  e.currentTarget.value = "";
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
