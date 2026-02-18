import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import reportWebVitals from "./sdk/core/internal/reportWebVitals.ts";
import "./styles.css";

// Initialize app configuration
import { APP_CONFIG } from "./sdk/core/global.ts";
export { APP_CONFIG }; // for backward compatibility

import { isSupabaseConfigured, supabase } from "./lib/supabaseClient";

console.log("Supabase env check:", {
	url: import.meta.env.VITE_SUPABASE_URL,
	hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
});
console.log("Supabase client:", supabase);

// Global error handlers
window.addEventListener("error", (event) => {
	console.error("Global error event:", event);
});

window.addEventListener("unhandledrejection", (event) => {
	console.error("Unhandled promise rejection:", event.reason);
});

// Create a QueryClient instance
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000, // 5 minutes
			gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

// Create a new router instance
let router: ReturnType<typeof createRouter>;
try {
	router = createRouter({
		routeTree,
		context: {},
		defaultPreload: "intent",
		scrollRestoration: true,
		defaultStructuralSharing: true,
		defaultPreloadStaleTime: 0,
		basepath: import.meta.env.TENANT_ID ? `/${import.meta.env.TENANT_ID}` : "/",
	});
} catch (error) {
	console.error("Router creation error:", error);
	throw error;
}

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

// Render the app or configuration warning
const rootElement = document.getElementById("app");

if (!rootElement) {
	throw new Error("Root element #app not found in DOM");
}

// Clear any existing content before rendering
if (rootElement.innerHTML) {
	rootElement.innerHTML = "";
}

const root = ReactDOM.createRoot(rootElement);

if (!isSupabaseConfigured) {
	root.render(
		<div
			style={{
				fontFamily:
					"system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
				padding: "2rem",
				maxWidth: "640px",
				margin: "0 auto",
				lineHeight: 1.5,
			}}
		>
			<h1
				style={{
					fontSize: "1.75rem",
					fontWeight: 600,
					marginBottom: "0.75rem",
				}}
			>
				Missing Supabase configuration
			</h1>
			<p style={{ marginBottom: "0.75rem" }}>
				The app could not initialize Supabase because required environment
				variables are not set.
			</p>
			<p style={{ marginBottom: "0.75rem" }}>
				Please configure <code>VITE_SUPABASE_URL</code> and{" "}
				<code>VITE_SUPABASE_ANON_KEY</code> in your environment (for example in
				Vercel project settings) and redeploy.
			</p>
			<p>
				For local development, set these in a <code>.env</code> file at the
				project root based on <code>.env.example</code>.
			</p>
		</div>,
	);
} else {
	try {
		root.render(
			<StrictMode>
				<QueryClientProvider client={queryClient}>
					<RouterProvider router={router} />
				</QueryClientProvider>
			</StrictMode>,
		);
	} catch (error) {
		console.error("root.render error:", error);
		throw error;
	}
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
