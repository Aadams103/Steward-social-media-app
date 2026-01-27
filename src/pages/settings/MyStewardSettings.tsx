import * as React from "react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Save } from "lucide-react";
import { toast } from "sonner";
import {
  type StewardVoiceIdentity,
  type StewardPersonalityStyle,
  STEWARD_PERSONALITY_STYLES,
} from "@/types/app";

export function MyStewardSettings() {
  const { stewardPersona, updateStewardPersona } = useAppStore();

  const [isSaving, setIsSaving] = React.useState(false);
  const [name, setName] = React.useState(stewardPersona.name);
  const [voiceIdentity, setVoiceIdentity] = React.useState<StewardVoiceIdentity>(
    stewardPersona.voiceIdentity
  );
  const [personalityStyle, setPersonalityStyle] = React.useState<StewardPersonalityStyle>(
    stewardPersona.personalityStyle
  );

  React.useEffect(() => {
    setName(stewardPersona.name);
    setVoiceIdentity(stewardPersona.voiceIdentity);
    setPersonalityStyle(stewardPersona.personalityStyle);
  }, [stewardPersona]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      updateStewardPersona({
        name: name.trim() || "Steward",
        voiceIdentity,
        personalityStyle,
      });
      toast.success("Steward persona settings saved successfully");
    } catch (error) {
      toast.error("Failed to save Steward persona settings");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Steward Identity</CardTitle>
          <CardDescription>
            Configure the Steward's name and voice identity. These settings affect how the Steward
            presents itself in communications, statuses, approvals, and audit logs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="steward-name">Steward Name</Label>
            <Input
              id="steward-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Steward"
            />
            <p className="text-sm text-muted-foreground">
              The name used when the Steward refers to itself. Default: "Steward"
            </p>
          </div>

          <div className="space-y-3">
            <Label>Voice Identity</Label>
            <RadioGroup
              value={voiceIdentity}
              onValueChange={(value) => setVoiceIdentity(value as StewardVoiceIdentity)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="neutral" id="voice-neutral" />
                <Label htmlFor="voice-neutral" className="font-normal cursor-pointer">
                  Neutral
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="feminine" id="voice-feminine" />
                <Label htmlFor="voice-feminine" className="font-normal cursor-pointer">
                  Feminine
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="masculine" id="voice-masculine" />
                <Label htmlFor="voice-masculine" className="font-normal cursor-pointer">
                  Masculine
                </Label>
              </div>
            </RadioGroup>
            <p className="text-sm text-muted-foreground">
              Affects pronouns, sentence structure, and emotional temperature in the Steward's
              communications.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personality Style</CardTitle>
          <CardDescription>
            Choose a personality preset that defines how the Steward communicates. The Steward always
            maintains its core "Wise Steward" archetype regardless of personality style.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={personalityStyle}
            onValueChange={(value) => setPersonalityStyle(value as StewardPersonalityStyle)}
            className="space-y-3"
          >
            {STEWARD_PERSONALITY_STYLES.map((style) => (
              <div key={style.id} className="flex items-start space-x-3">
                <RadioGroupItem value={style.id} id={style.id} className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor={style.id} className="font-medium cursor-pointer">
                    {style.label}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">{style.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Constraints</CardTitle>
          <CardDescription>
            These constraints always apply, regardless of persona settings. The Steward cannot
            override these rules.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Always operates under the Wise Steward archetype</li>
            <li>Prefers safety over novelty</li>
            <li>Requests approval when uncertain</li>
            <li>Logs every meaningful action</li>
            <li>Explains why it did something when asked</li>
            <li>Never contradicts brand rules</li>
          </ul>
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
