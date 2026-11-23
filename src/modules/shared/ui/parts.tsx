import { motion } from "motion/react";
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

/**
 * "Today: 12 left · This month: 340 left · Extra credits: 50 (expire 30 Dec)", as one hairline-ruled strip: the same
 * ledger the dashboard uses, so a quota reads the same wherever generation can be started.
 */
export function QuotaStrip({ className, compact }: { className?: string; compact?: boolean }) {
  const { t, i18n } = useTranslation();
  const q = useQuota();
  if (q.isLoading) return <div className={cn("h-16 animate-pulse rounded-2xl bg-muted", className)} />;
  if (!q.data) return null;
  const d = q.data;
  const n = (v: number) => v.toLocaleString(i18n.language);
  const cell = (label: string, value: React.ReactNode, note?: React.ReactNode, low?: boolean) => (
    <div className={cn("flex min-w-0 flex-col gap-1 border-s border-border px-4 first:border-s-0", compact ? "py-2" : "py-3")}>
      <span className="text-[0.6875rem] font-medium text-muted-foreground">{label}</span>
      <span className={cn("flex items-baseline gap-1.5 font-display text-xl font-semibold leading-none tabular-nums", low ? "text-terracotta" : "text-foreground")}>
        {value}
        {note && <span className="truncate font-sans text-[0.6875rem] font-normal text-muted-foreground">{note}</span>}
      </span>
    </div>
  );
  const left = (v?: number | null) => (v === null || v === undefined ? <InfinityIcon className="size-5 text-terracotta" aria-label={t("unlimited")} /> : n(v));
  return (
    <div className={cn("grid grid-cols-3 overflow-hidden rounded-2xl border border-border bg-card shadow-card", className)}>
      {cell(t("quota_today"), left(d.dailyRemaining), d.dailyRemaining != null ? t("souk_left") : undefined, d.dailyRemaining === 0)}
      {cell(t("quota_month"), left(d.monthlyRemaining), d.monthlyRemaining != null ? t("souk_left") : undefined, d.monthlyRemaining === 0)}
      {cell(
        t("quota_credits"),
        n(d.extraCreditsRemaining),
        d.extraCreditsRemaining > 0 && d.extraCreditsNearestExpiryUtc ? `${t("expires")} ${shortDate(d.extraCreditsNearestExpiryUtc, i18n.language)}` : undefined,
      )}
    </div>
  );
}

/** Empty state with an icon, a sentence and (optionally) the next action. */
export function EmptyState({ icon: Icon, title, hint, action }: { icon: React.ComponentType<{ className?: string }>; title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
      <span className="relative grid size-16 place-items-center rounded-full border border-border bg-card text-primary shadow-card">
        <span aria-hidden className="absolute inset-1.5 rounded-full border border-terracotta/40" />
        <Icon className="size-6" />
      </span>
      <p className="font-medium text-foreground">{title}</p>
      {hint && <p className="max-w-sm text-sm text-muted-foreground">{hint}</p>}
      {action}
    </div>
  );
}

/** `usage` is a quota being spent (terracotta, the brand's mark for consumption); `accent` is plain progress. */
export type Tone = "accent" | "usage" | "warning" | "danger" | "good";
const TONE_VAR: Record<Tone, string> = { accent: "var(--meter)", usage: "var(--terracotta)", warning: "var(--warning)", danger: "var(--destructive)", good: "var(--success)" };
/** Severity of a share that is "used up": calm below 80%, warning to 100%, danger at or past it. */
export const usageTone = (ratio: number): Tone => (ratio >= 1 ? "danger" : ratio >= 0.8 ? "warning" : "accent");

/**
 * One share of a whole (dataviz "meter"): the fill carries the tone and anchors to the reading start (right in Arabic),
 * the track is a lighter step of the same colour so the state reads across the whole bar.
 */
export function Meter({ value, tone = "accent", label, thin }: { value: number; tone?: Tone; label: string; thin?: boolean }) {
  const pct = Math.max(0, Math.min(1, value));
  const color = TONE_VAR[tone];
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct * 100)}
      className={cn("relative w-full overflow-hidden rounded-full", thin ? "h-1" : "h-2")}
      style={{ backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)` }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct > 0 ? Math.max(pct * 100, 2) : 0}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-y-0 start-0 rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

