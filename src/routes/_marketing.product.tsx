import { createFileRoute } from "@tanstack/react-router";
import { ProductPage } from "@/pages/marketing/ProductPage";

export const Route = createFileRoute("/_marketing/product")({
  component: ProductPage,
});
