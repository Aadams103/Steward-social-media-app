import { supabase } from "../lib/supabaseClient";

export async function loginWithEmail(email: string, password: string) {
	if (!supabase) {
		throw new Error("Supabase client not initialized");
	}

	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) throw error;
	return data;
}
