import { createFileRoute } from "@tanstack/react-router";
import type { FileRoutesByPath } from "@tanstack/react-router";
import { AuthPage } from "@/pages/Auth";

export const Route = createFileRoute("/auth/" as keyof FileRoutesByPath)({
  component: AuthPage,
});

