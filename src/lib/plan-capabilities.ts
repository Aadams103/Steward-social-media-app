/**
 * Single source of truth for plan capabilities and plan-name mapping.
 *
 * Two naming schemes coexist:
 * - App/database plans (organizations.billing_plan): free/starter/professional/enterprise
 * - Checkout/display plans (Stripe, pricing UI): Basic/Pro Expert/Agency
 *
 * Use these helpers instead of scattering plan checks across components.
 */

import { PLAN_QUOTAS, type BillingPlan, type PlanFeature, type PlanQuotas } from "@/types/app";

export type CheckoutPlanType = "basic" | "pro_expert" | "agency";

export const CHECKOUT_PLAN_TO_APP_PLAN: Record<CheckoutPlanType, BillingPlan> = {
	basic: "starter",
	pro_expert: "professional",
	agency: "enterprise",
};

export const APP_PLAN_TO_CHECKOUT_PLAN: Partial<Record<BillingPlan, CheckoutPlanType>> = {
	starter: "basic",
	professional: "pro_expert",
	enterprise: "agency",
};

/** Customer-facing names for app-level plans. */
export const PLAN_DISPLAY_NAMES: Record<BillingPlan, string> = {
	free: "Free",
	starter: "Basic",
	professional: "Pro Expert",
	enterprise: "Agency",
};

const PLAN_ORDER: BillingPlan[] = ["free", "starter", "professional", "enterprise"];

export function getPlanRank(plan: BillingPlan): number {
	return PLAN_ORDER.indexOf(plan);
}

export function getPlanQuotas(plan: BillingPlan): PlanQuotas {
	return PLAN_QUOTAS[plan];
}

/** Whether a plan includes a given feature. */
export function hasFeature(plan: BillingPlan, feature: PlanFeature): boolean {
	return PLAN_QUOTAS[plan].enabledFeatures.includes(feature);
}

/** Brand profile limit for a plan (-1 = unlimited). */
export function getBrandLimit(plan: BillingPlan): number {
	return PLAN_QUOTAS[plan].maxBrandProfiles;
}

/** Whether the org can create another brand profile on this plan. */
export function canAddBrand(plan: BillingPlan, currentBrandCount: number): boolean {
	const limit = getBrandLimit(plan);
	return limit === -1 || currentBrandCount < limit;
}

/** The cheapest plan that unlocks a feature, or null if no plan has it. */
export function minimumPlanForFeature(feature: PlanFeature): BillingPlan | null {
	for (const plan of PLAN_ORDER) {
		if (hasFeature(plan, feature)) return plan;
	}
	return null;
}

export const FEATURE_LABELS: Record<PlanFeature, string> = {
	autopilot: "Autopilot",
	ai_content_generation: "AI Content Generation",
	bulk_scheduling: "Bulk Scheduling",
	analytics_advanced: "Advanced Analytics",
	custom_approval_workflows: "Custom Approval Workflows",
	api_access: "API Access",
	white_label: "White Label",
	priority_support: "Priority Support",
};

/** e.g. "Upgrade to Pro Expert to unlock Autopilot." */
export function getUpgradeMessage(feature: PlanFeature): string {
	const minPlan = minimumPlanForFeature(feature);
	const planName = minPlan ? PLAN_DISPLAY_NAMES[minPlan] : "a paid plan";
	return `Upgrade to ${planName} to unlock ${FEATURE_LABELS[feature]}.`;
}
