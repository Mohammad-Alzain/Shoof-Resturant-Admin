import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CalendarClock, CircleSlash, Download, Layers, Loader2, QrCode, Sparkles, Utensils, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import useAuthStore from "@/modules/Auth/core/store/AuthStore";
import { can } from "@/modules/Auth/core/can";
import { formatMoney } from "@/components/common/RecordView";
import { daysUntil, shortDate } from "@/modules/shared/core/format";
import { useCurrentRestaurant } from "@/modules/shared/core/restaurant";
import { downloadDashboard, useOverview } from "../../core/api";
import { DishShelf, SoukBins, useSufra } from "../components/SufraMap";
import { RollingNumber, TicketRail, type Ticket } from "../components/Souk";
import { DateButton } from "@/components/common/DateButton";
import { Meter, type Tone } from "@/modules/shared/ui/parts";

const EASE = [0.16, 1, 0.3, 1] as const;

type Cell = { label: string; value: React.ReactNode; of?: string; note?: React.ReactNode; share?: number | null; tone?: Tone; href?: string };

/** A quota's meter: terracotta while there is room, the danger tone once it is used up. */
const quotaTone = (ratio: number): Tone => (ratio >= 1 ? "danger" : "usage");

/** One cell of the ledger slab: label, figure (with "of N" when it is a share), then its meter and a short note. */
function LedgerCell({ c }: { c: Cell }) {
  const body = (
    <>
      <span className="text-xs text-muted-foreground transition-colors group-hover/cell:text-foreground">{c.label}</span>
      <span className="mt-2 flex items-baseline gap-1.5">
        <span className="font-display text-[1.5rem] font-semibold leading-none tabular-nums text-foreground sm:text-[1.75rem]">{c.value}</span>
        {c.of && <span className="text-xs text-muted-foreground">{c.of}</span>}
      </span>
      <span className="mt-auto flex flex-col gap-2 pt-3">
        {c.share != null && <Meter thin value={c.share} tone={c.tone} label={c.label} />}
        {c.note && <span className="truncate text-xs leading-none text-muted-foreground">{c.note}</span>}
      </span>
    </>
  );
  const cls = "group/cell -ms-px -mt-px flex min-h-[5.75rem] min-w-0 flex-col border-s border-t border-border px-4 py-3.5 sm:min-h-[7.25rem] sm:px-5 sm:py-4";
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
  const menuAllowed = can("MenuCategories.View") && can("MenuItems.View");
  const sufra = useSufra(menuAllowed ? restaurant?.id : undefined);

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

  const n = (v: number) => v.toLocaleString(i18n.language);
  const sub = d?.subscription;
  const left = sub?.daysRemaining ?? daysUntil(sub?.toDate) ?? null;
  const first = (user?.fullName ?? user?.name ?? "").split(" ")[0];
  const m = d?.models.counts;
  const gen = d?.generationUsage;
  const today = new Date().toLocaleDateString(i18n.language, { weekday: "long", day: "numeric", month: "long" });
  const total = d ? d.menuContent.activeItemCount + d.menuContent.inactiveItemCount : 0;
  const missing = d?.menuContent.itemsMissingModelCount ?? 0;
  const ready = Math.max(0, total - missing);
  const readyShare = total ? ready / total : 0;
  // the next round tenth above today's readiness, and how many more models reach it
  const nextPct = Math.min(100, (Math.floor(readyShare * 10) + 1) * 10);
  const toNext = Math.max(0, Math.ceil((nextPct / 100) * total) - ready);
  // how much of the subscription period has passed (from -> to), for its meter
  const span = sub?.fromDate && sub?.toDate ? new Date(sub.toDate).getTime() - new Date(sub.fromDate).getTime() : 0;
  const periodShare = span > 0 ? (Date.now() - new Date(sub!.fromDate!).getTime()) / span : null;
  const monthShare = gen?.monthlyLimit ? gen.monthlyUsed / gen.monthlyLimit : 0;
  const dayShare = gen?.dailyLimit ? gen.dailyUsed / gen.dailyLimit : 0;

  // the categories with the most dishes still missing a model, emptiest first: they name the no-model ticket
  const gaps = useMemo(
    () =>
      (sufra.data ?? [])
        .map((p) => ({ name: p.name, target: p.target, missing: p.items - p.models }))
        .filter((p) => p.missing > 0)
        .sort((a, b) => b.missing - a.missing),
    [sufra.data],
  );

  const tickets: Ticket[] = d
    ? ([
        {
          key: "failed",
          n: m?.failed ?? 0,
          label: t("att_failed"),
          icon: AlertTriangle,
          tone: "bad",
          lines: d.models.recentFailedJobs.slice(0, 2).map((j) => ({ title: j.menuItemName ?? "—", note: j.errorMessage ?? undefined })),
          // one failure opens that dish; several open the jobs list
          ...(d.models.recentFailedJobs.length === 1
            ? { href: `/dashboard/menu/items/${d.models.recentFailedJobs[0].menuItemId}`, cta: t("souk_cta_item") }
            : { href: "/dashboard/generation/jobs", cta: t("souk_cta_jobs") }),
        },
        {
          key: "no_model",
          n: missing,
          label: t("att_no_model"),
          icon: Layers,
          tone: "warn",
          lines: gaps.length ? [{ title: gaps.slice(0, 3).map((g) => `${g.name} ${n(g.missing)}`).join(i18n.language.startsWith("ar") ? "، " : ", ") }] : undefined,
          href: "/dashboard/menu/items",
          search: gaps[0] ? { menuCategoryId: gaps[0].target, withoutModelOnly: true } : { withoutModelOnly: true },
          cta: gaps[0] ? t("souk_cta_category", { name: gaps[0].name }) : t("souk_cta_dishes"),
        },
        { key: "no_qr", n: d.tablesAndQr.tablesWithoutQrCode, label: t("att_no_qr"), href: "/dashboard/restaurant/tables", cta: t("souk_cta_tables"), icon: QrCode, tone: "warn" },
        { key: "no_ingredients", n: d.menuContent.itemsMissingIngredientsCount, label: t("att_no_ingredients"), href: "/dashboard/menu/items", cta: t("souk_cta_dishes"), icon: Utensils, tone: "info" },
        { key: "inactive", n: d.menuContent.inactiveItemCount, label: t("att_inactive"), href: "/dashboard/menu/items", cta: t("souk_cta_dishes"), icon: CircleSlash, tone: "info" },
        ...(sub && !sub.hasRegistration ? [{ key: "nosub", label: t("no_subscription"), href: "/dashboard", cta: t("souk_cta_plan"), icon: CalendarClock, tone: "bad" as const }] : []),
        ...(left !== null && left >= 0 && left <= 14 ? [{ key: "sub", n: left, label: t("att_sub_days"), href: "/dashboard", cta: t("souk_cta_plan"), icon: CalendarClock, tone: "warn" as const }] : []),
        ...(monthShare >= 0.8
          ? [{ key: "quota", n: Math.round(monthShare * 100), label: t("att_quota"), href: "/dashboard/generation/jobs", cta: t("souk_cta_jobs"), icon: Wallet, tone: monthShare >= 1 ? ("bad" as const) : ("warn" as const) }]
          : []),
      ] as Ticket[]).filter((x) => x.n === undefined || x.n > 0)
    : [];

  const cells: Cell[] = d
    ? [
        gen?.dailyLimit
          ? { label: t("souk_cell_today"), value: n(gen.dailyUsed), of: t("of_n", { n: n(gen.dailyLimit) }), share: dayShare, tone: quotaTone(dayShare), note: gen.dailyRemaining != null ? t("remaining_n", { n: n(gen.dailyRemaining) }) : undefined, href: "/dashboard/generation/jobs" }
          : { label: t("souk_cell_today"), value: n(gen?.dailyUsed ?? 0), note: t("unlimited"), href: "/dashboard/generation/jobs" },
        {
          label: t("souk_cell_month"),
          value: n(gen?.monthlyUsed ?? 0),
          of: gen?.monthlyLimit ? t("of_n", { n: n(gen.monthlyLimit) }) : undefined,
          share: gen?.monthlyLimit ? monthShare : null,
          tone: quotaTone(monthShare),
          note:
            gen && gen.extraCreditsRemaining > 0
              ? `${t("souk_credits", { n: n(gen.extraCreditsRemaining) })}${gen.extraCreditsNearestExpiryUtc ? ` · ${t("expires")} ${shortDate(gen.extraCreditsNearestExpiryUtc, i18n.language)}` : ""}`
              : gen?.monthlyLimit
                ? undefined
                : t("unlimited"),
          href: "/dashboard/generation/jobs",
        },
        {
          label: t("tables_with_qr"),
          value: n(d.tablesAndQr.tablesWithQrCode),
          of: t("of_n", { n: n(d.tablesAndQr.totalTables) }),
          share: d.tablesAndQr.totalTables ? d.tablesAndQr.tablesWithQrCode / d.tablesAndQr.totalTables : 0,
          tone: d.tablesAndQr.tablesWithoutQrCode ? "accent" : "good",
          note: t("souk_tables_active", { n: n(d.tablesAndQr.activeTables) }),
          href: "/dashboard/restaurant/tables",
        },
        sub?.hasRegistration
          ? {
              label: t("subscription"),
              value: left === null ? "—" : n(Math.max(0, left)),
              of: left === null ? undefined : left < 0 ? t("sub_expired") : t("souk_days"),
              share: periodShare,
              tone: left !== null && left < 0 ? "danger" : left !== null && left <= 14 ? "warning" : "accent",
              note: (
                <>
                  {sub.planName ?? "—"}
                  <span className="mx-1.5">·</span>
                  <bdi className="tabular-nums">{formatMoney(sub.effectivePrice, sub.currencyCode ?? undefined, i18n.language)}</bdi>
                </>
              ),
            }
          : { label: t("subscription"), value: "—", note: t("no_subscription") },
        { label: t("val_processing"), value: n(m?.processing ?? 0), note: t("souk_waiting", { n: n(m?.pending ?? 0) }), href: "/dashboard/generation/jobs" },
        { label: t("categories"), value: n(d.menuContent.categoryCount), note: t("souk_items_n", { n: n(total) }), href: "/dashboard/menu/categories" },
        { label: t("items_active"), value: n(d.menuContent.activeItemCount), of: t("of_n", { n: n(total) }), share: total ? d.menuContent.activeItemCount / total : 0, href: "/dashboard/menu/items" },
        { label: t("items_no_ingredients"), value: n(d.menuContent.itemsMissingIngredientsCount), of: t("of_n", { n: n(total) }), share: total ? d.menuContent.itemsMissingIngredientsCount / total : 0, href: "/dashboard/menu/items" },
      ]
    : [];

  return (
    <section className="space-y-7">
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

      {q.isLoading && <Skeleton className="h-72 rounded-3xl" />}
      {q.isError && <p className="text-sm text-destructive">{t("stats_unavailable")}</p>}

      {d && (
        <section aria-labelledby="ready-title" className="grid overflow-hidden rounded-3xl border border-border bg-card shadow-card lg:grid-cols-[minmax(0,1fr)_minmax(0,1.75fr)]">
          {/* the readiness figure leads the slab; the ledger of the rest of the restaurant sits beside it */}
          <div className="flex flex-col gap-3 p-5 sm:p-7">
            <h2 id="ready-title" className="text-sm font-medium text-muted-foreground">{missing > 0 ? t("ready_title") : t("ready_title_done")}</h2>
            <p className="flex items-baseline gap-1 font-display font-bold tracking-[-0.02em] text-foreground">
              <RollingNumber value={readyShare * 100} className="text-[4rem] sm:text-[4.75rem]" />
              <span className="text-[1.75rem] font-medium text-muted-foreground">{i18n.language.startsWith("ar") ? "٪" : "%"}</span>
            </p>
            <Meter value={readyShare} label={t("ready_title")} />
            <p className="text-sm text-muted-foreground">
              {t("ready_counts", { ready: n(ready), total: n(total) })}
              {missing > 0 && toNext > 0 && <span className="mt-1 block font-medium text-foreground">{t("souk_ready_next", { n: n(toNext), p: n(nextPct) })}</span>}
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
          <div className="grid grid-cols-2 border-t border-border sm:grid-cols-4 lg:border-t-0">
            {cells.map((c) => <LedgerCell key={c.label} c={c} />)}
          </div>
        </section>
      )}

      <SoukBins restaurantId={restaurant?.id} />

      {d && <TicketRail items={tickets} />}

      <DishShelf restaurantId={restaurant?.id} />
    </section>
  );
}
