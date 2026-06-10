/**
 * Hand-maintained Supabase row types for tables the frontend reads directly.
 * Billing state is read-only on the client; writes happen via backend
 * service-role code (Stripe webhooks) only.
 */

export type SubscriptionPlanType = "free" | "basic" | "pro_expert" | "agency";

export type SubscriptionStatus =
	| "inactive"
	| "trialing"
	| "active"
	| "past_due"
	| "canceled"
	| "unpaid"
	| "incomplete"
	| "incomplete_expired"
	| "paused";

export interface SubscriptionRow {
	id: string;
	organization_id: string;
	stripe_customer_id: string | null;
	stripe_subscription_id: string | null;
	stripe_price_id: string | null;
	plan_type: SubscriptionPlanType | string;
	status: SubscriptionStatus | string;
	current_period_start: string | null;
	current_period_end: string | null;
	cancel_at_period_end: boolean;
	metadata: Record<string, unknown>;
	created_at: string;
	updated_at: string;
}
