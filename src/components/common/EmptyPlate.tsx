import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

/**
 * The console's empty state: an empty plate seen from above, its two "eyes" (the Shoof mark's pupils) looking up at the
 * reader, waiting to be filled. Used wherever a list has nothing to show, in place of a generic sad face.
 */
export function EmptyPlate({ title, hint, action, className, size = 88 }: { title?: string; hint?: string; action?: React.ReactNode; className?: string; size?: number }) {
  const { t } = useTranslation();
  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 py-12 text-center", className)}>
      <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden className="text-muted-foreground">
        <circle cx="60" cy="62" r="52" fill="var(--card)" stroke="var(--border)" strokeWidth="1.5" />
        <circle cx="60" cy="62" r="49" fill="none" stroke="var(--terracotta)" strokeWidth="2" opacity="0.55" />
        <circle cx="60" cy="62" r="36" fill="var(--muted)" stroke="var(--border)" strokeWidth="1" />
        <g className="empty-plate-eyes" fill="var(--primary)">
          <circle cx="50" cy="58" r="3.6" />
          <circle cx="70" cy="58" r="3.6" />
        </g>
        <path d="M51 74c5 3.2 13 3.2 18 0" fill="none" stroke="var(--primary)" strokeWidth="2.4" strokeLinecap="round" opacity="0.35" />
      </svg>
      <p className="font-medium text-foreground">{title ?? t("empty_plate_title")}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{hint ?? t("empty_plate_hint")}</p>
      {action}
    </div>
  );
}
