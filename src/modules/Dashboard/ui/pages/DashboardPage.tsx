import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ArrowUpRight, Box, CalendarClock, Download, FolderTree, ImageOff, Loader2, QrCode, Sparkles, Table2, UtensilsCrossed, Wheat } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import useAuthStore from "@/modules/Auth/core/store/AuthStore";
import { formatMoney } from "@/components/common/RecordView";
import { daysUntil, shortDate } from "@/modules/shared/core/format";
import { useCurrentRestaurant } from "@/modules/shared/core/restaurant";
import { downloadDashboard, useOverview } from "../../core/api";

const EASE = [0.16, 1, 0.3, 1] as const;
type To = string;

/** A number with a label, optionally a link to the screen where it can be fixed. */
function Tile({ icon: Icon, label, value, to, tone = "default", delay = 0 }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | string; to?: To; tone?: "default" | "warn" | "bad" | "good"; delay?: number }) {
  const { i18n } = useTranslation();
  const body = (
    <>
      <span className={cn("grid size-9 place-items-center rounded-xl", tone === "warn" ? "bg-warning/15 text-warning" : tone === "bad" ? "bg-destructive/10 text-destructive" : tone === "good" ? "bg-success/12 text-success" : "bg-primary/10 text-primary")}>
        <Icon className="size-[18px]" />
      </span>
      <p className="mt-3 font-display text-[1.75rem] font-semibold leading-none tabular-nums text-foreground">{typeof value === "number" ? value.toLocaleString(i18n.language) : value}</p>
      <p className="mt-1.5 flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
        {label}
        {to && <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover/tile:opacity-100 rtl:-scale-x-100" />}
      </p>
    </>
  );
  const cls = "group/tile block h-full rounded-2xl border border-border bg-card p-4 shadow-card transition-[border-color,box-shadow,transform] duration-200";
  return (
    <motion.div className="h-full" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay }}>
      {to ? (
        <Link to={to as never} className={cn(cls, "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md")}>
          {body}
        </Link>
      ) : (
        <div className={cls}>{body}</div>
      )}
    </motion.div>
  );
}

function Bar({ label, used, limit, remaining }: { label: string; used: number; limit?: number | null; remaining?: number | null }) {
  const { t, i18n } = useTranslation();
  const unlimited = limit === null || limit === undefined;
  const ratio = unlimited || !limit ? 0 : used / limit;
  const tone = ratio >= 1 ? "bg-destructive" : ratio >= 0.9 ? "bg-warning" : "bg-primary";
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span dir="ltr" className="text-xs tabular-nums text-muted-foreground">
          <b className="text-sm font-semibold text-foreground">{used.toLocaleString(i18n.language)}</b> / {unlimited ? t("unlimited") : limit!.toLocaleString(i18n.language)}
          {remaining != null && <span className="ms-2">· {t("remaining_n", { n: remaining.toLocaleString(i18n.language) })}</span>}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={limit ?? undefined}>
        <motion.div initial={{ width: 0 }} animate={{ width: unlimited ? "100%" : `${Math.min(100, Math.max(used > 0 ? 3 : 0, ratio * 100))}%` }} transition={{ duration: 0.8, ease: EASE }} className={cn("h-full rounded-full", unlimited ? "bg-terracotta/40" : tone)} />
      </div>
    </div>
  );
}

