"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Toaster as Sonner, toast, useSonner } from "sonner";
import { useTheme } from "@/Providers/Theme";
import { getDirection } from "@/Translation/i18n";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const EDGE = 16;
const CHIP = 40; // room the "clear all" pill takes above the stack

/** Shown above the stack once there are two or more toasts: one click dismisses them all. */
function ClearAll({ count }: { count: number }) {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {count > 1 && (
        <motion.button
          key="clear-all"
          type="button"
          initial={{ opacity: 0, x: "-50%", y: -8, scale: 0.96 }}
          animate={{ opacity: 1, x: "-50%", y: 0, scale: 1 }}
          exit={{ opacity: 0, x: "-50%", y: -8, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => toast.dismiss()}
          className="fixed left-1/2 top-4 z-[999999999] inline-flex items-center gap-1.5 rounded-full border border-border bg-popover/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-lg backdrop-blur-sm transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <X className="size-3.5" />
          {t("clear_all")}
          <span className="rounded-full bg-muted px-1.5 tabular-nums text-muted-foreground">{count}</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/**
 * Notifications slide in at the top centre (out of the way of the sidebar and the page actions), stack and fan out on
 * hover, can be swiped away or closed one by one, and a "clear all" pill appears when several pile up.
 * Follows the console theme and the reading direction.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();
  const { toasts } = useSonner();
  const visible = toasts.filter((x) => !x.delete).length;
  return (
    <>
      <ClearAll count={visible} />
      <Sonner
        theme={resolvedTheme as ToasterProps["theme"]}
        dir={getDirection()}
        position="top-center"
        offset={{ top: visible > 1 ? EDGE + CHIP : EDGE }}
        mobileOffset={{ top: visible > 1 ? 12 + CHIP : 12 }}
        visibleToasts={4}
        closeButton
        gap={10}
        swipeDirections={["top", "left", "right"]}
        className="group toaster [&_[data-type=success]>[data-icon]]:text-success [&_[data-type=info]>[data-icon]]:text-info [&_[data-type=warning]>[data-icon]]:text-warning [&_[data-type=error]>[data-icon]]:text-destructive [&_[data-type=error]_[data-title]]:text-destructive"
        toastOptions={{
          duration: 4500,
          classNames: {
            toast:
              "group toast group-[.toaster]:rounded-xl! group-[.toaster]:bg-popover! group-[.toaster]:text-foreground! group-[.toaster]:border-border! group-[.toaster]:shadow-[0_14px_34px_-12px_rgb(0_0_0/0.35)]! has-[[role=alert]]:border-0! has-[[role=alert]]:shadow-none! has-[[role=alert]]:bg-transparent!",
            title: "font-medium",
            description: "group-[.toast]:text-muted-foreground!",
            closeButton:
              "group-[.toast]:bg-popover! group-[.toast]:border-border! group-[.toast]:text-muted-foreground! hover:group-[.toast]:text-foreground!",
            actionButton: "group-[.toast]:rounded-md! group-[.toast]:bg-primary! group-[.toast]:text-primary-foreground!",
            cancelButton: "group-[.toast]:rounded-md! group-[.toast]:bg-secondary! group-[.toast]:text-secondary-foreground!",
          },
        }}
        {...props}
      />
    </>
  );
};

export { Toaster };
