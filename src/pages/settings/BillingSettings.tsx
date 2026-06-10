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
import { billingApi } from "@/sdk/services/api-services";

type CheckoutPlanType = "basic" | "pro_expert" | "agency";

interface PricingPlan {
  /** Plan id sent to the billing API. */
  checkoutPlan: CheckoutPlanType;
  /** Existing app-level plan this maps to (for current-plan detection). */
  appPlan: BillingPlan;
  name: string;
  description: string;
  priceLabel: string;
  features: string[];
  recommended?: boolean;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    checkoutPlan: "basic",
    appPlan: "starter",
    name: "Basic",
    description: "For solo operators with light scheduling needs.",
    priceLabel: "$29/mo",
    features: [
      "10 connected accounts",
      "150 scheduled posts/month",
      "AI content generation",
      "Autopilot (basic)",
      "2 brand profiles",
    ],
  },
  {
    checkoutPlan: "pro_expert",
    appPlan: "professional",
    name: "Pro Expert",
    description: "AI Autopilot, multi-platform strategy, advanced automation.",
    priceLabel: "$99/mo",
    recommended: true,
    features: [
      "25 connected accounts",
      "500 scheduled posts/month",
      "Full AI Autopilot",
      "Bulk scheduling",
      "Advanced analytics",
      "Custom approval workflows",
      "5 brand profiles",
    ],
  },
  {
    checkoutPlan: "agency",
    appPlan: "enterprise",
    name: "Agency",
    description: "Multiple brands, team workflows, higher limits.",
    priceLabel: "$299/mo",
    features: [
      "Unlimited connected accounts",
      "Unlimited scheduled posts",
      "Unlimited brand profiles",
      "Team workflows",
      "API access & white label",
      "Priority support",
    ],
  },
];

/** Ranking for "Manage Plan" vs "Subscribe" labels. */
const PLAN_RANK: Record<BillingPlan, number> = {
  free: 0,
  starter: 1,
  professional: 2,
  enterprise: 3,
};

export function BillingSettings() {
  const { currentOrganization, quotaUsage } = useAppStore();

  const [loadingPlan, setLoadingPlan] = React.useState<CheckoutPlanType | null>(null);

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
  const billingIsActive = currentOrganization.billingStatus === "active" || currentOrganization.billingStatus === "trialing";

  const handleSubscribe = async (plan: PricingPlan) => {
    if (loadingPlan) return;
    setLoadingPlan(plan.checkoutPlan);
    try {
      const origin = window.location.origin;
      const result = await billingApi.createCheckoutSession({
        organizationId: currentOrganization.id,
        planType: plan.checkoutPlan,
        successUrl: `${origin}/settings/billing?checkout=success`,
        cancelUrl: `${origin}/settings/billing?checkout=canceled`,
      });

      // The backend returns a Stripe-hosted Checkout URL.
      // (redirectToCheckout was removed from current @stripe/stripe-js.)
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      toast.error("Could not start checkout. Please try again.");
    } catch (error) {
      console.error("Checkout session creation failed:", error);
      toast.error("Could not start checkout. Please try again or contact support.");
    } finally {
      setLoadingPlan(null);
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

  const getButtonLabel = (plan: PricingPlan): string => {
    if (plan.appPlan === currentPlan) return "Current Plan";
    if (billingIsActive && PLAN_RANK[currentPlan] > PLAN_RANK[plan.appPlan]) return "Manage Plan";
    return "Subscribe";
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

      {/* Pricing */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {PRICING_PLANS.map((plan) => {
          const isCurrent = plan.appPlan === currentPlan;
          const isLoading = loadingPlan === plan.checkoutPlan;
          const buttonLabel = getButtonLabel(plan);

          return (
            <Card
              key={plan.checkoutPlan}
              className={plan.recommended ? "border-primary shadow-sm relative" : "relative"}
            >
              {plan.recommended && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  Recommended
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{plan.name}</span>
                  <span className="text-base font-semibold text-muted-foreground">
                    {plan.priceLabel}
                  </span>
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <ul className="space-y-1.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={isCurrent ? "outline" : plan.recommended ? "default" : "secondary"}
                  disabled={isCurrent || loadingPlan !== null}
                  aria-disabled={isCurrent || loadingPlan !== null}
                  onClick={() => handleSubscribe(plan)}
                >
                  {isLoading ? "Redirecting to checkout…" : buttonLabel}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
                {isNearLimit && !isUnlimited && (
                  <p className="text-xs text-muted-foreground">
                    You're close to your limit. Upgrade your plan to increase it.
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>
            View and download your invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Invoices will appear here after your first paid billing cycle.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
