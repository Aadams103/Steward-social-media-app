import * as React from "react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  CreditCard, 
  Receipt, 
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { PLAN_QUOTAS, type BillingPlan } from "@/types/app";

export function BillingSettings() {
  const { currentOrganization, quotaUsage } = useAppStore();

  const [isUpgrading, setIsUpgrading] = React.useState(false);

  if (!currentOrganization) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No organization found.</p>
      </div>
    );
  }

  const currentPlan = currentOrganization.billingPlan;
  const planQuotas = PLAN_QUOTAS[currentPlan];
  const orgQuotas = quotaUsage.filter((q) => q.organizationId === currentOrganization.id);

  const handleUpgrade = async (newPlan: BillingPlan) => {
    setIsUpgrading(true);
    try {
      // TODO: Implement upgrade API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`Upgraded to ${newPlan} plan`);
    } catch (error) {
      toast.error("Failed to upgrade plan");
      console.error(error);
    } finally {
      setIsUpgrading(false);
    }
  };

  const getStatusBadge = () => {
    switch (currentOrganization.billingStatus) {
      case "active":
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </Badge>
        );
      case "past_due":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Past Due
          </Badge>
        );
      case "canceled":
        return (
          <Badge variant="secondary" className="gap-1">
            <XCircle className="h-3 w-3" />
            Canceled
          </Badge>
        );
      case "trialing":
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Trialing
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Subscription
          </CardTitle>
          <CardDescription>
            Your current billing plan and subscription status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold capitalize">{currentPlan} Plan</h3>
                {getStatusBadge()}
              </div>
              {currentOrganization.trialEndsAt && (
                <p className="text-sm text-muted-foreground">
                  Trial ends: {new Date(currentOrganization.trialEndsAt).toLocaleDateString()}
                </p>
              )}
            </div>
            {currentPlan !== "enterprise" && (
              <Button onClick={() => handleUpgrade("enterprise")} disabled={isUpgrading}>
                Upgrade
              </Button>
            )}
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-2">Plan Features</h4>
            <div className="space-y-1">
              {planQuotas.enabledFeatures.length > 0 ? (
                planQuotas.enabledFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="capitalize">{feature.replace("_", " ")}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No premium features enabled</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Usage Limits
          </CardTitle>
          <CardDescription>
            Current usage against your plan limits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {orgQuotas.map((quota) => {
            const percentage = quota.limit === -1 ? 0 : (quota.used / quota.limit) * 100;
            const isUnlimited = quota.limit === -1;
            const isNearLimit = percentage >= 80;

            return (
              <div key={quota.metric} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="capitalize">
                    {quota.metric.replace("_", " ")}
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {quota.used} {isUnlimited ? "" : `of ${quota.limit}`}
                  </span>
                </div>
                {!isUnlimited && (
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        isNearLimit ? "bg-destructive" : "bg-primary"
                      }`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                )}
                {isUnlimited && (
                  <p className="text-xs text-muted-foreground">Unlimited</p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>
            Manage your payment method and billing information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5" />
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/25</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Update
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Invoices
          </CardTitle>
          <CardDescription>
            View and download your billing history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Invoice #12345</p>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString()} • $99.00
                </p>
              </div>
              <Button variant="outline" size="sm">
                Download
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Invoice #12344</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString()} • $99.00
                </p>
              </div>
              <Button variant="outline" size="sm">
                Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
