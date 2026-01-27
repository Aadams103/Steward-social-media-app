import * as React from "react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, User, Mail, Globe, Languages } from "lucide-react";
import { toast } from "sonner";

// Timezone options (common ones)
const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Australia/Sydney", label: "Sydney (AEDT)" },
];

const LOCALES = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "es-ES", label: "Spanish" },
  { value: "fr-FR", label: "French" },
  { value: "de-DE", label: "German" },
  { value: "ja-JP", label: "Japanese" },
  { value: "zh-CN", label: "Chinese (Simplified)" },
];

export function ProfileSettings() {
  const { userProfile, updateUserProfile, userPreferences, updateUserPreferences } = useAppStore();

  if (!userProfile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No profile found. Please create one.</p>
      </div>
    );
  }

  const [isSaving, setIsSaving] = React.useState(false);
  const [fullName, setFullName] = React.useState(userProfile.fullName);
  const [email, setEmail] = React.useState(userProfile.email);
  const [timezone, setTimezone] = React.useState(userProfile.timezone);
  const [locale, setLocale] = React.useState(userProfile.locale);
  const [avatarUrl, setAvatarUrl] = React.useState(userProfile.avatarUrl || "");

  const [preferences, setPreferences] = React.useState(userPreferences);

  React.useEffect(() => {
    setFullName(userProfile.fullName);
    setEmail(userProfile.email);
    setTimezone(userProfile.timezone);
    setLocale(userProfile.locale);
    setAvatarUrl(userProfile.avatarUrl || "");
  }, [userProfile]);

  React.useEffect(() => {
    setPreferences(userPreferences);
  }, [userPreferences]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      updateUserProfile({
        fullName,
        email,
        timezone,
        locale,
        avatarUrl: avatarUrl || undefined,
      });
      updateUserPreferences(preferences);
      toast.success("Profile settings saved successfully");
    } catch (error) {
      toast.error("Failed to save profile settings");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Core Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Core Identity
          </CardTitle>
          <CardDescription>
            Your personal information and identity. This represents you as a human operator, not your brand.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full-name">Full Name</Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
            />
            <p className="text-sm text-muted-foreground">
              Used for login and notifications. This is your personal email, not a brand email.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar-url">Profile Avatar (Optional)</Label>
            <Input
              id="avatar-url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
            <p className="text-sm text-muted-foreground">
              URL to your profile picture. This is your personal avatar, not a brand logo.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="timezone" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Time Zone
            </Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="timezone">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="locale" className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              Language / Locale
            </Label>
            <Select value={locale} onValueChange={setLocale}>
              <SelectTrigger id="locale">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LOCALES.map((loc) => (
                  <SelectItem key={loc.value} value={loc.value}>
                    {loc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Personal preferences for how you interact with the app. These are human preferences, not brand settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-3">Notification Preferences</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notify-email">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="notify-email"
                    checked={preferences.notifications.email}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        notifications: { ...preferences.notifications, email: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notify-inapp">In-App Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Show notifications within the app
                    </p>
                  </div>
                  <Switch
                    id="notify-inapp"
                    checked={preferences.notifications.inApp}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        notifications: { ...preferences.notifications, inApp: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notify-critical">Critical Alerts Only</Label>
                    <p className="text-sm text-muted-foreground">
                      Only receive critical system alerts
                    </p>
                  </div>
                  <Switch
                    id="notify-critical"
                    checked={preferences.notifications.criticalAlertsOnly}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        notifications: { ...preferences.notifications, criticalAlertsOnly: checked },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium mb-3">Accessibility</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reduced-motion">Reduced Motion</Label>
                    <p className="text-sm text-muted-foreground">
                      Reduce animations and transitions
                    </p>
                  </div>
                  <Switch
                    id="reduced-motion"
                    checked={preferences.accessibility.reducedMotion}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        accessibility: { ...preferences.accessibility, reducedMotion: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="high-contrast">High Contrast</Label>
                    <p className="text-sm text-muted-foreground">
                      Increase contrast for better visibility
                    </p>
                  </div>
                  <Switch
                    id="high-contrast"
                    checked={preferences.accessibility.highContrast}
                    onCheckedChange={(checked) =>
                      setPreferences({
                        ...preferences,
                        accessibility: { ...preferences.accessibility, highContrast: checked },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font-scaling">Font Scaling: {preferences.accessibility.fontScaling.toFixed(1)}x</Label>
                  <Input
                    id="font-scaling"
                    type="range"
                    min="1.0"
                    max="2.0"
                    step="0.1"
                    value={preferences.accessibility.fontScaling}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        accessibility: {
                          ...preferences.accessibility,
                          fontScaling: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium mb-3">Other Preferences</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="keyboard-shortcuts">Keyboard Shortcuts</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable keyboard shortcuts for faster navigation
                    </p>
                  </div>
                  <Switch
                    id="keyboard-shortcuts"
                    checked={preferences.keyboardShortcuts}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, keyboardShortcuts: checked })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date-format">Date Format</Label>
                    <Select
                      value={preferences.dateTimeFormat.dateFormat}
                      onValueChange={(value: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD") =>
                        setPreferences({
                          ...preferences,
                          dateTimeFormat: { ...preferences.dateTimeFormat, dateFormat: value },
                        })
                      }
                    >
                      <SelectTrigger id="date-format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time-format">Time Format</Label>
                    <Select
                      value={preferences.dateTimeFormat.timeFormat}
                      onValueChange={(value: "12h" | "24h") =>
                        setPreferences({
                          ...preferences,
                          dateTimeFormat: { ...preferences.dateTimeFormat, timeFormat: value },
                        })
                      }
                    >
                      <SelectTrigger id="time-format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12-hour</SelectItem>
                        <SelectItem value="24h">24-hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
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
