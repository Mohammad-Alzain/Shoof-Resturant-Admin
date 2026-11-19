import type { ReactNode } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * The frame every catalogue card shares: it rises in one after another, lifts on hover, dims when the record is
 * inactive, and shows its row buttons on hover / focus (always on touch screens).
 */
export function CardShell({
  index,
  active = true,
  actions,
  className,
  children,
}: {
  index: number;
  active?: boolean;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay: Math.min(index * 0.05, 0.4) }}
      className={cn(
        "group/card hover-lift relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card",
        !active && "bg-muted/40",
        className,
      )}
    >
      <div className={cn("flex h-full flex-col transition-opacity duration-300", !active && "opacity-65")}>{children}</div>
      {actions && (
        <div className="absolute end-2.5 top-2.5 z-10 flex items-center gap-0.5 rounded-xl border border-border bg-card/95 p-0.5 opacity-0 shadow-sm backdrop-blur-sm transition-opacity duration-200 focus-within:opacity-100 group-hover/card:opacity-100 pointer-coarse:opacity-100">
          {actions}
        </div>
      )}
    </motion.article>
  );
}

/** A small dot and a word: active / inactive. */
export function StatusDot({ active }: { active: boolean }) {
  const { t } = useTranslation();
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", active ? "text-success" : "text-muted-foreground")}>
      <span aria-hidden className={cn("size-1.5 rounded-full", active ? "bg-success" : "bg-muted-foreground/60")} />
      {active ? t("active") : t("inactive")}
    </span>
  );
}