const Card = ({ title, icon: Icon, action, children, className }: { title: string; icon: React.ComponentType<{ className?: string }>; action?: React.ReactNode; children: React.ReactNode; className?: string }) => (
  <section className={cn("rounded-2xl border border-border bg-card p-5 shadow-card", className)}>
    <header className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="size-4 text-terracotta" />
        {title}
      </h2>
      {action}
    </header>
    {children}
  </section>
);

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.auth?.user);
  const { restaurant, all } = useCurrentRestaurant();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [exporting, setExporting] = useState(false);
  const params = { restaurantId: all.length > 1 ? restaurant?.id : undefined, fromDate: from || undefined, toDate: to || undefined } as Record<string, string | undefined>;
  const q = useOverview(params);
  const d = q.data;

  const exportXlsx = async () => {
    setExporting(true);
    try {
      await downloadDashboard(params);
    } catch {
      toast.error(t("unexpected_error"));
    } finally {
      setExporting(false);
    }
  };

  const sub = d?.subscription;
  const left = sub?.daysRemaining ?? daysUntil(sub?.toDate) ?? null;
  const first = (user?.fullName ?? user?.name ?? "").split(" ")[0];
  const m = d?.models.counts;

  return (
    <section className="space-y-6">
      {/* the restaurant's own header: its name leads, today's date and the work to do follow */}
      <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE }} className="relative overflow-hidden rounded-3xl bg-[#2a1e1b] p-6 text-[#fff7ec] shadow-card sm:p-8">
        <span aria-hidden className="pointer-events-none absolute -end-24 -top-28 size-80 rounded-full bg-terracotta/30 blur-3xl" />
        <span aria-hidden className="pointer-events-none absolute -bottom-32 start-1/3 size-72 rounded-full bg-[#541f2d]/60 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0">
            <p className="text-sm text-[#e9ddcf]">{new Date().toLocaleDateString(i18n.language, { weekday: "long", day: "numeric", month: "long" })}</p>
            <h1 className="font-display mt-1 text-2xl font-semibold leading-tight sm:text-3xl">
              {t("welcome_back")}{first ? `${i18n.language.startsWith("ar") ? "،" : ","} ${first}` : ""}
            </h1>
            <p className="mt-1 text-[#e9ddcf]">{restaurant?.name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-xs text-[#e9ddcf]">
              {t("from_date")}
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-transparent text-[#fff7ec] outline-none [color-scheme:dark]" />
            </label>
            <label className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-xs text-[#e9ddcf]">
              {t("to_date")}
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-transparent text-[#fff7ec] outline-none [color-scheme:dark]" />
            </label>
            <Button type="button" variant="outline" size="md" onClick={exportXlsx} disabled={exporting} className="border-white/20 bg-white/10 text-[#fff7ec] hover:bg-white/20">
              {exporting ? <Loader2 className="animate-spin" /> : <Download />}
              {t("export_excel")}
            </Button>
          </div>
        </div>
      </motion.header>

      {q.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      )}
      {q.isError && <p className="text-sm text-destructive">{t("stats_unavailable")}</p>}

      {d && (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
            <Tile icon={FolderTree} label={t("categories")} value={d.menuContent.categoryCount} to="/dashboard/menu/categories" delay={0} />
            <Tile icon={UtensilsCrossed} label={t("items_active")} value={d.menuContent.activeItemCount} to="/dashboard/menu/items" tone="good" delay={0.04} />
            <Tile icon={ImageOff} label={t("items_inactive")} value={d.menuContent.inactiveItemCount} to="/dashboard/menu/items" delay={0.08} />
            <Tile icon={Wheat} label={t("items_no_ingredients")} value={d.menuContent.itemsMissingIngredientsCount} to="/dashboard/menu/items" tone={d.menuContent.itemsMissingIngredientsCount ? "warn" : "default"} delay={0.12} />
            <Tile icon={Box} label={t("items_no_model")} value={d.menuContent.itemsMissingModelCount} to="/dashboard/generation/bulk" tone={d.menuContent.itemsMissingModelCount ? "warn" : "default"} delay={0.16} />
            <Tile icon={Table2} label={t("tables_total")} value={d.tablesAndQr.totalTables} to="/dashboard/restaurant/tables" delay={0.2} />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Card title={t("subscription")} icon={CalendarClock} className="lg:col-span-1">
              {!sub?.hasRegistration ? (
                <p className="flex items-start gap-2 rounded-xl bg-warning/10 p-3 text-sm text-foreground">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                  {t("no_subscription")}
                </p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="font-display text-2xl font-semibold text-foreground">{sub.planName ?? "—"}</p>
                    {sub.supportTierName && <p className="text-xs text-muted-foreground">{t("support_tier")}: {sub.supportTierName}</p>}
                  </div>
                  <p dir="ltr" className="text-start font-display text-xl font-semibold tabular-nums text-foreground">
                    {formatMoney(sub.effectivePrice, sub.currencyCode ?? undefined, i18n.language)}
                    {sub.price != null && sub.price !== sub.effectivePrice && (
                      <span className="ms-2 text-sm font-normal text-muted-foreground"><s>{formatMoney(sub.price, sub.currencyCode ?? undefined, i18n.language)}</s></span>
                    )}
                  </p>
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                      <span>{shortDate(sub.fromDate, i18n.language)}</span>
                      <span>{shortDate(sub.toDate, i18n.language)}</span>
                    </div>
                    <p className={cn("text-sm font-semibold", left !== null && left <= 14 ? "text-warning" : "text-foreground", left !== null && left < 0 && "text-destructive")}>
                      {left === null ? "—" : left < 0 ? t("sub_expired") : t("days_left", { n: left })}
                    </p>
                  </div>
                </div>
              )}
            </Card>

            <Card title={t("generation_usage")} icon={Sparkles} className="lg:col-span-2">
              <div className="space-y-5">
                <Bar label={t("quota_today")} used={d.generationUsage.dailyUsed} limit={d.generationUsage.dailyLimit} remaining={d.generationUsage.dailyRemaining} />
                <Bar label={t("quota_month")} used={d.generationUsage.monthlyUsed} limit={d.generationUsage.monthlyLimit} remaining={d.generationUsage.monthlyRemaining} />
                <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-3.5 py-2.5 text-sm">
                  <span className="text-muted-foreground">{t("quota_credits")}</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {d.generationUsage.extraCreditsRemaining.toLocaleString(i18n.language)}
                    {d.generationUsage.extraCreditsNearestExpiryUtc && d.generationUsage.extraCreditsRemaining > 0 && (
                      <span className="ms-2 text-xs font-normal text-muted-foreground">{t("expires")} {shortDate(d.generationUsage.extraCreditsNearestExpiryUtc, i18n.language)}</span>
                    )}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Card title={t("models_3d")} icon={Box} className="lg:col-span-2" action={<Link to={"/dashboard/generation/jobs" as never} className="text-xs font-medium text-primary hover:underline">{t("view_all")}</Link>}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {([
                  ["pending", m?.pending, "text-warning"],
                  ["processing", m?.processing, "text-info"],
                  ["ready", m?.ready, "text-success"],
                  ["failed", m?.failed, "text-destructive"],
                ] as const).map(([k, v, c]) => (
                  <div key={k} className="rounded-xl border border-border px-3 py-2.5">
                    <p className={cn("font-display text-2xl font-semibold tabular-nums", (v ?? 0) > 0 ? c : "text-muted-foreground")}>{(v ?? 0).toLocaleString(i18n.language)}</p>
                    <p className="text-xs text-muted-foreground">{t(`val_${k}`)}</p>
                  </div>
                ))}
              </div>
              {d.models.recentFailedJobs.length > 0 && (
                <div className="mt-4 overflow-hidden rounded-xl border border-border">
                  <h3 className="border-b border-border bg-muted/50 px-3.5 py-2 text-xs font-semibold text-foreground">{t("recent_failed")}</h3>
                  <ul className="divide-y divide-border">
                    {d.models.recentFailedJobs.slice(0, 5).map((j) => (
                      <li key={j.jobId} className="flex items-center gap-3 px-3.5 py-2.5 text-sm">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-foreground">{j.menuItemName ?? "—"}</span>
                          <span className="block truncate text-xs text-muted-foreground">{j.errorMessage}</span>
                        </span>
                        <Link to={`/dashboard/menu/items/${j.menuItemId}` as never} className="shrink-0 text-xs font-medium text-primary hover:underline">{t("retry")}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            <Card title={t("tables_qr")} icon={QrCode} action={<Link to={"/dashboard/restaurant/tables" as never} className="text-xs font-medium text-primary hover:underline">{t("open_page")}</Link>}>
              <dl className="space-y-3 text-sm">
                {([
                  [t("tables_active"), `${d.tablesAndQr.activeTables} / ${d.tablesAndQr.totalTables}`, false],
                  [t("tables_with_qr"), d.tablesAndQr.tablesWithQrCode, false],
                  [t("tables_without_qr"), d.tablesAndQr.tablesWithoutQrCode, d.tablesAndQr.tablesWithoutQrCode > 0],
                  [t("general_qr"), d.tablesAndQr.restaurantsWithGeneralQrCodeCount, false],
                ] as const).map(([label, value, warn]) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className={cn("font-semibold tabular-nums", warn ? "text-warning" : "text-foreground")}>{value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>
        </>
      )}
    </section>
  );
}
