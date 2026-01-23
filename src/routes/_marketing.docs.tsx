import { createFileRoute } from "@tanstack/react-router";
import { DocsPage } from "@/pages/marketing/DocsPage";

export const Route = createFileRoute("/_marketing/docs")({
  component: DocsPage,
});
