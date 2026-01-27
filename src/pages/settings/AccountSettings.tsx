import * as React from "react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  UserPlus,
  Trash2,
  Mail,
  Shield,
  Eye,
  Edit,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import type { OrganizationRole } from "@/types/app";
import { USER_ROLES } from "@/types/app";

export function AccountSettings() {
  const { 
    currentOrganization, 
    updateOrganization,
    organizationMembers,
    setOrganizationMembers,
    removeOrganizationMember,
  } = useAppStore();

  const [isSaving, setIsSaving] = React.useState(false);
  const [orgName, setOrgName] = React.useState(currentOrganization?.name || "");
  const [billingContact, setBillingContact] = React.useState("");
  const [defaultTimezone, setDefaultTimezone] = React.useState(
    currentOrganization?.settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [defaultLocale, setDefaultLocale] = React.useState("en-US");

  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<OrganizationRole>("member");
  const [isInviting, setIsInviting] = React.useState(false);

  React.useEffect(() => {
    if (currentOrganization) {
      setOrgName(currentOrganization.name);
      setDefaultTimezone(currentOrganization.settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }, [currentOrganization]);

  const handleSave = async () => {
    if (!currentOrganization) return;

    setIsSaving(true);
    try {
      updateOrganization({
        name: orgName,
        settings: {
          ...currentOrganization.settings,
          timezone: defaultTimezone,
        },
      });
      toast.success("Organization settings saved successfully");
    } catch (error) {
      toast.error("Failed to save organization settings");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail || !currentOrganization) return;

    setIsInviting(true);
    try {
      // TODO: Implement invite API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const newMember = {
        id: `member-${Date.now()}`,
        organizationId: currentOrganization.id,
        userId: `user-${Date.now()}`,
        email: inviteEmail,
        displayName: inviteEmail.split("@")[0],
        role: inviteRole,
        invitedAt: new Date(),
      };
      setOrganizationMembers([...organizationMembers, newMember]);
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setInviteRole("member");
    } catch (error) {
      toast.error("Failed to send invitation");
      console.error(error);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the organization?`)) {
      return;
    }

    try {
      removeOrganizationMember(memberId);
      toast.success("Member removed");
    } catch (error) {
      toast.error("Failed to remove member");
      console.error(error);
    }
  };

  const getRoleIcon = (role: OrganizationRole) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "member":
        return <Users className="h-4 w-4" />;
      case "viewer":
        return <Eye className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: OrganizationRole) => {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (!currentOrganization) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No organization found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Organization Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Information
          </CardTitle>
          <CardDescription>
            Manage your organization's basic information and default settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Your organization name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-contact" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Billing Contact Email
            </Label>
            <Input
              id="billing-contact"
              type="email"
              value={billingContact}
              onChange={(e) => setBillingContact(e.target.value)}
              placeholder="billing@example.com"
            />
            <p className="text-sm text-muted-foreground">
              Email address for billing notifications and invoices.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="default-timezone">Default Time Zone</Label>
            <Input
              id="default-timezone"
              value={defaultTimezone}
              onChange={(e) => setDefaultTimezone(e.target.value)}
              placeholder="America/New_York"
            />
            <p className="text-sm text-muted-foreground">
              Default timezone for the organization. Individual users can override this in their profile.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-locale">Default Locale</Label>
            <Input
              id="default-locale"
              value={defaultLocale}
              onChange={(e) => setDefaultLocale(e.target.value)}
              placeholder="en-US"
            />
            <p className="text-sm text-muted-foreground">
              Default language/locale for the organization.
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Management
          </CardTitle>
          <CardDescription>
            Invite team members and manage their roles and permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invite User */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Team Member
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as OrganizationRole)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="viewer">Viewer</option>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <Button onClick={handleInviteUser} disabled={isInviting || !inviteEmail}>
              {isInviting ? "Sending..." : "Send Invitation"}
            </Button>
          </div>

          <Separator />

          {/* Team Members List */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Team Members</h3>
            {organizationMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No team members yet</p>
            ) : (
              <div className="space-y-2">
                {organizationMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(member.role)}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{member.displayName}</p>
                            <Badge variant={getRoleBadgeVariant(member.role)}>
                              {member.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                          {member.lastActiveAt && (
                            <p className="text-xs text-muted-foreground">
                              Last active: {new Date(member.lastActiveAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.role !== "owner" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id, member.displayName)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role & Access Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Role & Access Summary</CardTitle>
          <CardDescription>
            Overview of roles and their permissions in your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {USER_ROLES.map((role) => (
              <div key={role.id} className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {getRoleIcon(role.id as OrganizationRole)}
                  <h4 className="font-medium">{role.label}</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Permissions: {role.permissions.join(", ")}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
