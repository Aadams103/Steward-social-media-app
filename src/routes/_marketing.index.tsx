import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/pages/marketing/LandingPage";

export const Route = createFileRoute("/_marketing/")({
  component: LandingPage,
});
