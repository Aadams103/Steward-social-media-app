import { supabase } from "../lib/supabaseClient";

export const PENDING_ORGANIZATION_NAME_KEY = "steward_pending_organization_name";

export async function signUpWithEmail(
	email: string,
	password: string,
	fullName?: string,
	organizationName?: string,
) {
	if (!supabase) {
		throw new Error("Supabase client not initialized");
	}

	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			emailRedirectTo:
				typeof window === "undefined"
					? undefined
					: `${window.location.origin}/auth`,
			data:
				fullName || organizationName
					? {
							full_name: fullName,
							display_name: fullName,
							organization_name: organizationName,
						}
					: undefined,
		},
	});

	if (error) throw error;
	return data;
}
