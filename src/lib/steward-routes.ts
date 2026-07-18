/**
 * URL path ↔ activeView mapping for shareable deep links.
 */

export const STEWARD_VIEW_ROUTES: Record<string, string> = {
  dashboard: "",
  studio: "studio",
  assets: "library",
  approvals: "approvals",
  "brand-intelligence": "brand",
  "ai-activity": "ai",
  automations: "autopilot",
  calendar: "calendar",
  analytics: "analytics",
  accounts: "accounts",
  onboarding: "onboarding",
};

export const ROUTE_TO_VIEW: Record<string, string> = Object.fromEntries(
  Object.entries(STEWARD_VIEW_ROUTES).map(([view, path]) => [path || "_root", view])
);

export function viewToPath(view: string): string {
  const segment = STEWARD_VIEW_ROUTES[view];
  if (segment === undefined) return "/app";
  return segment ? `/app/${segment}` : "/app";
}

export function pathToView(pathname: string): string | null {
  const normalized = pathname.replace(/\/$/, "") || "/app";
  if (normalized === "/app") return "dashboard";
  const segment = normalized.replace(/^\/app\//, "");
  return ROUTE_TO_VIEW[segment] ?? null;
}
