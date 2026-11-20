import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ArrowUpRight, Box, CalendarClock, CheckCircle2, CircleSlash, Download, Layers, ListChecks, Loader2, QrCode, Sparkles, Utensils, Wallet } from "lucide-react";
import { asset } from "@/helpers/asset";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import useAuthStore from "@/modules/Auth/core/store/AuthStore";
import { formatMoney } from "@/components/common/RecordView";
import { daysUntil, shortDate } from "@/modules/shared/core/format";
import { useCurrentRestaurant } from "@/modules/shared/core/restaurant";
import { downloadDashboard, useOverview } from "../../core/api";
import { SufraMap } from "../components/SufraMap";
import { DateButton } from "@/components/common/DateButton";

const EASE = [0.16, 1, 0.3, 1] as const;

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
        <motion.div initial={{ width: 0 }} animate={{ width: unlimited ? "100%" : `${Math.min(100, Math.max(used > 0 ? 3 : 0, ratio * 100))}%` }} transition={{ duration: 0.8, ease: EASE }} className={cn("h-full rounded-full", unlimited ? "bg-oil/40" : tone)} />
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

/** A hairline-separated row of label and value (no box inside the card). */
const Row = ({ label, value, tone }: { label: React.ReactNode; value: React.ReactNode; tone?: "warn" }) => (
  <div className="flex items-center justify-between gap-3 border-t border-border py-2.5 text-sm first:border-t-0 first:pt-0">
    <dt className="min-w-0 text-muted-foreground">{label}</dt>
    <dd className={cn("shrink-0 font-semibold tabular-nums", tone === "warn" ? "text-warning" : "text-foreground")}>{value}</dd>
  </div>
);

/** The share of the menu that already has a 3D model, drawn as the logo's plate: a ring that fills. */
function ReadyRing({ value }: { value: number }) {
  const { i18n } = useTranslation();
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid size-32 shrink-0 place-items-center sm:size-36">
      <svg viewBox="0 0 120 120" className="absolute inset-0 size-full -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" className="stroke-[#541f2d]/12 dark:stroke-[#fbf5e9]/12" strokeWidth="11" />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          className="stroke-[#541f2d] dark:stroke-[#e2876a]"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value) }}
          transition={{ duration: 1.2, ease: EASE }}
        />
      </svg>
      <span className="font-display text-[2rem] font-semibold tabular-nums text-foreground sm:text-[2.25rem]">
        {Math.round(value * 100).toLocaleString(i18n.language)}%
      </span>
    </div>
  );
}

const BAND_DISHES = ["hummus", "shakshuka", "pancakes"];
const BAND_SPOTS: React.CSSProperties[] = [
  { width: 144, height: 144, insetInlineEnd: 0, top: 22 },
  { width: 100, height: 100, insetInlineEnd: 126, top: 0 },
  { width: 88, height: 88, insetInlineEnd: 120, top: 100 },
];

/**
 * The band that opens the dashboard: how much of the menu guests can already turn in 3D, what is missing, and the one
 * action that closes the gap. Three real dishes sit at its end as plates, the way sign-in shows them.
 */
