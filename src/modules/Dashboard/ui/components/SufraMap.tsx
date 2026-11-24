import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { ImageOff, Plus, Rotate3d } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { can } from "@/modules/Auth/core/can";
import { fetchAll, formatPrice, useCurrencies } from "@/modules/shared/core/lookups";
import { isSafeUrl } from "@/helpers/url";
import { primaryImage, type ICategory, type IItem, type IModel3D } from "@/modules/Menu/core/api";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

export interface Dish {
  id: string;
  name: string;
  category: string;
  photo: string;
  has3d: boolean;
  price: number;
  currencyId: string;
}

interface Plate {
  id: string;
  name: string;
  items: number;
  models: number;
  photos: number;
  /** the category the plate opens: itself or the sub-category holding most of the work (the items list filters one category) */
  target: string;
  /** dishes of this category that have a photo, those with a 3D model first */
  dishes: Dish[];
}

/** The restaurant's whole menu (categories, dishes, live 3D models), read once and shared by every screen that needs it. */
export interface MenuData {
  categories: ICategory[];
  items: IItem[];
  models: IModel3D[];
}
const MENU_DATA_KEY = ["menu-items", "data"] as const;
export const menuDataKey = (restaurantId?: string) => [...MENU_DATA_KEY, restaurantId] as const;
const readMenuData = async (restaurantId?: string): Promise<MenuData> => {
  const [categories, items, models] = await Promise.all([
    fetchAll<ICategory>("menu-categories", { restaurantId }),
    fetchAll<IItem>("menu-items", { restaurantId }),
    fetchAll<IModel3D>("menu-item-3d-models"),
  ]);
  return { categories, items, models };
};

/** One plate per top-level category: its own items plus its sub-categories' items, with 3D-model and photo coverage. */
const toPlates = ({ categories, items, models }: MenuData): Plate[] => {
  const withModel = new Set(models.filter((m) => m.isActive && m.generationStatus === 2).map((m) => m.menuItemId));
  const parentOf = new Map(categories.map((c) => [c.id, c.parentCategoryId || c.id]));
  const plates = new Map<string, Plate>(
    categories
      .filter((c) => !c.parentCategoryId)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((c) => [c.id, { id: c.id, name: c.name, items: 0, models: 0, photos: 0, target: c.id, dishes: [] }]),
  );
  // per category: [items, items without a model]
  const work = new Map<string, [number, number]>();
  for (const item of items) {
    const plate = plates.get(parentOf.get(item.menuCategoryId) ?? item.menuCategoryId);
    if (!plate) continue;
    plate.items++;
    const has = withModel.has(item.id);
    if (has) plate.models++;
    const img = primaryImage(item);
    if (img) {
      plate.photos++;
      if (isSafeUrl(img.url)) plate.dishes.push({ id: item.id, name: item.name, category: plate.name, photo: img.url, has3d: has, price: item.price, currencyId: item.currencyId });
    }
    const w = work.get(item.menuCategoryId) ?? [0, 0];
    work.set(item.menuCategoryId, [w[0] + 1, w[1] + (has ? 0 : 1)]);
  }
  for (const plate of plates.values()) {
    plate.dishes.sort((a, b) => Number(b.has3d) - Number(a.has3d));
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
};

export const useMenuData = (restaurantId?: string) =>
  useQuery({ queryKey: menuDataKey(restaurantId), enabled: !!restaurantId, staleTime: 60_000, queryFn: () => readMenuData(restaurantId) });

/** The plates, from the shared menu data: the dashboard, its bins and the categories page cost one read between them. */
export const useSufra = (restaurantId?: string) =>
  useQuery({ queryKey: menuDataKey(restaurantId), enabled: !!restaurantId, staleTime: 60_000, queryFn: () => readMenuData(restaurantId), select: toPlates });

/**
 * One category as an open bin on a souk display: its own best dish photo fills the bin from the bottom, as high as the
 * share of its dishes that guests can already turn in 3D. Opens the category's items, filtered to those still missing one.
 */
function Bin({ plate, index }: { plate: Plate; index: number }) {
  const { t, i18n } = useTranslation();
  const still = useReducedMotion();
  const share = plate.items ? plate.models / plate.items : 0;
  const missing = plate.items - plate.models;
  const photo = plate.dishes[0]?.photo;
  const n = (v: number) => v.toLocaleString(i18n.language);
  // the label band keeps the top fifth of the bin clear, so a full bin never covers the name
  const level = `${Math.round(share * 78)}%`;
  return (
    <Link
      to={"/dashboard/menu/items" as never}
      search={(missing > 0 ? { menuCategoryId: plate.target, withoutModelOnly: true } : { menuCategoryId: plate.target }) as never}
      aria-label={t("sufra_aria", { name: plate.name, items: plate.items, models: plate.models, photos: plate.photos })}
      title={t("sufra_open", { name: plate.name })}
      className="souk-bin group/bin"
    >
      <motion.span
        aria-hidden
        className={cn("souk-bin-fill", !photo && "souk-bin-fill--bare")}
        style={photo ? { backgroundImage: `url("${photo}")` } : undefined}
        initial={{ height: still ? level : "0%" }}
        animate={{ height: level }}
        transition={{ duration: still ? 0 : 1.2, ease: EASE, delay: still ? 0 : 0.15 + index * 0.07 }}
      />
      <span className="relative z-10 flex flex-col gap-0.5 p-3">
        <span className="truncate text-sm font-semibold text-foreground">{plate.name}</span>
        <span className="text-xs text-muted-foreground">{t("of_count", { a: n(plate.models), b: n(plate.items) })}</span>
      </span>
      {!photo && plate.items > 0 && (
        <span className="absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-1 text-[0.6875rem] text-muted-foreground">
          <ImageOff className="size-4" aria-hidden />
          {t("souk_no_photo")}
        </span>
      )}
      <span className="souk-bin-chip">{plate.items ? `${n(Math.round(share * 100))}%` : "—"}</span>
    </Link>
  );
}

/** The menu as a souk display: one bin per top-level category, filled with its photos to the level of its 3D readiness. */
export function SoukBins({ restaurantId, className }: { restaurantId?: string; className?: string }) {
  const { t } = useTranslation();
  const allowed = can("MenuCategories.View") && can("MenuItems.View");
  const q = useSufra(allowed ? restaurantId : undefined);
  const plates = useMemo(() => q.data ?? [], [q.data]);
  if (!allowed) return null;

  return (
    <section className={cn("min-w-0", className)} aria-labelledby="bins-title">
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id="bins-title" className="font-display text-base font-semibold text-foreground">{t("souk_bins_title")}</h2>
        <p className="text-xs text-muted-foreground">{t("souk_bins_hint")}</p>
      </header>

      {q.isLoading && (
        <div className="souk-bins">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
        </div>
      )}

      {q.isSuccess && plates.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="max-w-sm text-sm text-muted-foreground">{t("sufra_empty")}</p>
          {can("MenuCategories.Add") && (
            <Link to={"/dashboard/menu/categories" as never} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              <Plus className="size-4" />
              {t("add_category")}
            </Link>
          )}
        </div>
      )}

      {plates.length > 0 && (
        <div className="souk-bins">
          {plates.map((p, i) => <Bin key={p.id} plate={p} index={i} />)}
        </div>
      )}
    </section>
  );
}

