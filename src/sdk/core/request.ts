import { getAuthTokenAsync, isAuthenticatedSync } from "./auth";
import { getSupabaseClient } from "@/lib/supabase";

const API_BASE_PATH = import.meta.env.VITE_MCP_API_BASE_PATH;
const API_BASE_URL = import.meta.env.VITE_API_BASE_PATH || "/api";

/**
 * Normalize a base URL to be absolute.
 * If the base is already absolute (starts with http:// or https://), return it as-is.
 * If the base is relative (e.g., "/api"), convert it to an absolute URL using window.location.origin.
 */
function normalizeBase(basePath: string | undefined): string {
	if (!basePath) {
		return `${window.location.origin}/api`;
	}

	// If absolute, keep it
	if (/^https?:\/\//i.test(basePath)) {
		return basePath;
	}

	// If relative (/api), make it absolute using current origin
	const clean = basePath.startsWith("/") ? basePath : `/${basePath}`;
	return `${window.location.origin}${clean}`;
}

export interface RequestError {
	code: string;
	message: string;
	statusCode?: number;
	details?: unknown;
}

export class PlatformRequestError extends Error {
	public readonly code: string;
	public readonly statusCode?: number;
	public readonly details?: unknown;

	constructor(error: RequestError) {
		super(error.message);
		this.name = "PlatformRequestError";
		this.code = error.code;
		this.statusCode = error.statusCode;
		this.details = error.details;
	}
}

/**
 * Enhanced wrapper for `fetch` with authentication token and comprehensive error handling
 */
export async function platformRequest(
	url: string | URL | Request,
	options: RequestInit = {},
): Promise<Response> {
	// In dev mode, allow requests without auth (for local development)
	const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
	const requiresAuth = !isDev;

	// Get token: prefer Supabase session, then fall back to auth store
	let token: string | null = null;
	const supabase = getSupabaseClient();
	if (supabase) {
		const { data: { session } } = await supabase.auth.getSession();
		token = session?.access_token ?? null;
		// #region agent log
		console.log('🔑 Attaching Auth Token:', !!session?.access_token);
		// #endregion
	}
	if (!token) {
		token = await getAuthTokenAsync();
	}

	// Check authentication (skip in dev mode)
	if (requiresAuth && !token) {
		throw new PlatformRequestError({
			code: "UNAUTHENTICATED",
			message: "User is not authenticated",
		});
	}
	const method = options.method || "GET";

	const headers = new Headers(options.headers);
	if (token) {
		headers.set("Authorization", `Bearer ${token}`);
	}
	
	// Add x-brand-id header from localStorage (frontend owns brand selection)
	// Note: Store syncs to localStorage, so this is always up-to-date
	if (typeof window !== 'undefined') {
		const activeBrandId = localStorage.getItem('steward_active_brand_id');
		const brandId = activeBrandId || 'all';
		headers.set("x-brand-id", brandId);
		
		// Log in dev mode for verification (only first few requests to avoid spam)
		if (import.meta.env.DEV && Math.random() < 0.1) {
			console.log('[API Request] x-brand-id header:', brandId);
		}
	}
	if (typeof url === 'object' && url && 'headers' in url) {
		url.headers?.forEach?.((value, key) => {
			headers.set(key, value);
		});
	}
	if (!headers.has("Content-Type") && method !== "GET" && !(options.body instanceof FormData)) {
		headers.set("Content-Type", "application/json");
	}

	// Determine base URL - use API_BASE_URL for regular API calls, API_BASE_PATH for MCP
	const isMCPUrl = typeof url === "string" && url.includes("/execute-mcp");
	const rawBase = isMCPUrl ? API_BASE_PATH : API_BASE_URL;
	const baseUrl = normalizeBase(rawBase);
	
	// Build the final URL
	let realUrl: string | URL | Request;
	if (typeof url === "string") {
		const pathClean = url.startsWith("/") ? url : `/${url}`;
		realUrl = new URL(pathClean, baseUrl);
	} else {
		realUrl = url;
	}

		try {
			const response = await fetch(realUrl, {
				...options,
				headers,
			});

			// Handle error responses
		if (!response.ok) {
			let errorData: unknown = {};
			const contentType = response.headers.get("content-type");
			
			try {
				if (contentType?.includes("application/json")) {
					errorData = await response.json();
				} else {
					const text = await response.text();
					errorData = { message: text || response.statusText };
				}
			} catch {
				errorData = { message: response.statusText || "Request failed" };
			}

			const error: RequestError = {
				code: (errorData as { code?: string })?.code || `HTTP_${response.status}`,
				message: (errorData as { message?: string })?.message || response.statusText || "Request failed",
				statusCode: response.status,
				details: errorData,
			};

			// Handle specific error codes
			if (response.status === 401) {
				error.code = "UNAUTHORIZED";
				error.message = "Authentication required. Please log in again.";
			} else if (response.status === 403) {
				error.code = "FORBIDDEN";
				error.message = "You don't have permission to perform this action.";
			} else if (response.status === 404) {
				error.code = "NOT_FOUND";
				error.message = "The requested resource was not found.";
			} else if (response.status === 429) {
				error.code = "RATE_LIMITED";
				error.message = "Too many requests. Please try again later.";
			} else if (response.status >= 500) {
				error.code = "SERVER_ERROR";
				error.message = "Server error. Please try again later.";
			}

			throw new PlatformRequestError(error);
		}

		return response;
	} catch (error) {
		// Handle network errors
		if (error instanceof TypeError && error.message.includes("fetch")) {
			throw new PlatformRequestError({
				code: "NETWORK_ERROR",
				message: "Network error. Please check your connection and try again.",
				details: error,
			});
		}

		// Re-throw PlatformRequestError
		if (error instanceof PlatformRequestError) {
			throw error;
		}

		// Unknown error
		throw new PlatformRequestError({
			code: "UNKNOWN_ERROR",
			message: error instanceof Error ? error.message : "An unknown error occurred",
			details: error,
		});
	}
}

/**
 * simpler wrapper for `platformRequest` with common methods
 *
 * eg: `platformApi.get("/api/users").then(r=>r.json())`
 */
export const platformApi = {
	get: async (url: string, options?: RequestInit) => {
		return platformRequest(url, { ...options, method: "GET" });
	},

	post: async (url: string, data?: unknown, options?: RequestInit) => {
		return platformRequest(url, {
			...options,
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...options?.headers,
			},
			body: data ? JSON.stringify(data) : undefined,
		});
	},

	put: async (url: string, data?: unknown, options?: RequestInit) => {
		return platformRequest(url, {
			...options,
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				...options?.headers,
			},
			body: data ? JSON.stringify(data) : undefined,
		});
	},

	delete: async (url: string, options?: RequestInit) => {
		return platformRequest(url, { ...options, method: "DELETE" });
	},
};
