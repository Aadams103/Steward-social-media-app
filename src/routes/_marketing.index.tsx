import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/pages/marketing/HomePage";

export const Route = createFileRoute("/_marketing/")({
  component: HomePage,
});
