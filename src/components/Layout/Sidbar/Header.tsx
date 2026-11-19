"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumbs } from "../Header/Breadcrumbs";
import { CommandPalette } from "../Header/CommandPalette";
import { NotificationBell } from "../Header/NotificationBell";
import { LanguageSwitcher } from "../Header/LanguageSwitcher";
import { ThemeToggle } from "../Header/ThemeToggle";
import { UserMenu } from "../Header/UserMenu";
import { RestaurantSwitcher } from "../Header/RestaurantSwitcher";

function Header() {
  return (
    <header className="z-40 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:px-6">
      <SidebarTrigger className="-ms-1 text-muted-foreground hover:text-foreground" />
      <div className="h-5 w-px bg-border" aria-hidden />
      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>
      <div className="flex items-center gap-1">
        <RestaurantSwitcher />
        <CommandPalette />
        <div className="mx-1 hidden h-5 w-px bg-border md:block" aria-hidden />
        <NotificationBell />
        <LanguageSwitcher />
        <ThemeToggle />
        <div className="ms-2">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

export default Header;
