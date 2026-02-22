import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import React, { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { isSupabaseConfigured, supabase } from "./lib/supabaseClient";
import { routeTree } from "./routeTree.gen";
import { APP_CONFIG } from "./sdk/core/global.ts";
import reportWebVitals from "./sdk/core/internal/reportWebVitals.ts";
import "./styles.css";

export { APP_CONFIG };

/** Minimal crash net: catches errors before router/UI renders. Logs error + componentStack. */
class RootErrorBoundary extends React.Component<
	{ children: React.ReactNode },
	{ error?: Error; errorInfo?: React.ErrorInfo }
> {
	state = {
		error: undefined as Error | undefined,
		errorInfo: undefined as React.ErrorInfo | undefined,
	};

	static getDerivedStateFromError(error: Error) {
		return { error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("[RootErrorBoundary] error:", error);
		console.error(
			"[RootErrorBoundary] componentStack:",
			errorInfo.componentStack,
		);
		this.setState({ errorInfo });
	}

	render() {
		if (this.state.error) {
			return (
				<div
					style={{
						padding: "2rem",
						fontFamily: "system-ui",
						maxWidth: "600px",
						margin: "0 auto",
					}}
				>
					<h1>App Error</h1>
					<p>{this.state.error.message}</p>
					<pre style={{ fontSize: "12px", overflow: "auto" }}>
						{this.state.errorInfo?.componentStack || this.state.error.stack}
					</pre>
					<button type="button" onClick={() => window.location.reload()}>
						Reload
					</button>
				</div>
			);
		}
		return this.props.children;
	}
}

// Global error handlers
window.addEventListener("error", (event) => {
	console.error("Global error event:", event);
});

window.addEventListener("unhandledrejection", (event) => {
	console.error("Unhandled promise rejection:", event.reason);
});

console.log("Supabase env check:", {
	url: import.meta.env.VITE_SUPABASE_URL,
	hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
});
console.log("Supabase client:", supabase);

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000,
			gcTime: 10 * 60 * 1000,
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

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

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const rootElement = document.getElementById("app");
if (!rootElement) {
	throw new Error("Root element #app not found in DOM");
}
if (rootElement.innerHTML) {
	rootElement.innerHTML = "";
}

const root = ReactDOM.createRoot(rootElement);

const missingConfigUi = (
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
			style={{ fontSize: "1.75rem", fontWeight: 600, marginBottom: "0.75rem" }}
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
	</div>
);

root.render(
	<RootErrorBoundary>
		{isSupabaseConfigured ? (
			<StrictMode>
				<QueryClientProvider client={queryClient}>
					<RouterProvider router={router} />
				</QueryClientProvider>
			</StrictMode>
		) : (
			missingConfigUi
		)}
	</RootErrorBoundary>,
);

reportWebVitals();
