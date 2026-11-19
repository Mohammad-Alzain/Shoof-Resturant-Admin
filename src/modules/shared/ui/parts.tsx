import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Infinity as InfinityIcon, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { shortDate } from "@/modules/shared/core/format";
import { JobKind, JobStatus, useQuota, type IJob } from "@/modules/Generation/core/api";

/** A button that opens the file dialog and hands back a validated file (type and size are checked here, the server re-checks). */
export function FilePickButton({
  accept,
  maxMB = 5,
  onPick,
  label,
  busy,
  disabled,
  variant = "outline",
  size = "md",
  className,
}: {
  accept: string;
  maxMB?: number;
  onPick: (file: File) => void;
  label: string;
  busy?: boolean;
  disabled?: boolean;
  variant?: "outline" | "primary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLInputElement>(null);
  const exts = accept.split(",").map((x) => x.trim().toLowerCase());
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          const ext = "." + (f.name.split(".").pop() ?? "").toLowerCase();
          if (!exts.includes(ext)) return void toast.error(t("file_type_not_accepted", { name: f.name }));
          if (f.size > maxMB * 1024 * 1024) return void toast.error(t("file_too_large", { name: f.name, size: maxMB }));
          onPick(f);
        }}
      />
      <Button type="button" variant={variant} size={size} disabled={disabled || busy} onClick={() => ref.current?.click()} className={className}>
        {busy ? <Loader2 className="animate-spin" /> : <Upload />}
        {label}
      </Button>
    </>
  );
}

const STATUS: Record<number, { key: string; variant: "secondary" | "info" | "success" | "destructive" | "warning" }> = {
  [JobStatus.Pending]: { key: "job_queued", variant: "warning" },
  [JobStatus.Processing]: { key: "job_generating", variant: "info" },
  [JobStatus.Ready]: { key: "val_ready", variant: "success" },
  [JobStatus.Failed]: { key: "val_failed", variant: "destructive" },
  [JobStatus.Cancelled]: { key: "val_cancelled", variant: "secondary" },
};

/** Queued / Generating / Ready / Failed / Cancelled; a queued job also shows its place in the restaurant's queue. */
export function JobBadge({ job }: { job: Pick<IJob, "status" | "queuePosition"> }) {
  const { t } = useTranslation();
  const s = STATUS[job.status] ?? STATUS[0];
  return (
    <Badge variant={s.variant} appearance="light" size="md" className="gap-1 whitespace-nowrap">
      {job.status === JobStatus.Processing && <Loader2 className="size-3 animate-spin" />}
      {t(s.key)}
      {job.status === JobStatus.Pending && job.queuePosition ? <span className="opacity-70">#{job.queuePosition}</span> : null}
    </Badge>
  );
}

export const KindLabel = ({ kind }: { kind: JobKind }) => {
  const { t } = useTranslation();
  return <span className="whitespace-nowrap text-sm">{kind === JobKind.Image ? t("job_kind_image") : t("job_kind_model")}</span>;
};

/** "Today: 12 left · This month: 340 left · Extra credits: 50 (expire 30 Dec)", as meters. */
export function QuotaStrip({ className, compact }: { className?: string; compact?: boolean }) {
  const { t, i18n } = useTranslation();
  const q = useQuota();
  if (q.isLoading) return <div className={cn("h-12 animate-pulse rounded-xl bg-muted", className)} />;
  if (!q.data) return null;
  const d = q.data;
  const cell = (label: string, v?: number | null) => (
    <div className="min-w-0">
      <p className="text-[0.6875rem] font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 flex items-center gap-1 font-display text-lg font-semibold leading-none tabular-nums text-foreground">
        {v === null || v === undefined ? <InfinityIcon className="size-5 text-terracotta" aria-label={t("unlimited")} /> : v.toLocaleString(i18n.language)}
      </p>
    </div>
  );
  return (
    <div className={cn("flex flex-wrap items-center gap-x-7 gap-y-2 rounded-xl border border-border bg-card px-4 py-2.5", compact && "py-2", className)}>
      {cell(t("quota_today"), d.dailyRemaining)}
      {cell(t("quota_month"), d.monthlyRemaining)}
      <div className="min-w-0">
        <p className="text-[0.6875rem] font-medium text-muted-foreground">{t("quota_credits")}</p>
        <p className="mt-0.5 font-display text-lg font-semibold leading-none tabular-nums text-foreground">
          {d.extraCreditsRemaining.toLocaleString(i18n.language)}
          {d.extraCreditsRemaining > 0 && d.extraCreditsNearestExpiryUtc && (
            <span className="ms-1.5 font-sans text-[0.6875rem] font-normal text-muted-foreground">
              {t("expires")} {shortDate(d.extraCreditsNearestExpiryUtc, i18n.language)}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

/** Empty state with an icon, a sentence and (optionally) the next action. */
export function EmptyState({ icon: Icon, title, hint, action }: { icon: React.ComponentType<{ className?: string }>; title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </span>
      <p className="font-medium text-foreground">{title}</p>
      {hint && <p className="max-w-sm text-sm text-muted-foreground">{hint}</p>}
      {action}
    </div>
  );
}
