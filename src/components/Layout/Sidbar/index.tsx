"use client";

import React from "react";
import { Outlet, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { AppSidebar } from "./app-sidebar";
import Header from "./Header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

/** Each page eases in from slightly below; the shell (sidebar, header) never re-animates. */
function AnimatedOutlet() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <motion.div key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
      <Outlet />
    </motion.div>
  );
}

function Layout() {
  const { t } = useTranslation();
  return (
    <SidebarProvider defaultOpen className="bg-page">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-100 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        {t("a11y_skip_to_content")}
      </a>
      <AppSidebar />
      <SidebarInset className="canvas-card min-w-0">
        <Header />
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto focus:outline-none">
          <div className="mx-auto w-full max-w-[1600px] p-4 md:p-6 lg:p-8">
            <AnimatedOutlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default React.memo(Layout);
