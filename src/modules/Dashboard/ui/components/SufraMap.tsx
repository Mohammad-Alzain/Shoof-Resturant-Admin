import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { can } from "@/modules/Auth/core/can";
import { fetchAll } from "@/modules/shared/core/lookups";
import type { ICategory, IItem, IModel3D } from "@/modules/Menu/core/api";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

interface Plate {
  id: string;
  name: string;
  items: number;
  models: number;
  photos: number;
  /** the category the plate opens: itself or the sub-category holding most of the work (the items list filters one category) */
  target: string;
}

/** One plate per top-level category: its own items plus its sub-categories' items, with 3D-model and photo coverage. */
const useSufra = (restaurantId?: string) =>
  useQuery({
    queryKey: ["dashboard", "sufra", restaurantId],
    enabled: !!restaurantId,
    staleTime: 60_000,
    queryFn: async (): Promise<Plate[]> => {
      const [categories, items, models] = await Promise.all([
        fetchAll<ICategory>("menu-categories", { restaurantId }),
        fetchAll<IItem>("menu-items", { restaurantId }),
        fetchAll<IModel3D>("menu-item-3d-models"),
      ]);
      const withModel = new Set(models.filter((m) => m.isActive && m.generationStatus === 2).map((m) => m.menuItemId));
      const parentOf = new Map(categories.map((c) => [c.id, c.parentCategoryId || c.id]));
      const plates = new Map<string, Plate>(
        categories
          .filter((c) => !c.parentCategoryId)
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((c) => [c.id, { id: c.id, name: c.name, items: 0, models: 0, photos: 0, target: c.id }]),
      );
      // per category: [items, items without a model]
      const work = new Map<string, [number, number]>();
      for (const item of items) {
        const plate = plates.get(parentOf.get(item.menuCategoryId) ?? item.menuCategoryId);
        if (!plate) continue;
        plate.items++;
        const has = withModel.has(item.id);
        if (has) plate.models++;
        if (item.images?.length) plate.photos++;
        const w = work.get(item.menuCategoryId) ?? [0, 0];
        work.set(item.menuCategoryId, [w[0] + 1, w[1] + (has ? 0 : 1)]);
      }
      for (const plate of plates.values()) {
        let best: [number, number] = [-1, -1];
        for (const [cat, w] of work) {
          if ((parentOf.get(cat) ?? cat) !== plate.id) continue;
          if (w[1] > best[1] || (w[1] === best[1] && w[0] > best[0])) {
            best = w;
            plate.target = cat;
          }
        }
      }
      return [...plates.values()];
    },
  });

/** A glazed plate seen from above: the outer ring fills with 3D coverage, the inner ring with photo coverage. */
function PlateMark({ plate, size = 112, delay = 0 }: { plate: Plate; size?: number; delay?: number }) {
  const { i18n } = useTranslation();
  const still = useReducedMotion();
  const share = (n: number) => (plate.items ? n / plate.items : 0);
  const R1 = 44;
  const R2 = 34;
  const c1 = 2 * Math.PI * R1;
  const c2 = 2 * Math.PI * R2;
  const ring = (r: number, c: number, value: number, color: string, width: number, d: number) => (
    <motion.circle
      cx="60"
      cy="60"
      r={r}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeDasharray={c}
      initial={{ strokeDashoffset: c }}
      animate={{ strokeDashoffset: c * (1 - Math.min(1, value)) }}
      transition={{ duration: still ? 0 : 1.1, ease: EASE, delay: still ? 0 : d }}
      transform="rotate(-90 60 60)"
    />
  );
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden className="drop-shadow-[0_8px_14px_rgb(20_6_8/0.35)]">
      {/* the plate: ivory glaze, a cobalt band on the rim */}
      <circle cx="60" cy="60" r="57" fill="#fbf5e9" />
      <circle cx="60" cy="60" r="55" fill="none" stroke="#b95035" strokeWidth="2.5" opacity="0.85" />
      <circle cx="60" cy="60" r="51" fill="none" stroke="#541f2d" strokeWidth="0.8" opacity="0.6" />
      <circle cx="60" cy="60" r={R1} fill="none" stroke="#e9ddcf" strokeWidth="7" />
      <circle cx="60" cy="60" r={R2} fill="none" stroke="#f1e8da" strokeWidth="4" />
      {ring(R1, c1, share(plate.models), "#541f2d", 7, delay)}
      {ring(R2, c2, share(plate.photos), "#b95035", 4, delay + 0.15)}
      <text x="60" y="56" textAnchor="middle" dominantBaseline="middle" fontSize="24" fontWeight="600" fill="#261c1a" style={{ fontFamily: "var(--font-display)" }}>
        {plate.items.toLocaleString(i18n.language)}
      </text>
      <text x="60" y="78" textAnchor="middle" fontSize="13" fontWeight="500" fill="#541f2d" style={{ fontFamily: "var(--font-sans)" }}>
        {plate.items ? `${Math.round(share(plate.models) * 100).toLocaleString(i18n.language)}%` : "—"}
      </text>
    </svg>
  );
}

