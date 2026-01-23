import { createFileRoute } from "@tanstack/react-router";
import { PricingPage } from "@/pages/marketing/PricingPage";

export const Route = createFileRoute("/_marketing/pricing")({
  component: PricingPage,
});
