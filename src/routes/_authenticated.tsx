import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  // Determine page title and banner visibility based on current route
  // This will be enhanced as we add more routes
  const showBrandBanner = true; // Show on risky pages
  
  return (
    <AppShell showBrandBanner={showBrandBanner}>
      <Outlet />
    </AppShell>
  );
}
