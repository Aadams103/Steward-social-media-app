import { createFileRoute, Outlet } from "@tanstack/react-router";
import { MarketingLayout } from "@/pages/marketing/MarketingLayout";

export const Route = createFileRoute("/_marketing")({
  component: MarketingLayout,
});
