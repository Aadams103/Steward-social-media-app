import { supabase } from "../lib/supabaseClient";

export async function getMyProfile() {
	if (!supabase) {
		throw new Error("Supabase client not initialized");
	}

	const { data: userRes, error: userErr } = await supabase.auth.getUser();
	if (userErr) throw userErr;
	if (!userRes.user) return null;

	const { data, error } = await supabase
		.from("profiles")
		.select("*")
		.eq("id", userRes.user.id)
		.single();

	if (error) throw error;
	return data;
}
