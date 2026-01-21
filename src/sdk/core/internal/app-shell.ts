import { useCallback, useRef } from "react";

/**
 * Simplified event handler wrapper that just passes through the callback
 * without reporting to parent window (legacy integration removed)
 */
export function useDelegatedComponentEventHandler<T extends unknown[]>(
	callback: ((...args: T) => void) | null | undefined,
	_infoGetter?: (...args: T) => unknown,
	_element?: HTMLElement | null,
) {
	const lastCallback = useRef(callback);
	lastCallback.current = callback;

	const delegatedCallback = useCallback((...args: T) => {
		if (typeof lastCallback.current === "function") {
			lastCallback.current(...args);
		}
	}, []);

	return delegatedCallback;
}

/**
 * Report UI element error (simplified, just logs to console)
 */
export function reportElementError(
	element: HTMLElement | null,
	error: unknown,
	info?: Record<string, unknown>,
) {
	const errorObj = error instanceof Error ? error : new Error(String(error));
	console.error("Element error:", {
		error: errorObj.message,
		stack: errorObj.stack,
		element,
		...info,
	});
}

/**
 * Report error (simplified, just logs to console)
 */
export function reportError(
	error: unknown,
	info?: Record<string, unknown>,
) {
	const errorObj = error instanceof Error ? error : new Error(String(error));
	console.error("Error:", {
		error: errorObj.message,
		stack: errorObj.stack,
		...info,
	});
}

// Global error handlers (simplified, just log)
window.addEventListener("unhandledrejection", (event) => {
	console.error("Unhandled promise rejection:", event.reason);
});

window.addEventListener("error", (event) => {
	console.error("Global error:", event.error);
});

/**
 * Hook for reporting messages (no-op, kept for compatibility)
 */
export function useReportToParentWindow() {
	return {
		reportParent: () => {
			// No-op: legacy integration removed
		},
	};
}

/**
 * Utility function to send a message (no-op, kept for compatibility)
 */
export function reportToParentWindow(_message: unknown): void {
	// No-op: legacy integration removed
}
