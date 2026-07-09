import { createFileRoute, redirect } from "@tanstack/react-router";
import { ROUTE_TO_VIEW } from "@/lib/steward-routes";
import { StewardAppRoot } from "./index";

export const Route = createFileRoute("/app/$view")({
  beforeLoad: ({ params }) => {
    const view = ROUTE_TO_VIEW[params.view];
    if (!view) {
      throw redirect({ to: "/app" });
    }
  },
  component: StewardAppRoot,
});
