import { supabase } from "../lib/supabaseClient";

export async function signUpWithEmail(
	email: string,
	password: string,
	fullName?: string,
) {
	if (!supabase) {
		throw new Error("Supabase client not initialized");
	}

	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			data: fullName
				? { full_name: fullName, display_name: fullName }
				: undefined,
		},
	});

	if (error) throw error;
	return data;
}