function PlateLink({ plate, size, delay, className, style }: { plate: Plate; size: number; delay: number; className?: string; style?: React.CSSProperties }) {
  const { t, i18n } = useTranslation();
  const missing = plate.items - plate.models;
  return (
    <motion.div
      className={cn("flex", className)}
      style={style}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      <Link
        to={"/dashboard/menu/items" as never}
        search={(missing > 0 ? { menuCategoryId: plate.target, withoutModelOnly: true } : { menuCategoryId: plate.target }) as never}
        aria-label={t("sufra_aria", { name: plate.name, items: plate.items, models: plate.models, photos: plate.photos })}
        title={t("sufra_open", { name: plate.name })}
        className="group/plate flex w-[9.5rem] flex-col items-center gap-2 rounded-2xl p-1.5 text-center outline-none transition-transform duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-[#e9a283]"
      >
        <span className="transition-transform duration-300 group-hover/plate:rotate-[8deg]">
          <PlateMark plate={plate} size={size} delay={delay + 0.2} />
        </span>
        <span className="w-full truncate text-sm font-semibold text-[#fbf5e9]">{plate.name}</span>
        <span className={cn("text-xs", missing > 0 ? "text-[#f2b7a0]" : "text-[#d8c5ba]")}>
          {plate.items === 0 ? t("sufra_items_n", { n: (0).toLocaleString(i18n.language) }) : missing > 0 ? t("sufra_needs", { n: missing.toLocaleString(i18n.language) }) : t("sufra_done")}
        </span>
      </Link>
    </motion.div>
  );
}

/**
 * The dashboard's owning graphic: the menu laid out as a sufra. Categories are plates around a brass tray that carries the
 * totals; each plate opens its items. On narrow screens, or with many categories, the plates wrap into rows on the cloth.
 */
