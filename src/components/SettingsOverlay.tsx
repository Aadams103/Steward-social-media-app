import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProfileSettings } from "@/pages/settings/ProfileSettings";
import { MyBrandSettings } from "@/pages/settings/MyBrandSettings";
import { MyStewardSettings } from "@/pages/settings/MyStewardSettings";
import { AccountSettings } from "@/pages/settings/AccountSettings";
import { SecuritySettings } from "@/pages/settings/SecuritySettings";
import { BillingSettings } from "@/pages/settings/BillingSettings";
import { IntegrationsSettings } from "@/pages/settings/IntegrationsSettings";
import { AuditLogsSettings } from "@/pages/settings/AuditLogsSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";

export type SettingsSectionId =
  | "my-account"
  | "my-steward"
  | "my-brand"
  | "integrations"
  | "billing"
  | "security"
  | "support"
  | "audit";

interface SettingsOverlayProps {
  open: boolean;
  section: SettingsSectionId;
  onOpenChange: (open: boolean) => void;
  onSectionChange: (section: SettingsSectionId) => void;
}

/**
 * Global Settings overlay.
 *
 * - Drawer on desktop (right side), full-height sheet on mobile.
 * - Keeps current context visible behind dimmed background.
 * - Centralizes all settings sections with short explainers.
 * - Handles unsaved-changes confirmation on close attempts.
 */
