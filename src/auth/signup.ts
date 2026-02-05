import { supabase } from "../lib/supabaseClient";

export async function signUpWithEmail(
	email: string,
	password: string,
	displayName?: string,
) {
	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			data: displayName ? { name: displayName } : undefined,
		},
	});

	if (error) throw error;
	return data;
}