export function SufraMap({ restaurantId, className }: { restaurantId?: string; className?: string }) {
  const { t, i18n } = useTranslation();
  const allowed = can("MenuCategories.View") && can("MenuItems.View");
  const q = useSufra(allowed ? restaurantId : undefined);
  const plates = useMemo(() => q.data ?? [], [q.data]);
  const totals = plates.reduce((a, p) => ({ items: a.items + p.items, models: a.models + p.models, photos: a.photos + p.photos }), { items: 0, models: 0, photos: 0 });
  const pct = totals.items ? Math.round((totals.models / totals.items) * 100) : 0;
  const round = plates.length >= 3 && plates.length <= 8;
  if (!allowed) return null;

  return (
    <section className={cn("sufra-cloth relative overflow-hidden rounded-3xl p-5 text-[#fbf5e9] sm:p-7", className)} aria-labelledby="sufra-title">
      <header className="relative flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="max-w-md">
          <h2 id="sufra-title" className="font-display text-xl font-semibold sm:text-2xl">{t("sufra_title")}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[#e6d3c9]">{t("sufra_desc")}</p>
        </div>
        <ul className="flex items-center gap-4 text-xs text-[#e6d3c9]">
          <li className="flex items-center gap-2"><span aria-hidden className="grid h-3 w-7 place-items-center rounded-full bg-[#fbf5e9]"><span className="h-1.5 w-5 rounded-full bg-[#541f2d]" /></span>{t("sufra_models")}</li>
          <li className="flex items-center gap-2"><span aria-hidden className="grid h-3 w-7 place-items-center rounded-full bg-[#fbf5e9]"><span className="h-1 w-5 rounded-full bg-[#b95035]" /></span>{t("sufra_photos")}</li>
        </ul>
      </header>

      {q.isLoading && (
        <div className="relative mt-8 flex flex-wrap justify-center gap-6">
          {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="size-28 rounded-full bg-white/10" />)}
        </div>
      )}

      {q.isSuccess && plates.length === 0 && (
        <div className="relative mt-8 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/20 p-8 text-center">
          <p className="max-w-sm text-sm text-[#e6d3c9]">{t("sufra_empty")}</p>
          {can("MenuCategories.Add") && (
            <Link to={"/dashboard/menu/categories" as never} className="inline-flex items-center gap-2 rounded-xl bg-[#fbf5e9] px-4 py-2 text-sm font-semibold text-[#541f2d] hover:bg-white">
              <Plus className="size-4" />
              {t("add_category")}
            </Link>
          )}
        </div>
      )}

      {plates.length > 0 && (
        <>
          {/* round table: plates set around the brass tray (wide screens, 3 to 8 categories) */}
          {round && (
            <div className="relative mx-auto mt-2 hidden aspect-[1.1] w-full max-w-[38rem] md:block">
              <div className="absolute inset-[33%] grid place-items-center">
                <svg viewBox="0 0 200 200" aria-hidden className="absolute inset-0 size-full drop-shadow-[0_10px_18px_rgb(20_6_8/0.45)]">
                  <circle cx="100" cy="100" r="99" fill="#b95035" />
                  <circle cx="100" cy="100" r="92" fill="none" stroke="#8f3a25" strokeWidth="3" />
                  {[80, 66, 52].map((r) => <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#d9876b" strokeWidth="1" strokeDasharray="2 5" />)}
                </svg>
                <div className="relative text-center text-[#fbf5e9]">
                  <p className="font-display text-3xl font-semibold tabular-nums leading-none">{pct.toLocaleString(i18n.language)}%</p>
                  <p className="mt-1 text-[0.6875rem] font-medium">{t("sufra_models")}</p>
                  <p className="mt-2 text-xs tabular-nums">{t("sufra_items_n", { n: totals.items.toLocaleString(i18n.language) })}</p>
                </div>
              </div>
              {plates.map((p, i) => {
                const a = -Math.PI / 2 + (i / plates.length) * Math.PI * 2;
                // physical left/top: the circle is symmetric, and translate(-50%) is physical too, so RTL needs no mirroring
                const x = 50 + Math.cos(a) * 39;
                const y = 50 + Math.sin(a) * 37;
                return (
                  <PlateLink
                    key={p.id}
                    plate={p}
                    size={104}
                    delay={0.08 * i}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${x}%`, top: `${y}%` }}
                  />
                );
              })}
            </div>
          )}

          {/* rows on the cloth: phones, and menus with many categories */}
          <div className={cn("relative mt-6 flex flex-wrap justify-center gap-x-2 gap-y-5", round && "md:hidden")}>
            {plates.map((p, i) => (
              <PlateLink key={p.id} plate={p} size={96} delay={0.05 * Math.min(i, 12)} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
