import { supabase } from "../lib/supabaseClient";

export async function getCurrentUser() {
	if (!supabase) {
		throw new Error("Supabase client not initialized");
	}

	const { data, error } = await supabase.auth.getUser();
	if (error) throw error;
	return data.user; // null if not logged in
}
