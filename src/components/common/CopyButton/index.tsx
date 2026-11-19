import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Clipboard write that also works on pages the browser treats as insecure (falls back to a hidden textarea). */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.cssText = "position:fixed;top:-1000px;opacity:0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * Small icon button that copies `value`: the icon turns into a tick for two seconds, a tooltip says what was copied,
 * and a toast confirms. `label` names the thing (it is also the accessible name).
 */
export function CopyButton({ value, label, className, silent = false }: { value: string; label: string; className?: string; silent?: boolean }) {
  const { t } = useTranslation();
  const [done, setDone] = useState(false);
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await copyText(value);
    if (!ok) {
      toast.error(t("copy_failed"));
      return;
    }
    setDone(true);
    if (!silent) toast.success(t("copied"));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDone(false), 2000);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onCopy}
          aria-label={label}
          className={cn(
            "inline-grid size-7 shrink-0 place-items-center rounded-md border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            done && "text-success hover:text-success",
            className,
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={done ? "ok" : "copy"}
              initial={{ scale: 0.5, opacity: 0, rotate: -30 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="grid place-items-center"
            >
              {done ? <Check className="size-3.5" strokeWidth={2.4} /> : <Copy className="size-3.5" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </TooltipTrigger>
      <TooltipContent>{done ? t("copied") : label}</TooltipContent>
    </Tooltip>
  );
}
