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

import { supabase } from "./lib/supabaseClient";
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

// Render the app
const rootElement = document.getElementById("app");
if (rootElement) {
	// Clear any existing content before rendering
	if (rootElement.innerHTML) {
		rootElement.innerHTML = "";
	}
	const root = ReactDOM.createRoot(rootElement);
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
} else {
	throw new Error("Root element #app not found in DOM");
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
