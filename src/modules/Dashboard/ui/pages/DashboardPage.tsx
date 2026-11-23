import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Box, CalendarClock, CheckCircle2, CircleSlash, Clock3, Download, Layers, Loader2, QrCode, Sparkles, Utensils, Wallet, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import useAuthStore from "@/modules/Auth/core/store/AuthStore";
import { formatMoney } from "@/components/common/RecordView";
import { daysUntil, shortDate } from "@/modules/shared/core/format";
import { useCurrentRestaurant } from "@/modules/shared/core/restaurant";
import { downloadDashboard, useOverview } from "../../core/api";
import { DishShelf, SoukBins } from "../components/SufraMap";
import { RollingNumber, TicketRail, type Ticket } from "../components/Souk";
import { DateButton } from "@/components/common/DateButton";
import { Meter, usageTone, type Tone } from "@/modules/shared/ui/parts";

const EASE = [0.16, 1, 0.3, 1] as const;

/** A quota line: what is used of the limit, what is left, and the meter; `null` limit = unlimited (no meter). */
function Quota({ label, used, limit, remaining }: { label: string; used: number; limit?: number | null; remaining?: number | null }) {
  const { t, i18n } = useTranslation();
  const n = (v: number) => v.toLocaleString(i18n.language);
  const unlimited = limit === null || limit === undefined;
  const ratio = unlimited || !limit ? 0 : used / limit;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">
          <b className="text-sm font-semibold text-foreground">{n(used)}</b> / {unlimited ? t("unlimited") : n(limit!)}
          {remaining != null && <span className="ms-2">· {t("remaining_n", { n: n(remaining) })}</span>}
        </span>
      </div>
      {!unlimited && <Meter value={ratio} tone={usageTone(ratio)} label={`${label}: ${n(used)} / ${n(limit!)}`} />}
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

/** A hairline-separated row of label and value (no box inside the card). */
const Row = ({ label, value, tone }: { label: React.ReactNode; value: React.ReactNode; tone?: "warn" }) => (
  <div className="flex items-center justify-between gap-3 border-t border-border py-2.5 text-sm first:border-t-0 first:pt-0">
    <dt className="min-w-0 text-muted-foreground">{label}</dt>
    <dd className={cn("shrink-0 font-semibold tabular-nums", tone === "warn" ? "text-warning" : "text-foreground")}>{value}</dd>
  </div>
);

type Cell = { label: string; value: React.ReactNode; of?: string; note?: string; share?: number | null; tone?: Tone; href?: string };

/** One cell of the ledger slab: label, figure (with "of N" when it is a share), and a thin meter or a note under it. */
function LedgerCell({ c }: { c: Cell }) {
  const body = (
    <>
      <span className="text-xs text-muted-foreground transition-colors group-hover/cell:text-foreground">{c.label}</span>
      <span className="mt-2 flex items-baseline gap-1.5">
        <span className="font-display text-[1.75rem] font-semibold leading-none tabular-nums text-foreground">{c.value}</span>
        {c.of && <span className="text-xs text-muted-foreground">{c.of}</span>}
      </span>
      <span className="mt-auto pt-3">
        {c.share != null ? <Meter thin value={c.share} tone={c.tone} label={c.label} /> : <span className="block text-xs leading-none text-muted-foreground">{c.note}</span>}
      </span>
    </>
  );
  const cls = "group/cell -ms-px -mt-px flex min-h-[7.25rem] flex-col border-s border-t border-border px-4 py-4 sm:px-5";
  return c.href ? (
    <Link to={c.href as never} className={cn(cls, "transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none")}>{body}</Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

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
  const n = (v: number) => v.toLocaleString(i18n.language);
  const today = new Date().toLocaleDateString(i18n.language, { weekday: "long", day: "numeric", month: "long" });
  const total = d ? d.menuContent.activeItemCount + d.menuContent.inactiveItemCount : 0;
  // how much of the subscription period has passed (from -> to), for its meter
  const span = sub?.fromDate && sub?.toDate ? new Date(sub.toDate).getTime() - new Date(sub.fromDate).getTime() : 0;
  const periodShare = span > 0 ? (Date.now() - new Date(sub!.fromDate!).getTime()) / span : null;
  const monthShare = d?.generationUsage.monthlyLimit ? d.generationUsage.monthlyUsed / d.generationUsage.monthlyLimit : 0;
  const todos: Ticket[] = d
    ? ([
        { key: "failed", n: d.models.counts.failed, label: t("att_failed"), href: "/dashboard/generation/jobs", icon: AlertTriangle, tone: "bad" },
        { key: "no_model", n: d.menuContent.itemsMissingModelCount, label: t("att_no_model"), href: "/dashboard/generation/bulk", icon: Layers, tone: "warn" },
        { key: "no_qr", n: d.tablesAndQr.tablesWithoutQrCode, label: t("att_no_qr"), href: "/dashboard/restaurant/tables", icon: QrCode, tone: "warn" },
        { key: "no_ingredients", n: d.menuContent.itemsMissingIngredientsCount, label: t("att_no_ingredients"), href: "/dashboard/menu/items", icon: Utensils, tone: "info" },
        { key: "inactive", n: d.menuContent.inactiveItemCount, label: t("att_inactive"), href: "/dashboard/menu/items", icon: CircleSlash, tone: "info" },
        ...(left !== null && left >= 0 && left <= 14 ? [{ key: "sub", n: left, label: t("att_sub_days"), href: "/dashboard", icon: CalendarClock, tone: "warn" as const }] : []),
        ...(monthShare >= 0.8
          ? [{ key: "quota", n: Math.round(monthShare * 100), label: t("att_quota"), href: "/dashboard/generation/jobs", icon: Wallet, tone: monthShare >= 1 ? ("bad" as const) : ("warn" as const) }]
          : []),
      ] as Ticket[]).filter((x) => x.n > 0)
    : [];

  const missing = d?.menuContent.itemsMissingModelCount ?? 0;
  const readyShare = total ? (total - missing) / total : 0;
  const gen = d?.generationUsage;
  const cells: Cell[] = d
    ? [
        { label: t("souk_cell_3d"), value: n(total - missing), of: t("of_n", { n: n(total) }), share: readyShare, href: "/dashboard/generation/bulk" },
        { label: t("tables_with_qr"), value: n(d.tablesAndQr.tablesWithQrCode), of: t("of_n", { n: n(d.tablesAndQr.totalTables) }), share: d.tablesAndQr.totalTables ? d.tablesAndQr.tablesWithQrCode / d.tablesAndQr.totalTables : 0, href: "/dashboard/restaurant/tables" },
        gen?.monthlyLimit
          ? { label: t("souk_cell_month"), value: n(gen.monthlyUsed), of: t("of_n", { n: n(gen.monthlyLimit) }), share: monthShare, tone: usageTone(monthShare), href: "/dashboard/generation/jobs" }
          : { label: t("souk_cell_month"), value: n(gen?.monthlyUsed ?? 0), note: t("unlimited"), href: "/dashboard/generation/jobs" },
        { label: t("subscription"), value: left === null ? "—" : n(Math.max(0, left)), of: left === null ? undefined : t("souk_days"), share: periodShare, tone: left !== null && left < 0 ? "danger" : left !== null && left <= 14 ? "warning" : "accent" },
        { label: t("val_processing"), value: n(m?.processing ?? 0), note: t("souk_waiting", { n: n(m?.pending ?? 0) }), href: "/dashboard/generation/jobs" },
        { label: t("categories"), value: n(d.menuContent.categoryCount), note: t("souk_items_n", { n: n(total) }), href: "/dashboard/menu/categories" },
        { label: t("items_active"), value: n(d.menuContent.activeItemCount), of: t("of_n", { n: n(total) }), share: total ? d.menuContent.activeItemCount / total : 0, href: "/dashboard/menu/items" },
        { label: t("items_no_ingredients"), value: n(d.menuContent.itemsMissingIngredientsCount), of: t("of_n", { n: n(total) }), share: total ? d.menuContent.itemsMissingIngredientsCount / total : 0, tone: d.menuContent.itemsMissingIngredientsCount ? "warning" : "good", href: "/dashboard/menu/items" },
      ]
    : [];

  return (
    <section className="space-y-6">
      {/* the greeting leads; the restaurant and today's date follow it; the period filter and export sit at the end */}
      <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-[2rem] font-semibold leading-tight text-foreground sm:text-[2.5rem]">
            {t("welcome_back")}{first ? `${i18n.language.startsWith("ar") ? "،" : ","} ${first}` : ""}
          </h1>
          <p className="mt-1 text-[0.9375rem] text-muted-foreground">
            {restaurant?.name && <span className="font-medium text-foreground">{restaurant.name}</span>}
            {restaurant?.name && <span aria-hidden className="mx-2 text-input">•</span>}
            {today}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateButton label={t("from_date")} value={from} onChange={setFrom} />
          <DateButton label={t("to_date")} value={to} onChange={setTo} />
          <Button type="button" variant="outline" size="md" onClick={exportXlsx} disabled={exporting}>
            {exporting ? <Loader2 className="animate-spin" /> : <Download />}
            {t("export_excel")}
          </Button>
        </div>
      </motion.header>

      {q.isLoading && <Skeleton className="h-48 rounded-3xl" />}
      {q.isError && <p className="text-sm text-destructive">{t("stats_unavailable")}</p>}
      {d && (
        <section aria-labelledby="ready-title" className="grid overflow-hidden rounded-3xl border border-border bg-card shadow-card lg:grid-cols-[minmax(0,1fr)_minmax(0,1.75fr)]">
          {/* the readiness figure leads the slab; the ledger of the rest of the restaurant sits beside it */}
          <div className="flex flex-col gap-3 p-5 sm:p-7">
            <h2 id="ready-title" className="text-sm font-medium text-muted-foreground">{missing > 0 ? t("ready_title") : t("ready_title_done")}</h2>
            <p className="flex items-baseline gap-1 font-display font-bold tracking-[-0.02em] text-foreground">
              <RollingNumber value={readyShare * 100} className="text-[4.75rem]" />
              <span className="text-[1.75rem] font-medium text-muted-foreground">{i18n.language.startsWith("ar") ? "٪" : "%"}</span>
            </p>
            <Meter value={readyShare} label={t("ready_title")} />
            <p className="text-sm text-muted-foreground">
              {t("ready_counts", { ready: n(total - missing), total: n(total) })}
              {missing > 0 && <span className="ms-1">· {t("ready_missing", { n: n(missing) })}</span>}
            </p>
            <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
              {missing > 0 ? (
                <>
                  <Link to={"/dashboard/generation/bulk" as never} className={cn(buttonVariants({ variant: "primary", size: "md" }), "gap-2 whitespace-nowrap")}>
                    <Sparkles />
                    {t("ready_generate")}
                  </Link>
                  <Link to={"/dashboard/menu/items" as never} search={{ withoutModelOnly: true } as never} className={cn(buttonVariants({ variant: "ghost", size: "md" }), "whitespace-nowrap")}>
                    {t("ready_view_missing")}
                  </Link>
                </>
              ) : (
                <Link to={"/dashboard/menu/items" as never} className={cn(buttonVariants({ variant: "outline", size: "md" }), "gap-2 whitespace-nowrap")}>
                  <Utensils />
                  {t("ready_open_menu")}
                </Link>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 border-t border-border sm:grid-cols-4 lg:border-t-0 [&>*]:border-border">
            {cells.map((c) => <LedgerCell key={c.label} c={c} />)}
          </div>
        </section>
      )}

      <SoukBins restaurantId={restaurant?.id} />

      {d && <TicketRail items={todos} />}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] [&>*]:min-w-0">
        <DishShelf restaurantId={restaurant?.id} />
          {d && (
          <Card title={t("ai_queue")} icon={Box} action={<Link to={"/dashboard/generation/jobs" as never} className="text-xs font-medium text-primary hover:underline">{t("view_all")}</Link>}>
            {/* text wears ink, not the status colour: the icon and the label carry the state; only a failure turns red */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
              {([
                ["pending", m?.pending ?? 0, Clock3],
                ["processing", m?.processing ?? 0, Loader2],
                ["ready", m?.ready ?? 0, CheckCircle2],
                ["failed", m?.failed ?? 0, XCircle],
              ] as const).map(([k, v, Ico]) => {
                const alarm = k === "failed" && v > 0;
                return (
                  <div key={k} className="flex flex-col gap-1.5">
                    <dt className={cn("flex items-center gap-1.5 text-xs", alarm ? "text-destructive" : "text-muted-foreground")}>
                      <Ico className={cn("size-3.5", k === "processing" && v > 0 && "animate-spin motion-reduce:animate-none")} />
                      {t(`val_${k}`)}
                    </dt>
                    <dd className={cn("font-display text-[1.75rem] font-semibold leading-none", alarm ? "text-destructive" : v > 0 ? "text-foreground" : "text-muted-foreground")}>{n(v)}</dd>
                  </div>
                );
              })}
            </dl>
            {d.models.recentFailedJobs.length > 0 && (
              <div className="mt-5">
                <h3 className="text-xs font-semibold text-foreground">{t("recent_failed")}</h3>
                <ul className="mt-1">
                  {d.models.recentFailedJobs.slice(0, 4).map((j) => (
                    <li key={j.jobId} className="flex items-center gap-3 border-t border-border py-2.5 text-sm first:border-t-0">
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
        )}

      </div>

      <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
          {d && (
            <Card title={t("generation_usage")} icon={Sparkles}>
              <div className="space-y-5">
                <Quota label={t("quota_today")} used={d.generationUsage.dailyUsed} limit={d.generationUsage.dailyLimit} remaining={d.generationUsage.dailyRemaining} />
                <Quota label={t("quota_month")} used={d.generationUsage.monthlyUsed} limit={d.generationUsage.monthlyLimit} remaining={d.generationUsage.monthlyRemaining} />
                <dl>
                  <Row
                    label={t("quota_credits")}
                    value={
                      <>
                        {n(d.generationUsage.extraCreditsRemaining)}
                        {d.generationUsage.extraCreditsNearestExpiryUtc && d.generationUsage.extraCreditsRemaining > 0 && (
                          <span className="ms-2 text-xs font-normal text-muted-foreground">{t("expires")} {shortDate(d.generationUsage.extraCreditsNearestExpiryUtc, i18n.language)}</span>
                        )}
                      </>
                    }
                  />
                </dl>
              </div>
            </Card>
          )}

          {d && (
            <Card title={t("subscription")} icon={CalendarClock}>
              {!sub?.hasRegistration ? (
                <p className="flex items-start gap-2 text-sm text-foreground">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                  {t("no_subscription")}
                </p>
              ) : (
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="font-display text-2xl font-semibold text-foreground">{sub.planName ?? "—"}</p>
                    {sub.supportTierName && <p className="text-xs text-muted-foreground">{t("support_tier")}: {sub.supportTierName}</p>}
                    <p dir="ltr" className="mt-2 text-start font-display text-lg font-semibold tabular-nums text-foreground">
                      {formatMoney(sub.effectivePrice, sub.currencyCode ?? undefined, i18n.language)}
                      {sub.price != null && sub.price !== sub.effectivePrice && (
                        <span className="ms-2 text-sm font-normal text-muted-foreground"><s>{formatMoney(sub.price, sub.currencyCode ?? undefined, i18n.language)}</s></span>
                      )}
                    </p>
                  </div>
                  <div className="w-full">
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                      <span className="text-xs text-muted-foreground">{shortDate(sub.fromDate, i18n.language)} – {shortDate(sub.toDate, i18n.language)}</span>
                      <span className={cn("text-sm font-semibold", left !== null && left <= 14 ? "text-warning" : "text-foreground", left !== null && left < 0 && "text-destructive")}>
                        {left === null ? "—" : left < 0 ? t("sub_expired") : t("days_left", { n: left })}
                      </span>
                    </div>
                    {periodShare !== null && (
                      <Meter value={periodShare} tone={left !== null && left < 0 ? "danger" : left !== null && left <= 14 ? "warning" : "accent"} label={t("plan_period")} />
                    )}
                  </div>
                </div>
              )}
            </Card>
          )}

          {d && (
            <Card title={t("tables_qr")} icon={QrCode} action={<Link to={"/dashboard/restaurant/tables" as never} className="text-xs font-medium text-primary hover:underline">{t("open_page")}</Link>}>
              <div className="space-y-4">
                {(
                  [
                    [t("qr_coverage"), d.tablesAndQr.tablesWithQrCode, d.tablesAndQr.tablesWithoutQrCode > 0 ? "warning" : "good"],
                    [t("tables_active"), d.tablesAndQr.activeTables, "accent"],
                  ] as [string, number, Tone][]
                ).map(([label, v, tone]) => (
                  <div key={label}>
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-foreground">{label}</span>
                      <span className="text-xs text-muted-foreground"><b className="text-sm font-semibold text-foreground">{n(v)}</b> / {n(d.tablesAndQr.totalTables)}</span>
                    </div>
                    <Meter value={d.tablesAndQr.totalTables ? v / d.tablesAndQr.totalTables : 0} tone={tone} label={`${label}: ${n(v)} / ${n(d.tablesAndQr.totalTables)}`} />
                  </div>
                ))}
                <dl>
                  <Row label={t("tables_without_qr")} value={n(d.tablesAndQr.tablesWithoutQrCode)} tone={d.tablesAndQr.tablesWithoutQrCode > 0 ? "warn" : undefined} />
                  <Row label={t("general_qr")} value={d.tablesAndQr.restaurantsWithGeneralQrCodeCount > 0 ? t("yes") : t("no")} />
                </dl>
              </div>
            </Card>
          )}
      </div>
    </section>
  );
}
