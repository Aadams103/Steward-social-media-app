import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, User, Building2, Shield, CreditCard, Plug, FileText } from "lucide-react";
import { MyBrandSettings } from "./MyBrandSettings";
import { MyStewardSettings } from "./MyStewardSettings";
import { ProfileSettings } from "./ProfileSettings";
import { AccountSettings } from "./AccountSettings";
import { SecuritySettings } from "./SecuritySettings";
import { BillingSettings } from "./BillingSettings";
import { IntegrationsSettings } from "./IntegrationsSettings";
import { AuditLogsSettings } from "./AuditLogsSettings";

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile, organization, brand system, and Steward AI persona.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden lg:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="my-brand" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden lg:inline">My Brand</span>
          </TabsTrigger>
          <TabsTrigger value="my-steward" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden lg:inline">My Steward</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden lg:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden lg:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden lg:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Plug className="h-4 w-4" />
            <span className="hidden lg:inline">Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden lg:inline">Audit & Logs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="my-brand" className="space-y-6">
          <MyBrandSettings />
        </TabsContent>

        <TabsContent value="my-steward" className="space-y-6">
          <MyStewardSettings />
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <AccountSettings />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <BillingSettings />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <IntegrationsSettings />
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <AuditLogsSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
