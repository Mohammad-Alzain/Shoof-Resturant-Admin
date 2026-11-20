"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { LayoutGroup, motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Layers, Sparkles, Store, Users, UtensilsCrossed, type LucideIcon } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { checkIsActive } from "@/helpers/RouterHelpers";
import { filterByPermission, flatRoutes, type RouteI } from "@/routes/routes";
import useAuthStore from "@/modules/Auth/core/store/AuthStore";
import { useDrawer } from "@/hooks/DrawerProvider/useDrawer";
import { cn } from "@/lib/utils";

const BASE_PATH = "/dashboard";
const fullHref = (href: string) =>
  `${BASE_PATH}${href.startsWith("/") ? href : `/${href}`}`.replace(/\/$/, "");
const EASE = [0.16, 1, 0.3, 1] as const;

/** Each section owns a spice hue on the burgundy rail (wayfinding): terracotta, ochre, rose, slate. */
const GROUP_HUES: Record<string, string> = {
  nav_menu: "var(--rail-menu)",
  nav_generation: "var(--rail-ai)",
  nav_restaurant: "var(--rail-restaurant)",
  nav_team: "var(--rail-team)",
};

/** One drawn icon per sidebar section (keys are the `titleOfGroup` values in routes). */
const GROUP_ICONS: Record<string, LucideIcon> = {
  nav_menu: UtensilsCrossed,
  nav_generation: Sparkles,
  nav_restaurant: Store,
  nav_team: Users,
};

interface NavGroup {
  key: string;
  label?: string;
  items: RouteI[];
}

/** Routes carry `titleOfGroup` on the first item of each section; the items after it belong to that section. */
const toGroups = (links: RouteI[]): NavGroup[] => {
  const groups: NavGroup[] = [];
  for (const link of links) {
    if (link.titleOfGroup || !groups.length)
      groups.push({
        key: link.titleOfGroup ?? "main",
        label: link.titleOfGroup,
        items: [],
      });
    groups[groups.length - 1].items.push(link);
  }
  return groups;
};

/**
 * Expanded: icon + label rows on a soft pill, with a marker in the section's spice hue at the start edge of the active row.
 * Collapsed (icon rail): a centred 40px square per item; the active one is filled with the action colour.
 * One shared pill (`layoutId`) slides between rows so the sidebar always shows where you are.
 */
