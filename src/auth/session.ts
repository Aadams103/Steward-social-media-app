import { supabase } from "../lib/supabaseClient";

export async function getCurrentUser() {
	const { data, error } = await supabase.auth.getUser();
	if (error) throw error;
	return data.user; // null if not logged in
}
