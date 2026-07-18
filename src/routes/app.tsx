import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { identityApi } from "@/sdk/services/api-services";
import { ApiRequestError } from "@/sdk/core/api-client";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    if (!supabase) {
      throw redirect({ to: "/auth" });
    }

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      throw redirect({ to: "/auth" });
    }

    try {
      const identity = await identityApi.me();
      if (!identity.ownerAccess.allowed) throw new Error("Steward is currently owner-only.");
      sessionStorage.removeItem("steward_auth_error");
    } catch (identityError) {
      const apiError = identityError instanceof ApiRequestError ? identityError : null;
      const accessDenied = apiError?.code === "ACCESS_NOT_ALLOWED" || apiError?.statusCode === 403;
      const unauthenticated = apiError?.statusCode === 401;
      if (accessDenied || unauthenticated) await supabase.auth.signOut();
      const message = accessDenied
        ? "This private build is currently limited to the Steward owner."
        : apiError?.code === "OWNER_ACCESS_NOT_CONFIGURED" || apiError?.code === "SUPABASE_NOT_CONFIGURED"
          ? "Steward’s secure backend is not ready yet. Your account is safe; try again after deployment finishes."
          : "Steward could not verify backend access. Please try again.";
      sessionStorage.setItem("steward_auth_error", message);
      throw redirect({ to: "/auth" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  return <Outlet />;
}
