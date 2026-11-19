import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Ban, Box, CheckCheck, ImageOff, Loader2, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { fetchAll } from "@/modules/shared/core/lookups";
import { EmptyState, QuotaStrip } from "@/modules/shared/ui/parts";
import { primaryImage, type IItem } from "@/modules/Menu/core/api";
import { remainingCap, useBulkGenerate, useCancelBatch, useQuota, type IBulkResult } from "../../core/api";

const MAX = 500;

/** Pick the dishes that have no 3D model, cap the pick at what the quota allows, and see per-dish what happened. */
export default function BulkPage() {
  const { t } = useTranslation();
  const [onlyMissing, setOnlyMissing] = useState(true);
  const [term, setTerm] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [forceNew, setForceNew] = useState(false);
  const [result, setResult] = useState<IBulkResult | null>(null);
  const quota = useQuota();
  const bulk = useBulkGenerate();
  const cancelBatch = useCancelBatch();

  const items = useQuery({ queryKey: ["menu-items", "bulk", onlyMissing], queryFn: () => fetchAll<IItem>("menu-items", { isActive: true, ...(onlyMissing ? { withoutModelOnly: true } : {}) }) });
  const shown = useMemo(() => (items.data ?? []).filter((i) => !term.trim() || i.name.toLowerCase().includes(term.trim().toLowerCase())), [items.data, term]);
  const cap = remainingCap(quota.data);
  const limit = Math.min(MAX, cap ?? MAX);
  const names = useMemo(() => new Map((items.data ?? []).map((i) => [i.id, i.name])), [items.data]);

  const toggle = (id: string) =>
    setPicked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else if (n.size < limit) n.add(id);
      else toast.warning(t("bulk_cap_reached", { n: limit }));
      return n;
    });
  const selectAll = () => setPicked(new Set(shown.slice(0, limit).map((i) => i.id)));

  const run = () =>
    bulk.mutate(
      { menuItemIds: [...picked], forceNew },
      {
        onSuccess: (r) => {
          setResult(r);
          setPicked(new Set());
          items.refetch();
        },
      },
    );

  const SKIP: Record<string, string> = { NotFound: "skip_notfound", AlreadyProcessing: "skip_processing", NoMeaningfulChange: "skip_nochange", QuotaExceeded: "skip_quota", MonthlyQuotaExceeded: "skip_monthly" };

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">{t("bulk_generation")}</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">{t("bulk_desc")}</p>
      </header>
      <QuotaStrip />

      {result && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 rounded-2xl border border-success/30 bg-success/5 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <CheckCheck className="size-5 text-success" />
            <p className="flex-1 font-semibold text-foreground">{t("bulk_started", { n: result.created.length })}</p>
            {result.batchId && (
              <>
                <Link to={`/dashboard/generation/jobs?batchId=${result.batchId}` as never} className="text-sm font-medium text-primary hover:underline">{t("track_progress")}</Link>
                <Button type="button" variant="outline" size="sm" disabled={cancelBatch.isPending} onClick={() => cancelBatch.mutate(result.batchId!, { onSuccess: (n) => toast.success(t("bulk_cancelled", { n })) })}>
                  <Ban />
                  {t("cancel_remaining")}
                </Button>
              </>
            )}
          </div>
          {result.skipped.length > 0 && (
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card text-sm">
              {result.skipped.map((s) => (
                <li key={s.menuItemId} className="flex items-center justify-between gap-3 px-3.5 py-2">
                  <span className="truncate font-medium">{names.get(s.menuItemId) ?? s.menuItemId}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{t(SKIP[s.reason] ?? "skip_other")}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder={t("search_for_item")} className="h-10 ps-9" />
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium">
          <Switch checked={onlyMissing} onCheckedChange={(v) => { setOnlyMissing(v); setPicked(new Set()); }} aria-label={t("only_without_model")} />
          {t("only_without_model")}
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium" title={t("force_new_hint")}>
          <Switch checked={forceNew} onCheckedChange={setForceNew} aria-label={t("force_new")} />
          {t("force_new")}
        </label>
        <Button type="button" variant="outline" size="sm" onClick={selectAll} disabled={!shown.length}>{t("select_all")}</Button>
        {picked.size > 0 && <Button type="button" variant="ghost" size="sm" onClick={() => setPicked(new Set())}>{t("clear")}</Button>}
      </div>

      {items.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : shown.length === 0 ? (
        <EmptyState icon={Box} title={onlyMissing ? t("bulk_all_done") : t("no_items")} hint={onlyMissing ? t("bulk_all_done_hint") : undefined} />
      ) : (
        <ul className="grid gap-3 pb-24 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((i) => {
            const on = picked.has(i.id);
            const img = primaryImage(i);
            return (
              <li key={i.id}>
                <button type="button" aria-pressed={on} onClick={() => toggle(i.id)} className={cn("flex w-full items-center gap-3 rounded-2xl border p-3 text-start transition-[border-color,background-color,box-shadow] duration-150", on ? "border-primary bg-primary/[0.05] ring-1 ring-primary" : "border-border bg-card hover:border-primary/40")}>
                  {img ? <img src={img.url} alt="" loading="lazy" className="size-14 shrink-0 rounded-xl object-cover" /> : <span className="grid size-14 shrink-0 place-items-center rounded-xl border border-dashed border-border text-muted-foreground"><ImageOff className="size-5" /></span>}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">{i.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{i.menuCategoryName}</span>
                  </span>
                  <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border text-primary-foreground transition-colors", on ? "border-primary bg-primary" : "border-border")}>{on && <CheckCheck className="size-3.5" />}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* the action bar sticks to the bottom while dishes are picked */}
      {picked.size > 0 && (
        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-2xl items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-2xl md:start-[20rem] md:inset-x-auto">
          <p className="flex-1 ps-2 text-sm font-medium text-foreground">
            {t("n_selected", { n: picked.size })}
            <span className="ms-2 text-xs font-normal text-muted-foreground">{cap === null ? "" : t("cap_n", { n: cap })}</span>
          </p>
          <Button type="button" variant="primary" disabled={bulk.isPending} onClick={run}>
            {bulk.isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {t("generate_n", { n: picked.size })}
          </Button>
        </motion.div>
      )}
    </section>
  );
}
