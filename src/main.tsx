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

// Global error handlers
window.addEventListener("error", (event) => {
	// #region agent log
	fetch("http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			location: "main.tsx:18",
			message: "Global error event",
			data: {
				error: event.error?.message,
				filename: event.filename,
				lineno: event.lineno,
			},
			timestamp: Date.now(),
			sessionId: "debug-session",
			runId: "init",
			hypothesisId: "A",
		}),
	}).catch(() => {});
	// #endregion
	console.error("Global error event:", event);
});

window.addEventListener("unhandledrejection", (event) => {
	// #region agent log
	fetch("http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			location: "main.tsx:22",
			message: "Unhandled promise rejection",
			data: { reason: event.reason?.toString() },
			timestamp: Date.now(),
			sessionId: "debug-session",
			runId: "init",
			hypothesisId: "A",
		}),
	}).catch(() => {});
	// #endregion
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
	// #region agent log
	fetch("http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			location: "main.tsx:39",
			message: "Router creation start",
			data: { hasRouteTree: !!routeTree, tenantId: import.meta.env.TENANT_ID },
			timestamp: Date.now(),
			sessionId: "debug-session",
			runId: "init",
			hypothesisId: "A",
		}),
	}).catch(() => {});
	// #endregion
	router = createRouter({
		routeTree,
		context: {},
		defaultPreload: "intent",
		scrollRestoration: true,
		defaultStructuralSharing: true,
		defaultPreloadStaleTime: 0,
		basepath: import.meta.env.TENANT_ID ? `/${import.meta.env.TENANT_ID}` : "/",
	});
	// #region agent log
	fetch("http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			location: "main.tsx:49",
			message: "Router creation success",
			data: { basepath: router.options.basepath },
			timestamp: Date.now(),
			sessionId: "debug-session",
			runId: "init",
			hypothesisId: "A",
		}),
	}).catch(() => {});
	// #endregion
} catch (error) {
	// #region agent log
	fetch("http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			location: "main.tsx:50",
			message: "Router creation error",
			data: { error: error instanceof Error ? error.message : String(error) },
			timestamp: Date.now(),
			sessionId: "debug-session",
			runId: "init",
			hypothesisId: "A",
		}),
	}).catch(() => {});
	// #endregion
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
// #region agent log
fetch("http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94", {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify({
		location: "main.tsx:62",
		message: "Root element check",
		data: { found: !!rootElement, hasContent: !!rootElement?.innerHTML },
		timestamp: Date.now(),
		sessionId: "debug-session",
		runId: "init",
		hypothesisId: "A",
	}),
}).catch(() => {});
// #endregion
if (rootElement) {
	// Clear any existing content before rendering
	if (rootElement.innerHTML) {
		rootElement.innerHTML = "";
	}
	const root = ReactDOM.createRoot(rootElement);
	try {
		// #region agent log
		fetch("http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				location: "main.tsx:70",
				message: "React render start",
				data: { hasRouter: !!router, hasQueryClient: !!queryClient },
				timestamp: Date.now(),
				sessionId: "debug-session",
				runId: "init",
				hypothesisId: "A",
			}),
		}).catch(() => {});
		// #endregion
		root.render(
			<StrictMode>
				<QueryClientProvider client={queryClient}>
					<RouterProvider router={router} />
				</QueryClientProvider>
			</StrictMode>,
		);
		// #region agent log
		fetch("http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				location: "main.tsx:77",
				message: "React render success",
				data: {},
				timestamp: Date.now(),
				sessionId: "debug-session",
				runId: "init",
				hypothesisId: "A",
			}),
		}).catch(() => {});
		// #endregion
	} catch (error) {
		// #region agent log
		fetch("http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				location: "main.tsx:78",
				message: "React render error",
				data: { error: error instanceof Error ? error.message : String(error) },
				timestamp: Date.now(),
				sessionId: "debug-session",
				runId: "init",
				hypothesisId: "A",
			}),
		}).catch(() => {});
		// #endregion
		console.error("root.render error:", error);
		throw error;
	}
} else {
	// #region agent log
	fetch("http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			location: "main.tsx:82",
			message: "Root element not found",
			data: {},
			timestamp: Date.now(),
			sessionId: "debug-session",
			runId: "init",
			hypothesisId: "A",
		}),
	}).catch(() => {});
	// #endregion
	throw new Error("Root element #app not found in DOM");
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
