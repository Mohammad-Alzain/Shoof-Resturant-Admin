import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CopyButton } from "@/components/common/CopyButton";
import { cn } from "@/lib/utils";

/** Pretty-prints JSON when the text is JSON; anything else is shown as it is. */
export const prettyBody = (raw: string | null | undefined): { text: string; json: boolean } => {
  if (!raw) return { text: "", json: false };
  try {
    const parsed = JSON.parse(raw);
    if (parsed !== null && typeof parsed === "object") return { text: JSON.stringify(parsed, null, 2), json: true };
  } catch {
    /* not JSON */
  }
  return { text: raw, json: false };
};

/**
 * A read-only block of code or payload: monospace, left-to-right, scrollable, with a copy button.
 * The text is rendered as text, never as HTML.
 */
export function CodeBlock({ title, value, className, maxHeight = "18rem" }: { title: string; value: string | null | undefined; className?: string; maxHeight?: string }) {
  const { t } = useTranslation();
  const body = useMemo(() => prettyBody(value), [value]);
  return (
    <section className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-border bg-muted/50 px-3.5 py-2">
        <h4 className="text-xs font-semibold text-foreground">
          {title}
          {body.json && <span className="ms-2 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[0.625rem] font-medium text-primary">JSON</span>}
        </h4>
        {body.text && <CopyButton value={body.text} label={`${t("copy")}: ${title}`} />}
      </header>
      {body.text ? (
        <pre dir="ltr" style={{ maxHeight }} className="overflow-auto whitespace-pre-wrap break-all p-3.5 text-start font-mono text-xs leading-relaxed text-foreground">
          {body.text}
        </pre>
      ) : (
        <p className="px-3.5 py-4 text-xs text-muted-foreground">{t("empty_body")}</p>
      )}
    </section>
  );
}
