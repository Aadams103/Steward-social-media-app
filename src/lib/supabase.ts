import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

export { supabase, isSupabaseConfigured };

export function getSupabaseClient(): SupabaseClient | null {
	if (!isSupabaseConfigured || !supabase) {
		console.warn("⚠️ Supabase URL or Anon Key not configured");
		return null;
	}

	return supabase;
}
