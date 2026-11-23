import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * A figure whose digits roll into place like a counter drum, in the UI's own numerals. Each digit is a column of 0-9
 * that slides to its value; the final value is the resting state, so a still frame (or reduced motion) reads correctly.
 */
export function RollingNumber({ value, className }: { value: number; className?: string }) {
  const { i18n } = useTranslation();
  const still = useReducedMotion();
  const text = Math.round(value).toLocaleString(i18n.language, { useGrouping: false });
  const glyphs = Array.from({ length: 10 }, (_, d) => d.toLocaleString(i18n.language));
  return (
    <span dir="ltr" className={cn("inline-flex overflow-hidden leading-[1.1]", className)} aria-label={text} role="img">
      {[...text].map((ch, i) => {
        const d = glyphs.indexOf(ch);
        if (d < 0) return <span key={i} aria-hidden>{ch}</span>;
        return (
          <span key={i} aria-hidden className="relative inline-block h-[1.1em] overflow-hidden">
            <span className="invisible block h-[1.1em] leading-[1.1]">{ch}</span>
            <motion.span
              className="absolute inset-x-0 top-0 flex flex-col"
              initial={{ y: still ? `${-d * 10}%` : "0%" }}
              animate={{ y: `${-d * 10}%` }}
              transition={{ duration: still ? 0 : 1.1 + i * 0.15, ease: EASE, delay: still ? 0 : 0.1 }}
            >
              {glyphs.map((g) => (
                <span key={g} className="block h-[1.1em] text-center leading-[1.1]">{g}</span>
              ))}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}

export type Ticket = {
  key: string;
  n: number;
  label: string;
  href: string;
  search?: Record<string, unknown>;
  /** where the ticket leads, named ("Open Drinks", "Open the jobs") */
  cta: string;
  /** what exactly is waiting: the failed dishes and why, the emptiest categories */
  lines?: { title: string; note?: string }[];
  icon: React.ComponentType<{ className?: string }>;
  tone: "warn" | "bad" | "info";
};

/**
 * The day's work hung as order tickets on a kitchen rail, most urgent first: each ticket names the job, how many, and
 * opens where it gets done. A failure is marked hot. With nothing to do, a single ticket is stamped done.
 */
export function TicketRail({ items }: { items: Ticket[] }) {
  const { t, i18n } = useTranslation();
  const still = useReducedMotion();
  const n = (v: number) => v.toLocaleString(i18n.language);
  const swing = (i: number) =>
    still
      ? {}
      : {
          initial: { rotate: -5, y: -8, opacity: 0 },
          animate: { rotate: [-5, 2.5, -1, 0], y: 0, opacity: 1 },
          transition: { duration: 1.3, ease: "easeOut" as const, delay: 0.25 + i * 0.08 },
        };

  return (
    <section aria-labelledby="rail-title" className="min-w-0">
      <header className="mb-1 flex items-baseline justify-between gap-4">
        <h2 id="rail-title" className="font-display text-base font-semibold text-foreground">{t("attention_title")}</h2>
        {items.length > 0 && <span className="text-xs text-muted-foreground">{t("souk_tickets_open", { n: n(items.length) })}</span>}
      </header>
      <div className="souk-rail">
        <span aria-hidden className="souk-rail-bar" />
        <ul className="souk-tickets">
          {items.length === 0 ? (
            <motion.li className="souk-ticket" {...swing(0)}>
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CheckCircle2 className="size-4 text-success" aria-hidden />
                {t("attention_clear")}
              </span>
              <motion.span
                className="souk-stamp"
                initial={still ? false : { scale: 2.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 16, delay: still ? 0 : 1 }}
              >
                {t("souk_done")}
              </motion.span>
            </motion.li>
          ) : (
            items.map((it, i) => (
              <motion.li key={it.key} className={cn("souk-ticket", it.tone === "bad" && "souk-ticket--hot")} {...swing(i)}>
                <Link to={it.href as never} search={it.search as never} className="group/tk flex h-full flex-col gap-1.5 outline-none">
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0 text-sm font-semibold leading-snug text-foreground">{it.label}</span>
                    <it.icon className={cn("mt-0.5 size-4 shrink-0", it.tone === "bad" ? "text-destructive" : "text-muted-foreground")} />
                  </span>
                  {it.lines?.length ? (
                    <span className="flex flex-col gap-1 border-t border-dashed border-border pt-1.5">
                      {it.lines.map((l, j) => (
                        <span key={j} className="min-w-0">
                          <span className="block truncate text-xs font-medium text-foreground">{l.title}</span>
                          {l.note && <span className="line-clamp-2 text-[0.6875rem] leading-snug text-muted-foreground">{l.note}</span>}
                        </span>
                      ))}
                    </span>
                  ) : null}
                  <span className="mt-auto flex items-end justify-between gap-3 pt-2">
                    <span className={cn("font-display text-[1.75rem] font-semibold leading-none tabular-nums", it.tone === "bad" ? "text-destructive" : "text-foreground")}>{n(it.n)}</span>
                    <span className="inline-flex min-w-0 items-center gap-1 text-xs font-semibold text-primary group-hover/tk:underline">
                      <span className="truncate">{it.cta}</span>
                      <ArrowUpRight className="size-3.5 shrink-0 rtl:-scale-x-100" aria-hidden />
                    </span>
                  </span>
                </Link>
              </motion.li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
