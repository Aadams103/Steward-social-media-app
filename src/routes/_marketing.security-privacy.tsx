import { createFileRoute } from "@tanstack/react-router";
import { SecurityPrivacyPage } from "@/pages/marketing/SecurityPrivacyPage";

export const Route = createFileRoute("/_marketing/security-privacy")({
  component: SecurityPrivacyPage,
});
