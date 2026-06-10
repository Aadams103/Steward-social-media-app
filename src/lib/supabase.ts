import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { SubscriptionRow } from "@/types/supabase";

export { supabase, isSupabaseConfigured };

export function getSupabaseClient(): SupabaseClient | null {
	if (!isSupabaseConfigured || !supabase) {
		console.warn("⚠️ Supabase URL or Anon Key not configured");
		return null;
	}

	return supabase;
}

/**
 * Read-only subscription state for an organization.
 * RLS limits results to orgs the user owns or is a member of.
 * Returns null when Supabase is not configured or no subscription row exists.
 */
export async function getOrganizationSubscription(
	organizationId: string,
): Promise<SubscriptionRow | null> {
	const client = getSupabaseClient();
	if (!client) return null;

	const { data, error } = await client
		.from("subscriptions")
		.select("*")
		.eq("organization_id", organizationId)
		.maybeSingle();

	if (error) {
		console.warn("Failed to load subscription:", error.message);
		return null;
	}
	return (data as SubscriptionRow) ?? null;
}
