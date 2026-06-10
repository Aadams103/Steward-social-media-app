/**
 * Stripe.js loader for the frontend.
 * Uses the publishable key only — never put secret keys in VITE_* vars.
 */

import { loadStripe, type Stripe } from "@stripe/stripe-js";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

export const isStripeConfigured = Boolean(publishableKey);

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Returns a memoized Stripe.js instance, or null when
 * VITE_STRIPE_PUBLISHABLE_KEY is not configured.
 */
export function getStripe(): Promise<Stripe | null> {
	if (!publishableKey) {
		console.warn("⚠️ VITE_STRIPE_PUBLISHABLE_KEY not configured; Stripe checkout unavailable");
		return Promise.resolve(null);
	}
	if (!stripePromise) {
		stripePromise = loadStripe(publishableKey);
	}
	return stripePromise;
}
