import { useSufra } from "@/modules/Dashboard/ui/components/SufraMap";
import { Meter } from "@/modules/shared/ui/parts";
import { can } from "@/modules/Auth/core/can";
import { Can } from "@/components/common/Can";
import { useMemo } from "react";
import NiceModal from "@ebay/nice-modal-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, ChevronDown, ChevronUp, CornerDownRight, EyeOff, FolderTree, ImageOff, Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { FieldTypes } from "@/components/common/Fields/Enums/Field";
import { confirmAction } from "@/components/common/Modal/ConfirmDialog";
import FormModal from "@/components/common/Modal/FormModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { strOrNull } from "@/helpers/body";
import { fetchAll, getBilingual } from "@/modules/shared/core/lookups";
import { useRestaurantId, useRestaurants } from "@/modules/shared/core/restaurant";
import { EmptyState } from "@/modules/shared/ui/parts";
import { categoriesApi, type ICategory } from "../../core/api";

const KEY = ["menu-categories", "tree"];

/** Categories as a two-level tree: a category holds sub-categories, a sub-category holds items. */
export default function CategoriesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const restaurantId = useRestaurantId();
  const restaurants = useRestaurants();
  const multi = (restaurants.data?.length ?? 0) > 1;

  const cats = useQuery({ queryKey: KEY, queryFn: () => fetchAll<ICategory>("menu-categories") });
  const counts = useQuery({
    queryKey: ["menu-items", "counts"],
    queryFn: async () => {
      const m = new Map<string, number>();
      for (const i of await fetchAll<{ menuCategoryId: string }>("menu-items")) m.set(i.menuCategoryId, (m.get(i.menuCategoryId) ?? 0) + 1);
      return m;
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["menu-categories"] });

  // the dashboard's per-category 3D coverage (items and items with a live model, sub-categories included)
  const sufra = useSufra(restaurantId);
  const coverage = useMemo(() => new Map((sufra.data ?? []).map((p) => [p.id, p])), [sufra.data]);
  const rows = useMemo(() => (cats.data ?? []).filter((c) => !multi || !restaurantId || c.restaurantId === restaurantId), [cats.data, multi, restaurantId]);
  const parents = useMemo(() => rows.filter((c) => !c.parentCategoryId).sort((a, b) => a.displayOrder - b.displayOrder), [rows]);
  const kids = (id: string) => rows.filter((c) => c.parentCategoryId === id).sort((a, b) => a.displayOrder - b.displayOrder);

  const patch = useMutation({
    mutationFn: async (v: { c: ICategory; changes: Partial<{ displayOrder: number; isActive: boolean }> }) => {
      const b = await getBilingual<ICategory>("menu-categories", v.c.id, ["name", "description"]);
      return categoriesApi.update({ id: v.c.id, body: bodyOf(v.c, b, v.changes) });
    },
    onSuccess: refresh,
  });

  const open = async (row?: ICategory, parent?: ICategory) => {
    const b = row ? await getBilingual<ICategory>("menu-categories", row.id, ["name", "description"]) : undefined;
    return NiceModal.show(FormModal, {
      title: row ? t("edit") : parent ? t("add_subcategory") : t("add_category"),
      initialState: {
        nameEn: b?.en.name ?? "",
        nameAr: b?.ar.name ?? "",
        descriptionEn: b?.en.description ?? "",
        descriptionAr: b?.ar.description ?? "",
        displayOrder: row?.displayOrder ?? (parent ? kids(parent.id) : parents).length,
        parentCategoryId: row ? (row.parentCategoryId ?? "") : (parent?.id ?? ""),
        isActive: row?.isActive ?? true,
      },
      validationSchema: z.object({
        nameEn: z.string().min(1, t("field_required")).max(200),
        nameAr: z.string().max(200).optional().nullable(),
        descriptionEn: z.string().max(1000).optional().nullable(),
        descriptionAr: z.string().max(1000).optional().nullable(),
        displayOrder: z.coerce.number().int(),
        parentCategoryId: z.string().optional().nullable(),
        isActive: z.boolean().optional(),
      }),
      fields: [
        { name: "nameEn", pairName: "nameAr", control: FieldTypes.bilingual, label: t("name"), required: true },
        { name: "descriptionEn", pairName: "descriptionAr", control: FieldTypes.bilingual, multiline: true, rows: 3, label: t("description") },
        {
          name: "parentCategoryId",
          control: FieldTypes.select,
          label: t("parent_category"),
          helpertext: t("parent_category_hint"),
          // only top-level categories may be a parent, and never the category itself
          options: [{ value: "", label: t("none") }, ...parents.filter((p) => p.id !== row?.id).map((p) => ({ value: p.id, label: p.name }))],
        },
        { name: "displayOrder", control: FieldTypes.number, label: t("display_order") },
        ...(row ? [{ name: "isActive", control: FieldTypes.switch, label: t("active") }] : []),
      ],
      query: row ? () => categoriesApi.useUpdate(row.id) : () => categoriesApi.useCreate(),
      valuesBody: (v: any) => ({
        ...(row ? {} : { restaurantId }),
        parentCategoryId: v.parentCategoryId ? String(v.parentCategoryId) : null,
        nameEn: v.nameEn,
        nameAr: strOrNull(v.nameAr),
        descriptionEn: strOrNull(v.descriptionEn),
        descriptionAr: strOrNull(v.descriptionAr),
        displayOrder: Number(v.displayOrder) || 0,
        ...(row ? { isActive: !!v.isActive } : {}),
      }),
      onDone: refresh,
    });
  };

  const remove = async (c: ICategory) => {
    const n = (counts.data?.get(c.id) ?? 0) + kids(c.id).length;
    const ok = await confirmAction({
      title: t("delete_confirm_title"),
      description: n ? t("category_has_content") : t("delete_irreversible"),
      confirmText: t("delete"),
      danger: true,
    });
    if (!ok) return;
    try {
      await categoriesApi.remove(c.id);
      refresh();
    } catch {
      toast.error(t("something_went_wrong"));
    }
  };

  /** Swap the display order with the neighbour: the API has no bulk reorder, so each changed row is PUT. */
  const move = async (list: ICategory[], i: number, dir: -1 | 1) => {
    const a = list[i];
    const b = list[i + dir];
    if (!b) return;
    const ao = a.displayOrder === b.displayOrder ? i : a.displayOrder;
    const bo = a.displayOrder === b.displayOrder ? i + dir : b.displayOrder;
    await Promise.all([patch.mutateAsync({ c: a, changes: { displayOrder: bo } }), patch.mutateAsync({ c: b, changes: { displayOrder: ao } })]);
  };

  const Row = ({ c, list, i, sub }: { c: ICategory; list: ICategory[]; i: number; sub?: boolean }) => (
    <div className={cn("group/row flex items-center gap-2 px-4 py-2 transition-colors hover:bg-accent/40", sub && "ps-3")}>
      <span className="flex flex-col opacity-40 transition-opacity group-hover/row:opacity-100">
        <button type="button" aria-label={t("move_up")} disabled={i === 0 || !can("MenuCategories.Edit")} onClick={() => move(list, i, -1)} className="rounded p-0.5 hover:bg-accent disabled:opacity-30">
          <ChevronUp className="size-3.5" />
        </button>
        <button type="button" aria-label={t("move_down")} disabled={i === list.length - 1 || !can("MenuCategories.Edit")} onClick={() => move(list, i, 1)} className="rounded p-0.5 hover:bg-accent disabled:opacity-30">
          <ChevronDown className="size-3.5" />
        </button>
      </span>
      {sub && <CornerDownRight className="size-4 shrink-0 text-muted-foreground rtl:-scale-x-100" />}
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate font-medium", c.isActive ? "text-foreground" : "text-muted-foreground line-through decoration-muted-foreground/40")}>{c.name}</span>
        {c.description && <span className="block truncate text-xs text-muted-foreground">{c.description}</span>}
      </span>
      <span className="hidden shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground sm:inline">{t("n_items", { n: counts.data?.get(c.id) ?? 0 })}</span>
      <Switch checked={c.isActive} disabled={!can("MenuCategories.Edit")} aria-label={t("active")} onCheckedChange={(on) => patch.mutate({ c, changes: { isActive: on } })} />
      <span className="flex shrink-0 items-center gap-0.5">
        {!sub && (
          <Can permission="MenuCategories.Add">
            <Button type="button" variant="ghost" size="sm" onClick={() => open(undefined, c)} className="gap-1 text-xs text-primary">
              <Plus className="size-3.5" />
              {t("add_subcategory")}
            </Button>
          </Can>
        )}
        <Can permission="MenuCategories.Edit"><Button type="button" variant="ghost" size="icon" aria-label={t("edit")} onClick={() => open(c)}>
          <Pencil className="size-4" />
        </Button></Can>
        <Can permission="MenuCategories.Delete"><Button type="button" variant="ghost" size="icon" aria-label={t("delete")} onClick={() => remove(c)} className="hover:text-destructive">
          <Trash2 className="size-4" />
        </Button></Can>
      </span>
    </div>
  );

  /**
   * A top-level category as a stall on the souk: its own dishes' photos across the awning, the name and how many dishes
   * it holds, how much of it guests can turn in 3D, and its sub-categories as the stall's shelves.
   */
  const Stall = ({ c, i }: { c: ICategory; i: number }) => {
    const sub = kids(c.id);
    const cov = coverage.get(c.id);
    const photos = (cov?.dishes ?? []).slice(0, 3);
    const total = cov?.items ?? counts.data?.get(c.id) ?? 0;
    const share = cov && cov.items ? cov.models / cov.items : 0;
    const label = cov ? t("cat_3d_coverage", { n: cov.models, total: cov.items }) : "";
    return (
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: Math.min(i * 0.05, 0.35) }}
        className={cn("group/stall flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card", !c.isActive && "opacity-75")}
      >
        <Link
          to={"/dashboard/menu/items" as never}
          search={{ menuCategoryId: c.id } as never}
          className="relative block h-32 overflow-hidden bg-(--souk-bin) outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          aria-label={t("sufra_open", { name: c.name })}
        >
          {photos.length > 0 ? (
            <span className="flex h-full gap-0.5">
              {photos.map((d) => (
                <img key={d.id} src={d.photo} alt="" loading="lazy" decoding="async" className="h-full min-w-0 flex-1 object-cover transition-transform duration-700 ease-out group-hover/stall:scale-[1.04]" />
              ))}
            </span>
          ) : (
            <span className="souk-bin-fill--bare grid h-full place-items-center text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1"><ImageOff className="size-3.5" aria-hidden />{t("souk_no_photo")}</span>
            </span>
          )}
          {!c.isActive && (
            <span className="absolute start-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#261c1a]/75 px-2.5 py-0.5 text-[0.6875rem] font-medium text-[#fbf5e9]">
              <EyeOff className="size-3" aria-hidden />
              {t("hidden_from_guests")}
            </span>
          )}
          <span className="absolute end-3 top-3 grid size-8 place-items-center rounded-full bg-[#fbf5e9]/90 text-[#541f2d] opacity-0 transition-opacity group-hover/stall:opacity-100">
            <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden />
          </span>
        </Link>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-base font-semibold text-foreground">{c.name}</h2>
              {c.description && <p className="truncate text-xs text-muted-foreground">{c.description}</p>}
            </div>
            <Switch checked={c.isActive} disabled={!can("MenuCategories.Edit")} aria-label={t("active")} onCheckedChange={(on) => patch.mutate({ c, changes: { isActive: on } })} />
          </div>

          {cov && cov.items > 0 ? (
            <div className="flex flex-col gap-1.5" title={label}>
              <span className="flex items-baseline justify-between text-xs">
                <span className="text-muted-foreground">{t("n_items", { n: total })}</span>
                <span className="font-semibold tabular-nums text-foreground">{t("cat_3d_share", { n: Math.round(share * 100) })}</span>
              </span>
              <Meter thin value={share} tone={cov.models === cov.items ? "good" : "accent"} label={label} />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t("n_items", { n: total })}</p>
          )}

          {sub.length > 0 && (
            <ul className="-mx-4 divide-y divide-border border-y border-border bg-muted/25">
              {sub.map((s, j) => (
                <li key={s.id}><Row c={s} list={sub} i={j} sub /></li>
              ))}
            </ul>
          )}

          <div className="mt-auto flex items-center gap-1 border-t border-dashed border-border pt-3">
            <span className="flex">
              <button type="button" aria-label={t("move_up")} disabled={i === 0 || !can("MenuCategories.Edit")} onClick={() => move(parents, i, -1)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30">
                <ChevronUp className="size-4" />
              </button>
              <button type="button" aria-label={t("move_down")} disabled={i === parents.length - 1 || !can("MenuCategories.Edit")} onClick={() => move(parents, i, 1)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30">
                <ChevronDown className="size-4" />
              </button>
            </span>
            <span className="ms-auto flex items-center gap-0.5">
              <Can permission="MenuCategories.Add">
                <Button type="button" variant="ghost" size="sm" onClick={() => open(undefined, c)} className="gap-1 text-xs text-primary">
                  <Plus className="size-3.5" />
                  {t("add_subcategory")}
                </Button>
              </Can>
              <Can permission="MenuCategories.Edit"><Button type="button" variant="ghost" size="icon" aria-label={t("edit")} onClick={() => open(c)}>
                <Pencil className="size-4" />
              </Button></Can>
              <Can permission="MenuCategories.Delete"><Button type="button" variant="ghost" size="icon" aria-label={t("delete")} onClick={() => remove(c)} className="hover:text-destructive">
                <Trash2 className="size-4" />
              </Button></Can>
            </span>
          </div>
        </div>
      </motion.article>
    );
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">{t("categories")}</h1>
          <p className="text-sm text-muted-foreground">{t("categories_desc")}</p>
        </div>
        <Can permission="MenuCategories.Add">
          <Button type="button" variant="primary" onClick={() => open()} disabled={!restaurantId}>
            <Plus />
            {t("add_category")}
          </Button>
        </Can>
      </header>

      {cats.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : parents.length === 0 ? (
        <EmptyState icon={FolderTree} title={t("no_categories")} hint={t("no_categories_hint")} action={<Can permission="MenuCategories.Add"><Button variant="primary" onClick={() => open()}>{t("add_category")}</Button></Can>} />
      ) : (
        <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {parents.map((p, i) => <Stall key={p.id} c={p} i={i} />)}
        </div>
      )}
    </section>
  );
}

const bodyOf = (c: ICategory, b: { en: Record<string, string>; ar: Record<string, string> }, changes: Partial<{ displayOrder: number; isActive: boolean }>) => ({
  parentCategoryId: c.parentCategoryId ?? null,
  nameEn: b.en.name,
  nameAr: b.ar.name || null,
  descriptionEn: b.en.description || null,
  descriptionAr: b.ar.description || null,
  displayOrder: changes.displayOrder ?? c.displayOrder,
  isActive: changes.isActive ?? c.isActive,
});
