import { AccountDisabledScreen, StaleDataSync } from "./components/Layout/AccountDisabledScreen";
import { lazy, Suspense, useState, useEffect } from "react";
import {
  Navigate,
  NotFoundRoute,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { MotionConfig } from "motion/react";
import { Toaster } from "@/components/ui/sonner";
import "./Translation/i18n";
import { DashboardRoute } from "./routes/dashboard";
import { PrivateRoutes } from "./routes/Private_routes";

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
// import { ThemeProvider } from "./Providers/Theme";
import NiceModal from "@ebay/nice-modal-react";
import i18n from "./Translation/i18n";

import SplashScreen from "./components/common/ui/SplashScreen";
import useAuthStore from "./modules/Auth/core/store/AuthStore";
import { LoginRoute } from "./modules/Auth/ui/pages/login";
import { ChangePasswordRoute } from "./modules/Auth/ui/pages/ChangePasswordRoute";
import { ResetPasswordRoute } from "./modules/Auth/ui/pages/ResetPasswordRoute";
import { AuthInit } from "./Providers/AuthInit";
import { DrawerProvider } from "./hooks/DrawerProvider";
import { ThemeProvider } from "./Providers/Theme";
const DevTools = lazy(() =>
  import("@tanstack/react-router-devtools").then((m) => ({
    default: m.TanStackRouterDevtools,
  })),
);
import ErrorBoundaryPage from "./components/common/pages/ErrorBoundaryPage";
import NotFoundPage from "./components/common/pages/NotFoundPage";

export const BaseRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/",
  component: BaseRouteComponent,
});
function BaseRouteComponent() {
  return <Navigate to="/dashboard" />;
}

export const RootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <DevTools />
        </Suspense>
      )}
    </>
  ),
  errorComponent: ErrorBoundaryPage,
  notFoundComponent: NotFoundPage,
});

function InnerApp({ router }) {
  const auth = useAuthStore();
  return <RouterProvider router={router} context={{ auth }} />;
}

function App() {
  // A record opened by its own URL (/users/99999, /exams/list/12/edit) that the
  // API answers with 404 shows the 404 page instead of an empty form.
  const [notFound, setNotFound] = useState(false);
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (count, error: any) =>
              (!error?.response || error.response.status >= 500) && count < 2,
          },
        },
        queryCache: new QueryCache({
          onError: (error: any, query) => {
            const id = String(query.queryKey?.[1] ?? "");
            if (
              error?.response?.status === 404 &&
              query.queryKey.length === 2 &&
              /^\d+$/.test(id) &&
              window.location.pathname.split("/").includes(id)
            ) {
              setNotFound(true);
            }
          },
        }),
      }),
  );
  const [router, setRouter] = useState<any>(null);
  // A new route tree (the permissions arrived or changed) needs a freshly mounted RouterProvider: swapping routers in place renders nothing.
  const [routerVersion, setRouterVersion] = useState(0);

  // Signing out must not leave the previous operator's data in memory for the next sign-in.
  useEffect(
    () =>
      useAuthStore.subscribe((state, prev) => {
        if (prev.auth && !state.auth) client.clear();
      }),
    [client],
  );

  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const permissions = useAuthStore((s) => s.permissions);

  // Refresh the operator profile once per page load.
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    const notFoundRoute = new NotFoundRoute({
      getParentRoute: () => RootRoute,
      component: NotFoundPage,
    });

    const routeTree = RootRoute.addChildren([
      BaseRoute,
      LoginRoute,
      ResetPasswordRoute,
      ChangePasswordRoute,
      DashboardRoute.addChildren(PrivateRoutes(DashboardRoute, permissions)),
    ]);

    setRouterVersion((v) => v + 1);
    setRouter(
      createRouter({
        routeTree,
        notFoundRoute,
        basepath: import.meta.env.BASE_URL.replace(/\/$/, ""),
        context: { auth: useAuthStore.getState() },
      } as any),
    );
  }, [permissions]);

  // Leaving the broken URL clears the 404 page.
  useEffect(() => {
    if (!router || !notFound) return;
    return router.history.subscribe(() => setNotFound(false));
  }, [router, notFound]);

  if (!router) {
    return <SplashScreen />; // Or any loading indicator
  }

  return (
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <MotionConfig reducedMotion="never">
          <NiceModal.Provider>
            <DrawerProvider>
              <AuthInit>
                <Toaster />
                <StaleDataSync />
                <AccountDisabledScreen />
                {/* <Toaster reverseOrder={false} /> */}
                {notFound ? <NotFoundPage /> : <InnerApp key={routerVersion} router={router} />}
              </AuthInit>
            </DrawerProvider>
          </NiceModal.Provider>
          </MotionConfig>
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export default App;
