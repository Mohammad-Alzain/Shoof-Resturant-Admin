import type { ReactNode } from "react";
import { motion } from "motion/react";
import { AlertTriangle, Trash2, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { getDirection } from "@/Translation/i18n";

interface Props {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  /** The thing being acted on, shown as a chip under the title. */
  subject?: string;
  description?: ReactNode;
  confirmText: string;
  /** Red, with a trash icon: for deletions and other irreversible actions. */
  danger?: boolean;
  /** Replaces the default icon (trash / warning), e.g. a megaphone for a send confirmation. */
  icon?: LucideIcon;
  /** Calm brand colours instead of the warning amber, for a confirmation that is not a risk. */
  neutral?: boolean;
  busy?: boolean;
}

/**
 * The one confirmation dialog of the console. A clear icon, the question, the exact record, what happens, and two equal
 * buttons. Cancel has the initial focus, so Enter never deletes by accident.
 */
export function ConfirmShell({ open, onCancel, onConfirm, title, subject, description, confirmText, danger, busy, icon, neutral }: Props) {
  const { t } = useTranslation();
  const Icon = icon ?? (danger ? Trash2 : AlertTriangle);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onCancel()}>
      <DialogContent
        close={false}
        dir={getDirection()}
        className="w-[calc(100%-2rem)] max-w-[25rem] gap-0 overflow-hidden rounded-2xl border-border p-0 sm:rounded-2xl"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement).querySelector<HTMLElement>("[data-cancel]")?.focus();
        }}
      >
        <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
          <motion.span
            aria-hidden
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
            className={
              danger
                ? "relative mb-5 grid size-16 place-items-center rounded-full bg-destructive/10 text-destructive ring-8 ring-destructive/[0.06]"
                : neutral
                  ? "relative mb-5 grid size-16 place-items-center rounded-full bg-primary/10 text-primary ring-8 ring-primary/[0.05]"
                  : "relative mb-5 grid size-16 place-items-center rounded-full bg-warning/15 text-warning ring-8 ring-warning/[0.08]"
            }
          >
            <Icon className="size-7" strokeWidth={1.9} />
          </motion.span>
          <DialogTitle className="text-lg font-semibold leading-snug text-foreground">{title}</DialogTitle>
          {subject && (
            <span className="mt-3 max-w-full truncate rounded-lg border border-border bg-muted px-3 py-1.5 text-sm font-medium text-foreground" title={subject}>
              {subject}
            </span>
          )}
          <DialogDescription className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {description ?? (danger ? t("delete_irreversible") : null)}
          </DialogDescription>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-border bg-muted/50 px-6 py-4">
          <Button data-cancel variant="outline" size="lg" disabled={busy} onClick={onCancel}>
            {t("cancel")}
          </Button>
          <Button variant={danger ? "destructive" : "primary"} size="lg" isLoading={busy} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
