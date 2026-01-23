import { createFileRoute } from "@tanstack/react-router";
import { ContactPage } from "@/pages/marketing/ContactPage";

export const Route = createFileRoute("/_marketing/contact")({
  component: ContactPage,
});
