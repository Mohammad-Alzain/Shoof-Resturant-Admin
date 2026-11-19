import { createRoute, Navigate, redirect } from "@tanstack/react-router";
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
  if (!auth) return <Navigate to="/login" />;
  if (auth.mustChangePassword) return <Navigate to="/change-password" />;
  return (
    <div dir={getDirection()}>
      <Layout />
    </div>
  );
}
