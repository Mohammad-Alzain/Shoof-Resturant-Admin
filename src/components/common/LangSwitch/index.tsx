import { useId } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export type Lang = "en" | "ar";

/**
 * The one language flip of the console: a two-way segmented control (English / العربية) whose pill slides between the
 * options. `invalid` marks a language whose field has an error, `filled` one that already has text.
 */
export function LangSwitch({
  value,
  onChange,
  invalid,
  filled,
  className,
  label,
}: {
  value: Lang;
  onChange: (l: Lang) => void;
  invalid?: Partial<Record<Lang, boolean>>;
  filled?: Partial<Record<Lang, boolean>>;
  className?: string;
  label?: string;
}) {
  const id = useId();
  return (
    <div role="tablist" aria-label={label} className={cn("relative inline-flex shrink-0 rounded-lg border border-border bg-muted p-0.5", className)}>
      {(["en", "ar"] as const).map((l) => {
        const on = value === l;
        return (
          <button
            key={l}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(l)}
            className={cn(
              "relative z-10 inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              on ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {on && <motion.span layoutId={`lang-pill-${id}`} aria-hidden className="absolute inset-0 -z-10 rounded-md bg-card shadow-sm" transition={{ type: "spring", stiffness: 520, damping: 38 }} />}
            {l === "en" ? "English" : "العربية"}
            {invalid?.[l] ? (
              <span aria-hidden className="size-1.5 rounded-full bg-destructive" />
            ) : filled?.[l] ? (
              <span aria-hidden className="size-1.5 rounded-full bg-success" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
