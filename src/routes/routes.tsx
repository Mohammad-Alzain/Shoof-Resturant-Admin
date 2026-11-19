import React, { lazy } from "react";
import { JSX } from "react/jsx-runtime";
import {
  Bell,
  FolderTree,
  LayoutDashboard,
  Palette,
  QrCode,
  Share2,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
  Users,
  UtensilsCrossed,
  Wheat,
  Layers,
} from "lucide-react";

export interface RouteI {
  isRootRoute: boolean;
  href: string;
  path: string;
  Component: any;
  redirect?: string;
  title?: string;
  icon?: any;
  permission?: string;
  children: RouteI[] | [];
  parent?: string;
  hideInTopbar?: boolean;
  hideInSide?: boolean;
  isSeparate?: boolean;
  category?: string;
  activeIcon?: string;
  defaultParam?: string;
  param?: string;
  titleOfGroup?: string;
  subPermission?: string;
  CustomComponent?: () => JSX.Element;
  validateSearch?: (search: Record<string, unknown>) => Record<string, unknown>;
}

const item = (r: Partial<RouteI> & Pick<RouteI, "href" | "path" | "Component" | "title">): RouteI => ({
  isRootRoute: true,
  children: [],
  ...r,
});

/**
 * `lazy` that survives a new deployment: the old hashed chunk is gone, so the import fails.
 * Reload once (guarded against loops) to pick up the new build instead of showing an error page.
 */
const lazyRetry = <T extends React.ComponentType<any>>(loader: () => Promise<{ default: T }>) =>
  lazy(async () => {
    try {
      return await loader();
    } catch (error) {
      const last = Number(sessionStorage.getItem("chunk-reload") ?? 0);
      if (Date.now() - last > 15_000) {
        sessionStorage.setItem("chunk-reload", String(Date.now()));
        window.location.reload();
        return new Promise<never>(() => undefined); // keep the splash until the reload lands
      }
      throw error;
    }
  });

/**
 * One entry per page. `titleOfGroup` prints a section label above the item in the sidebar.
 * `permission` = the permission string that unlocks the page (docs/01-restaurant-admin-portal.md); a page without one is open to everyone.
 */
export const routes: RouteI[] = [
  item({ href: "/", permission: "RestaurantDashboard.View", path: "/", title: "dashboard", icon: LayoutDashboard, Component: lazyRetry(() => import("@/modules/Dashboard/ui/pages/DashboardPage")) }),
  item({ href: "/menu/categories", permission: "MenuCategories.View", path: "menu/categories", title: "categories", titleOfGroup: "nav_menu", icon: FolderTree, Component: lazyRetry(() => import("@/modules/Menu/ui/pages/CategoriesPage")) }),
  item({ href: "/menu/items", permission: "MenuItems.View", path: "menu/items", title: "items", icon: UtensilsCrossed, Component: lazyRetry(() => import("@/modules/Menu/ui/pages/ItemsPage")) }),
  item({ href: "/menu/items/$id", permission: "MenuItems.View", path: "menu/items/$id", title: "items", icon: UtensilsCrossed, hideInSide: true, Component: lazyRetry(() => import("@/modules/Menu/ui/pages/ItemEditorPage")) }),
  item({ href: "/menu/ingredients", permission: "Ingredients.View", path: "menu/ingredients", title: "ingredients", icon: Wheat, Component: lazyRetry(() => import("@/modules/Menu/ui/pages/IngredientsPage")) }),
  item({ href: "/generation/jobs", permission: "ModelGenerationJobs.View", path: "generation/jobs", title: "generation_jobs", titleOfGroup: "nav_generation", icon: Sparkles, Component: lazyRetry(() => import("@/modules/Generation/ui/pages/JobsPage")) }),
  item({ href: "/generation/bulk", permission: "ModelGenerationJobs.Add", path: "generation/bulk", title: "bulk_generation", icon: Layers, Component: lazyRetry(() => import("@/modules/Generation/ui/pages/BulkPage")) }),
  item({ href: "/restaurant/profile", permission: "Restaurants.View", path: "restaurant/profile", title: "restaurant_profile", titleOfGroup: "nav_restaurant", icon: Store, Component: lazyRetry(() => import("@/modules/Restaurant/ui/pages/RestaurantProfilePage")) }),
  item({ href: "/restaurant/themes", permission: "MenuThemes.View", path: "restaurant/themes", title: "themes", icon: Palette, Component: lazyRetry(() => import("@/modules/Restaurant/ui/pages/ThemesPage")) }),
  item({ href: "/restaurant/social", permission: "RestaurantSocialLinks.View", path: "restaurant/social", title: "social_links", icon: Share2, Component: lazyRetry(() => import("@/modules/Restaurant/ui/pages/SocialPage")) }),
  item({ href: "/restaurant/tables", permission: "Tables.View", path: "restaurant/tables", title: "tables_qr", icon: QrCode, Component: lazyRetry(() => import("@/modules/Restaurant/ui/pages/TablesPage")) }),
  item({ href: "/team/users", permission: "AdminUsers.View", path: "team/users", title: "team_users", titleOfGroup: "nav_team", icon: Users, Component: lazyRetry(() => import("@/modules/Team/ui/pages/UsersPage")) }),
  item({ href: "/team/roles", permission: "Roles.View", path: "team/roles", title: "team_roles", icon: ShieldCheck, Component: lazyRetry(() => import("@/modules/Team/ui/pages/RolesPage")) }),
  item({ href: "/notifications", path: "notifications", title: "notifications", icon: Bell, hideInSide: true, Component: lazyRetry(() => import("@/modules/Notifications/ui/pages/NotificationsPage")) }),
  item({ href: "/profile", path: "profile", title: "my_profile", icon: UserRound, hideInSide: true, Component: lazyRetry(() => import("@/modules/Profile/ui/pages/ProfilePage")) }),
];

export const filterByPermission = (routes: RouteI[], permissions: string[]): RouteI[] => {
  const filteredRoutes: RouteI[] = [];
  for (const route of routes) {
    if (!route.permission || permissions.includes("*") || permissions.includes(route.permission)) {
      filteredRoutes.push({
        ...route,
        children: [...filterByPermission(route.children, permissions)],
      });
    }
  }
  return filteredRoutes;
};

/** Where to send a user who may not open the home page: the first page their permissions allow. */
export const landingHref = (permissions: string[]): string =>
  filterByPermission(routes, permissions).find((r) => r.isRootRoute && !r.hideInSide)?.href ?? "/notifications";

const flattenRoutes = (routes: RouteI[], parentTitle: string | null = null): RouteI[] => {
  const flat: RouteI[] = [];
  for (const route of routes) {
    flat.push({ ...route, parent: parentTitle ?? undefined });
    if (route.children) flat.push(...flattenRoutes(route.children, route.title));
  }
  return flat;
};

export const flatRoutes = flattenRoutes(routes);
