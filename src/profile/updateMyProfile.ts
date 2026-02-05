import { supabase } from "../lib/supabaseClient";

type ProfileUpdate = {
	username?: string;
	display_name?: string;
	avatar_url?: string;
	bio?: string;
};

export async function updateMyProfile(update: ProfileUpdate) {
	const { data: userRes, error: userErr } = await supabase.auth.getUser();
	if (userErr) throw userErr;
	if (!userRes.user) throw new Error("Not logged in");

	const { data, error } = await supabase
		.from("profiles")
		.update(update)
		.eq("id", userRes.user.id)
		.select("*")
		.single();

	if (error) throw error;
	return data;
}
