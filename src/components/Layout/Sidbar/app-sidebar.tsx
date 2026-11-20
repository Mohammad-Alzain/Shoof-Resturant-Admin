"use client";

import type * as React from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { NavMain } from "./nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import useAuthStore from "@/modules/Auth/core/store/AuthStore";
import { Wordmark } from "@/components/common/Brand";
import { useCurrentRestaurant } from "@/modules/shared/core/restaurant";
import { cn } from "@/lib/utils";

/** Labels fade out with the rail instead of popping: the container (overflow hidden) clips them as the width shrinks. */
const FADE = "transition-opacity duration-200 ease-out group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0";

const initialsOf = (name?: string, email?: string) => {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2)).toUpperCase();
};

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { state, isMobile } = useSidebar();
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const { auth, logOutAction } = useAuthStore();
  const collapsed = state === "collapsed" && !isMobile;
  const user = auth?.user;
  const { restaurant } = useCurrentRestaurant();

  const signOut = async () => {
    await logOutAction();
    navigate({ to: "/login" });
  };

  return (
    <Sidebar
      side={i18n.dir() === "rtl" ? "right" : "left"}
      collapsible="icon"
      variant="inset"
      className="text-sidebar-foreground"
      {...props}
    >
      {/* Nothing here changes layout when the rail collapses: the width animates and labels fade, so icons never jump. */}
      <SidebarHeader className="h-16 justify-center overflow-hidden px-2 py-0">
        <Link to="/dashboard" className="flex items-center gap-2.5 px-1" aria-label={t("app_name")}>
          {restaurant?.logoUrl ? (
            <img src={restaurant.logoUrl} alt="" className="size-9 shrink-0 rounded-full bg-sidebar-strong object-cover ring-2 ring-sidebar-oil/70" />
          ) : (
            <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-sidebar-oil font-display text-base font-semibold text-sidebar-primary-foreground shadow-[inset_0_0_0_3px_rgb(255_255_255/0.35)]">
              {(restaurant?.name ?? "S").trim().charAt(0).toUpperCase()}
            </span>
          )}
          <span className={cn("flex min-w-0 flex-col leading-none whitespace-nowrap", FADE)}>
            <span className="truncate text-[0.9375rem] font-semibold text-sidebar-strong">{restaurant?.name ?? t("restaurant")}</span>
            <span className="mt-1.5 flex items-center gap-1.5 text-[0.6875rem] font-medium text-sidebar-foreground">
              <Wordmark className="h-[11px] text-brand-ivory" />
              {t("super_admin")}
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden px-2 py-2">
        <NavMain />
      </SidebarContent>

      <SidebarFooter className="overflow-hidden p-1.5">
        <div className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent p-1.5 transition-[background-color,border-color] duration-300 group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent">
          <Avatar className="size-9 shrink-0 ring-2 ring-sidebar-border">
            <AvatarFallback className="bg-sidebar-strong text-xs font-semibold text-sidebar-primary-foreground">
              {initialsOf(user?.name ?? user?.fullName, user?.email)}
            </AvatarFallback>
          </Avatar>
          <div className={cn("min-w-0 flex-1 whitespace-nowrap", FADE)}>
            <p className="truncate text-[0.8125rem] font-semibold leading-tight text-sidebar-strong">
              {user?.name || user?.fullName || t("account")}
            </p>
            <p className="truncate text-xs text-sidebar-foreground">{user?.email}</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={signOut}
                aria-label={t("logout")}
                tabIndex={collapsed ? -1 : 0}
                className={cn("flex size-8 shrink-0 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-strong", FADE)}
              >
                <LogOut className="size-4 rtl:-scale-x-100" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{t("logout")}</TooltipContent>
          </Tooltip>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