function ReadinessBand({ total, missing }: { total: number; missing: number }) {
  const { t, i18n } = useTranslation();
  const ready = Math.max(0, total - missing);
  const value = total ? ready / total : 0;
  const n = (v: number) => v.toLocaleString(i18n.language);
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE, delay: 0.05 }}
      className="relative overflow-hidden rounded-3xl border border-border bg-linear-to-br from-[#fbf5e9] to-[#efe3d3] p-5 shadow-card sm:p-7 dark:from-[#2b201e] dark:to-[#221817]"
      aria-labelledby="ready-title"
    >
      <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center">
        <ReadyRing value={value} />
        <div className="min-w-0 flex-1 lg:pe-64">
          <h2 id="ready-title" className="font-display text-xl font-semibold leading-snug text-foreground sm:text-2xl">
            {missing > 0 ? t("ready_title") : t("ready_title_done")}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("ready_counts", { ready: n(ready), total: n(total) })}
            {missing > 0 && <span className="ms-1">· {t("ready_missing", { n: n(missing) })}</span>}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
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
      </div>

      {/* three real dishes as plates at the band's end */}
      <div aria-hidden className="pointer-events-none absolute end-6 top-1/2 hidden -translate-y-1/2 lg:block">
        <div className="relative h-[190px] w-[240px]">
          {BAND_DISHES.map((dish, i) => (
            <motion.img
              key={dish}
              src={asset(`images/login/dishes/${dish}.webp`)}
              alt=""
              decoding="async"
              initial={{ opacity: 0, scale: 0.9, rotate: -12 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.15 + i * 0.1 }}
              className="absolute rounded-full object-cover shadow-[0_18px_30px_-14px_rgb(38_28_26/0.55)] ring-4 ring-[#fbf5e9] dark:ring-[#2b201e]"
              style={BAND_SPOTS[i]}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}

type Todo = {
  key: string;
  n: number;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "warn" | "bad" | "info";
};

/** What needs the owner today, most urgent first; each row links to where it gets fixed. */
function Attention({ items }: { items: Todo[] }) {
  const { t, i18n } = useTranslation();
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6" aria-labelledby="attention-title">
      <header className="mb-3 flex items-center gap-2">
        <ListChecks className="size-4 text-terracotta" />
        <h2 id="attention-title" className="text-sm font-semibold text-foreground">{t("attention_title")}</h2>
        {items.length > 0 && (
          <span className="ms-auto rounded-full bg-terracotta/12 px-2 py-0.5 text-xs font-semibold tabular-nums text-terracotta">
            {items.length.toLocaleString(i18n.language)}
          </span>
        )}
      </header>
      {items.length === 0 ? (
        <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <CheckCircle2 className="size-5 text-success" />
          {t("attention_clear")}
        </p>
      ) : (
        <ul>
          {items.map((it) => (
            <li key={it.key} className="border-t border-border first:border-t-0">
              <Link to={it.href as never} className="group/todo -mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-accent/70">
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-xl",
                    it.tone === "bad" ? "bg-destructive/10 text-destructive" : it.tone === "warn" ? "bg-terracotta/12 text-terracotta" : "bg-muted text-muted-foreground",
                  )}
                >
                  <it.icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1 text-sm text-foreground">{it.label}</span>
                <span className="font-display text-lg font-semibold tabular-nums text-foreground">{it.n.toLocaleString(i18n.language)}</span>
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover/todo:-translate-y-0.5 rtl:-scale-x-100" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
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
  const monthShare = d?.generationUsage.monthlyLimit ? d.generationUsage.monthlyUsed / d.generationUsage.monthlyLimit : 0;
  const todos: Todo[] = d
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
      ] as Todo[]).filter((x) => x.n > 0)
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
      {d && <ReadinessBand total={total} missing={d.menuContent.itemsMissingModelCount} />}

          {/* the menu in numbers: one hairline-divided row of linked figures */}
          {d && (
            <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-border bg-card shadow-card sm:grid-cols-3 xl:grid-cols-6">
              {([
                [t("categories"), d.menuContent.categoryCount, "/dashboard/menu/categories", false],
                [t("items_active"), d.menuContent.activeItemCount, "/dashboard/menu/items", false],
                [t("items_inactive"), d.menuContent.inactiveItemCount, "/dashboard/menu/items", false],
                [t("items_no_ingredients"), d.menuContent.itemsMissingIngredientsCount, "/dashboard/menu/items", d.menuContent.itemsMissingIngredientsCount > 0],
                [t("items_no_model"), d.menuContent.itemsMissingModelCount, "/dashboard/generation/bulk", d.menuContent.itemsMissingModelCount > 0],
                [t("tables_total"), d.tablesAndQr.totalTables, "/dashboard/restaurant/tables", false],
              ] as const).map(([label, value, href, warn]) => (
                <Link key={label} to={href as never} className="group/fig -ms-px -mt-px border-s border-t border-border px-4 py-3.5 transition-colors hover:bg-accent/60">
                  <span className={cn("block font-display text-[1.75rem] font-semibold leading-none tabular-nums", warn ? "text-warning" : "text-foreground")}>{n(value)}</span>
                  <span className="mt-1.5 block text-xs text-muted-foreground group-hover/fig:text-foreground">{label}</span>
                </Link>
              ))}
            </div>
          )}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <SufraMap restaurantId={restaurant?.id} />
        {d && <Attention items={todos} />}
      </div>

      <div className="grid items-start gap-5 md:grid-cols-2 2xl:grid-cols-4">
          {d && (
            <Card title={t("ai_queue")} icon={Box} action={<Link to={"/dashboard/generation/jobs" as never} className="text-xs font-medium text-primary hover:underline">{t("view_all")}</Link>}>
              <dl className="grid grid-cols-4 gap-2">
                {([
                  ["pending", m?.pending, "text-warning"],
                  ["processing", m?.processing, "text-info"],
                  ["ready", m?.ready, "text-success"],
                  ["failed", m?.failed, "text-destructive"],
                ] as const).map(([k, v, c]) => (
                  <div key={k} className="flex flex-col-reverse">
                    <dt className="mt-1.5 text-xs text-muted-foreground">{t(`val_${k}`)}</dt>
                    <dd className={cn("font-display text-[1.75rem] font-semibold leading-none tabular-nums", (v ?? 0) > 0 ? c : "text-muted-foreground")}>{n(v ?? 0)}</dd>
                  </div>
                ))}
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

          {d && (
            <Card title={t("generation_usage")} icon={Sparkles}>
              <div className="space-y-5">
                <Bar label={t("quota_today")} used={d.generationUsage.dailyUsed} limit={d.generationUsage.dailyLimit} remaining={d.generationUsage.dailyRemaining} />
                <Bar label={t("quota_month")} used={d.generationUsage.monthlyUsed} limit={d.generationUsage.monthlyLimit} remaining={d.generationUsage.monthlyRemaining} />
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
                  <div className="text-end">
                    <p className={cn("text-sm font-semibold", left !== null && left <= 14 ? "text-warning" : "text-foreground", left !== null && left < 0 && "text-destructive")}>
                      {left === null ? "—" : left < 0 ? t("sub_expired") : t("days_left", { n: left })}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{shortDate(sub.fromDate, i18n.language)} – {shortDate(sub.toDate, i18n.language)}</p>
                  </div>
                </div>
              )}
            </Card>
          )}

          {d && (
            <Card title={t("tables_qr")} icon={QrCode} action={<Link to={"/dashboard/restaurant/tables" as never} className="text-xs font-medium text-primary hover:underline">{t("open_page")}</Link>}>
              <dl>
                <Row label={t("tables_active")} value={<span dir="ltr">{n(d.tablesAndQr.activeTables)} / {n(d.tablesAndQr.totalTables)}</span>} />
                <Row label={t("tables_with_qr")} value={n(d.tablesAndQr.tablesWithQrCode)} />
                <Row label={t("tables_without_qr")} value={n(d.tablesAndQr.tablesWithoutQrCode)} tone={d.tablesAndQr.tablesWithoutQrCode > 0 ? "warn" : undefined} />
                <Row label={t("general_qr")} value={n(d.tablesAndQr.restaurantsWithGeneralQrCodeCount)} />
              </dl>
            </Card>
          )}
      </div>
    </section>
  );
}