/**
 * A shelf of the menu's own dishes, photographed: the focused one widens to show itself (hover, focus, or tap), the rest
 * stay as slivers. Dishes guests can turn in 3D come first and carry the badge.
 */
export function DishShelf({ restaurantId, className }: { restaurantId?: string; className?: string }) {
  const { t, i18n } = useTranslation();
  const currencies = useCurrencies();
  const allowed = can("MenuCategories.View") && can("MenuItems.View");
  const q = useSufra(allowed ? restaurantId : undefined);
  const dishes = useMemo(() => {
    const all = (q.data ?? []).flatMap((p) => p.dishes);
    return all.sort((a, b) => Number(b.has3d) - Number(a.has3d)).slice(0, 7);
  }, [q.data]);
  const [focus, setFocus] = useState(0);
  if (!allowed || (q.isSuccess && dishes.length === 0)) return null;

  return (
    <section className={cn("min-w-0", className)} aria-labelledby="shelf-title">
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id="shelf-title" className="font-display text-base font-semibold text-foreground">{t("souk_shelf_title")}</h2>
        <Link to={"/dashboard/menu/items" as never} className="text-xs font-medium text-primary hover:underline">{t("view_all")}</Link>
      </header>
      {q.isLoading ? (
        <Skeleton className="h-56 rounded-2xl" />
      ) : (
        <ul className="souk-shelf">
          {dishes.map((d, i) => (
            <li key={d.id} className="souk-dish" data-focus={i === focus || undefined} onPointerEnter={() => setFocus(i)}>
              <Link
                to={`/dashboard/menu/items/${d.id}` as never}
                onFocus={() => setFocus(i)}
                className="absolute inset-0 z-20 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={d.name}
              />
              <img src={d.photo} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
              <span aria-hidden className="absolute inset-0 bg-linear-to-t from-[#261c1a]/80 via-[#261c1a]/10 to-transparent" />
              {d.has3d && (
                <span className="absolute end-2.5 top-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-[#fbf5e9]/92 px-2 py-0.5 text-[0.6875rem] font-bold text-[#541f2d]">
                  <Rotate3d className="size-3" aria-hidden />
                  3D
                </span>
              )}
              <span className="souk-dish-label">
                <span className="block truncate text-sm font-semibold">{d.name}</span>
                <span className="block truncate text-xs opacity-85">
                  {d.category}
                  <span className="mx-1.5">·</span>
                  <bdi className="tabular-nums">{formatPrice(d.price, currencies.data?.find((c) => c.id === d.currencyId), i18n.language)}</bdi>
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
