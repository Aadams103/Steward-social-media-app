import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'_authenticated.tsx:8',message:'AuthenticatedLayout render',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  // Determine page title and banner visibility based on current route
  // This will be enhanced as we add more routes
  const showBrandBanner = true; // Show on risky pages
  
  return (
    <AppShell showBrandBanner={showBrandBanner}>
      <Outlet />
    </AppShell>
  );
}