export function NavMain() {
  const { permissions } = useAuthStore();
  const { closeDrawer } = useDrawer();
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const [closed, setClosed] = useState<Record<string, boolean>>({});

  const groups = useMemo(
    () =>
      toGroups(
        filterByPermission(flatRoutes, permissions).filter(
          (r) => r.isRootRoute && !r.hideInSide,
        ),
      ),
    [permissions],
  );

  const onNavigate = () => {
    closeDrawer();
    if (isMobile) setOpenMobile(false);
  };

  if (!groups.length) {
    return (
      <p className="px-3 py-6 text-center text-xs text-sidebar-foreground group-data-[collapsible=icon]:hidden">
        {t("no_menu_items")}
      </p>
    );
  }

  return (
    <LayoutGroup id="sidebar-nav">
      <nav className="flex flex-col gap-0.5 pb-2" aria-label={t("main_navigation")}>
        {groups.map((group, gi) => {
          const isOpen = collapsed || !group.label || !closed[group.key];
          const GroupIcon = GROUP_ICONS[group.key] ?? Layers;
          const hue = GROUP_HUES[group.key] ?? "var(--sidebar-oil)";
          const groupActive = group.items.some((r) => checkIsActive(pathname, fullHref(r.href), { strict: r.href === "/" }));
          return (
            <section key={group.key} className="flex w-full min-w-0 flex-col overflow-hidden" style={{ "--hue": hue } as CSSProperties}>
              {group.label && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setClosed((c) => ({ ...c, [group.key]: !c[group.key] }))}
                    aria-expanded={isOpen}
                    tabIndex={collapsed ? -1 : 0}
                    className={cn(
                      "group/head mt-4 mb-0.5 flex w-full items-center gap-3 whitespace-nowrap rounded-lg px-3 py-1.5 text-[0.8125rem] font-semibold transition-[color,background-color,opacity] duration-200 hover:bg-sidebar-accent/30 hover:text-sidebar-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0",
                      groupActive ? "text-sidebar-strong" : "text-sidebar-foreground/70",
                    )}
                  >
                    {/* the section's spice hue marks its head: a bare icon on the same column as the items' icons */}
                    <GroupIcon aria-hidden className="size-[17px] shrink-0 text-(--hue)" strokeWidth={2} />
                    <span className="min-w-0 flex-1 truncate text-start">{t(group.label)}</span>
                    <ChevronDown className={cn("size-3.5 shrink-0 opacity-70 transition-transform duration-200", !isOpen && "-rotate-90 rtl:rotate-90")} />
                  </button>
                  {gi > 0 && <span aria-hidden className="pointer-events-none absolute inset-x-0 top-2 mx-auto h-px w-[calc(100%-1rem)] bg-sidebar-border transition-[width] duration-300 group-data-[collapsible=icon]:w-5" />}
                </div>
              )}

              <motion.div
                initial={false}
                animate={{
                  height: isOpen ? "auto" : 0,
                  opacity: isOpen ? 1 : 0,
                }}
                transition={{ duration: 0.22, ease: EASE }}
                className="overflow-hidden"
              >
                <SidebarMenu className="w-full min-w-0 gap-0.5 py-0.5">
                  {group.items.map((route, i) => {
                    const href = fullHref(route.href);
                    const active = checkIsActive(pathname, href, {
                      strict: route.href === "/",
                    });
                    const Icon = route.icon;
                    return (
                      <SidebarMenuItem
                        key={route.href}
                        className="relative list-none"
                      >
                        <motion.div
                          className="w-full min-w-0"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: Math.min((gi * 5 + i) * 0.018, 0.35),
                            duration: 0.4,
                            ease: EASE,
                          }}
                        >
                          <SidebarMenuButton
                            asChild
                            isActive={active}
                            tooltip={t(route.title || "")}
                            className={cn(
                              "group/nav relative h-10 gap-3 rounded-lg px-3 text-[0.875rem] font-medium text-sidebar-foreground",
                              "hover:bg-transparent hover:text-sidebar-strong data-[active=true]:bg-transparent data-[active=true]:font-semibold data-[active=true]:text-sidebar-strong",
                              "transition-colors duration-300 group-data-[collapsible=icon]:data-[active=true]:text-sidebar",
                            )}
                          >
                            <Link to={href} onClick={onNavigate}>
                              {active ? (
                                <motion.span
                                  layoutId="nav-pill"
                                  aria-hidden
                                  className="absolute inset-0 rounded-lg bg-sidebar-accent transition-colors duration-300 group-data-[collapsible=icon]:bg-sidebar-strong group-data-[collapsible=icon]:shadow-[0_6px_16px_-6px_rgb(0_0_0/0.5)]"
                                  transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 40,
                                  }}
                                >
                                  <span className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-(--hue) group-data-[collapsible=icon]:hidden" />
                                </motion.span>
                              ) : (
                                <span
                                  aria-hidden
                                  className="absolute inset-0 rounded-lg bg-sidebar-accent/0 transition-colors duration-150 group-hover/nav:bg-sidebar-accent/60"
                                />
                              )}
                              {Icon && (
                                <Icon
                                  strokeWidth={active ? 2.2 : 1.9}
                                  className={cn(
                                    "relative size-[19px]! shrink-0 transition-[transform,color] duration-200 group-hover/nav:scale-110",
                                    active && "text-(--hue) group-data-[collapsible=icon]:text-sidebar",
                                  )}
                                />
                              )}
                              <span className="relative min-w-0 flex-1 truncate whitespace-nowrap text-start transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">
                                {t(route.title || "")}
                              </span>
                            </Link>
                          </SidebarMenuButton>
                        </motion.div>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </motion.div>
            </section>
          );
        })}
      </nav>
    </LayoutGroup>
  );
}
