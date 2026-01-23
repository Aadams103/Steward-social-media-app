import { createFileRoute } from "@tanstack/react-router";
import { HowItWorksPage } from "@/pages/marketing/HowItWorksPage";

export const Route = createFileRoute("/_marketing/how-it-works")({
  component: HowItWorksPage,
});
