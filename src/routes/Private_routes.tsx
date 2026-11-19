// import { useAuth } from "../modules/auth/core/index"
import { RouteI, filterByPermission, flatRoutes } from "./routes";

import { Route } from "@tanstack/react-router";
import React from "react";
import { SuspensedView } from "../components/common/Suspense/topSuspense";

export const PrivateRoutes = (parent, permissions) => {
  const filteredRoutes: any[] = filterByPermission(flatRoutes, permissions);
  const privateRoutes = filteredRoutes.filter((item) => item?.isRootRoute);
  return createRoutes(privateRoutes, parent);
};

function createRoutes(routeDefinitions: RouteI[], parent?: Route): Route[] {
  return routeDefinitions.map(
    ({ path, children, Component, validateSearch }) => {
      const route: any = new Route({
        getParentRoute: () => parent,
        path,
        validateSearch,
        component: () => (
          <SuspensedView>
            <Component />
          </SuspensedView>
        ),
      });

      if (children) {
        route.addChildren(createRoutes(children, route));
        //route.addChildren(addAllChildren(children, route));
      }

      return route;
    },
  );
}