export function SettingsOverlay(props: SettingsOverlayProps) {
  const { open, section, onOpenChange, onSectionChange } = props;
  const isMobile = useIsMobile();

  const [isDirty, setIsDirty] = React.useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = React.useState(false);
  const pendingCloseRef = React.useRef(false);

  React.useEffect(() => {
    if (!open) {
      // Reset dirty state whenever overlay fully closes
      setIsDirty(false);
      pendingCloseRef.current = false;
    }
  }, [open]);

  const handleRequestClose = React.useCallback(() => {
    if (isDirty) {
      pendingCloseRef.current = true;
      setShowUnsavedConfirm(true);
      return;
    }
    onOpenChange(false);
  }, [isDirty, onOpenChange]);

  const handleSheetOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        handleRequestClose();
      } else {
        onOpenChange(true);
      }
    },
    [handleRequestClose, onOpenChange]
  );

  const handleDiscardChanges = React.useCallback(() => {
    setShowUnsavedConfirm(false);
    setIsDirty(false);
    pendingCloseRef.current = false;
    onOpenChange(false);
  }, [onOpenChange]);

  const handleKeepEditing = React.useCallback(() => {
    setShowUnsavedConfirm(false);
    pendingCloseRef.current = false;
  }, []);

  const handleInteraction = React.useCallback(() => {
    // Mark overlay as dirty on first user interaction with any settings content.
    if (!isDirty) {
      setIsDirty(true);
    }
  }, [isDirty]);

  const side = isMobile ? "bottom" : "right";

  return (
    <>
      <Sheet open={open} onOpenChange={handleSheetOpenChange}>
        <SheetContent
          side={side}
          className={
            isMobile
              ? "h-full w-full border-l bg-background px-0 pt-0"
              : "h-full w-full max-w-3xl border-l bg-background px-0 pt-0"
          }
        >
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription>
              Configure your account, Steward persona, brand system, and connections. Changes are only
              applied when you explicitly save them inside each section.
            </SheetDescription>
          </SheetHeader>

          <div
            className="flex h-[calc(100%-4rem)] flex-col overflow-hidden"
            onChangeCapture={handleInteraction}
            onInputCapture={handleInteraction}
          >
            <Tabs
              value={section}
              onValueChange={(value) => onSectionChange(value as SettingsSectionId)}
              className="flex h-full flex-col"
            >
              <div className="border-b px-6 pt-4">
                <TabsList className="w-full justify-start overflow-x-auto">
                  <TabsTrigger value="my-account" className="whitespace-nowrap">
                    My Account
                  </TabsTrigger>
                  <TabsTrigger value="my-steward" className="whitespace-nowrap">
                    My Steward
                  </TabsTrigger>
                  <TabsTrigger value="my-brand" className="whitespace-nowrap">
                    My Brand
                  </TabsTrigger>
                  <TabsTrigger value="integrations" className="whitespace-nowrap">
                    Social Integrations
                  </TabsTrigger>
                  <TabsTrigger value="billing" className="whitespace-nowrap">
                    Billing
                  </TabsTrigger>
                  <TabsTrigger value="security" className="whitespace-nowrap">
                    Security
                  </TabsTrigger>
                  <TabsTrigger value="support" className="whitespace-nowrap">
                    Support
                  </TabsTrigger>
                  <TabsTrigger value="audit" className="whitespace-nowrap">
                    Audit & Logs
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
                <TabsContent value="my-account" className="mt-0 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>My Account</CardTitle>
                      <CardDescription>
                        Your personal identity and preferences as the human operator. This affects how you
                        sign in, what notifications you receive, and how Steward presents information to you.
                        If untouched, we keep sensible defaults and your existing login details.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ProfileSettings />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="my-steward" className="mt-0 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>My Steward</CardTitle>
                      <CardDescription>
                        Define how Steward speaks and behaves while operating on your behalf. These settings
                        influence tone, persona, and communication style but never override safety rules or
                        brand constraints. If you leave this as-is, Steward uses the default Wise Steward
                        persona.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <MyStewardSettings />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="my-brand" className="mt-0 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>My Brand</CardTitle>
                      <CardDescription>
                        Configure what Steward builds and protects: brand strategy, voice, pillars, and
                        compliance notes. These settings drive what gets generated, scheduled, and monitored
                        across channels. If you skip this, Steward relies on minimal defaults and may ask for
                        clarification before acting.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <MyBrandSettings />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="integrations" className="mt-0 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Social Integrations</CardTitle>
                      <CardDescription>
                        Connect or manage your social accounts. Connections determine where Steward can post,
                        fetch analytics, and monitor conversations. If you leave this untouched, Steward
                        cannot publish or analyze content for those platforms.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <IntegrationsSettings />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="billing" className="mt-0 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Billing</CardTitle>
                      <CardDescription>
                        Review your plan, usage, and invoices. Billing settings control limits such as
                        connected accounts and scheduled posts. If you do not adjust these, your current plan
                        and limits remain unchanged.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <BillingSettings />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="security" className="mt-0 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Security</CardTitle>
                      <CardDescription>
                        Strengthen how your account is protected: passwords, two-factor authentication, and
                        active sessions. If you leave security unchanged, your current protections remain in
                        place and Steward will continue to respect existing approval rules.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <SecuritySettings />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="support" className="mt-0 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Support & Help</CardTitle>
                      <CardDescription>
                        Find documentation, contact support, and share feedback with the team. If you never
                        use this panel, Steward will continue operating with the defaults and in-product
                        guidance only.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        For implementation details, rollout questions, or issues with Steward, you can:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        <li>
                          Visit the{" "}
                          <Button variant="link" size="sm" className="px-0 h-auto align-baseline">
                            Product Docs
                          </Button>
                        </li>
                        <li>Contact support via your Steward onboarding channel.</li>
                        <li>Share feedback directly with the team during your implementation sessions.</li>
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="audit" className="mt-0 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Audit & Logs</CardTitle>
                      <CardDescription>
                        A complete, immutable record of what Steward and humans did, when, and to which
                        assets. If you do not review this, operations continue, but you may miss valuable
                        traceability for approvals and publishing.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <AuditLogsSettings />
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showUnsavedConfirm} onOpenChange={setShowUnsavedConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in Settings. If you close now, those changes will be discarded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleKeepEditing}>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={handleDiscardChanges}
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

