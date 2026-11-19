import { createRoute, Navigate, redirect, useRouterState } from "@tanstack/react-router";
import { dashboardUrl } from "@/helpers";
import { allows } from "@/modules/Auth/core/permissions";
import { landingHref } from "./routes";
import { RootRoute } from "../App";
import Layout from "@/components/Layout/Sidbar";
import { getDirection } from "@/Translation/i18n";
import useAuthStore from "@/modules/Auth/core/store/AuthStore";

export const DashboardRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/dashboard",
  component: DashboardComponent,
  beforeLoad: ({ context }: { context: any }) => {
    const auth = context?.auth?.auth;
    if (!auth) throw redirect({ to: "/login" });
    if (auth.mustChangePassword) throw redirect({ to: "/change-password" });
  },
});

function DashboardComponent() {
  const auth = useAuthStore((s) => s.auth);
  const permissions = useAuthStore((s) => s.permissions);
  const fetching = useAuthStore((s) => s.permissionsIsFetching);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (!auth) return <Navigate to="/login" />;
  if (auth.mustChangePassword) return <Navigate to="/change-password" />;
  // The home page may be off limits: land on the first page the user can open instead of a 404.
  if (!fetching && /^\/dashboard\/?$/.test(pathname) && !allows(permissions, "RestaurantDashboard.View")) {
    return <Navigate to={dashboardUrl(landingHref(permissions)) as never} replace />;
  }
  return (
    <div dir={getDirection()}>
      <Layout />
    </div>
  );
}
