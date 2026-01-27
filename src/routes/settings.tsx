import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy /settings route.
// Settings now live in the in-app overlay; redirects back to the main app.
export const Route = createFileRoute("/settings")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
