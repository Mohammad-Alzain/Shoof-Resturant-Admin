import { useSufra } from "@/modules/Dashboard/ui/components/SufraMap";
import { Meter } from "@/modules/shared/ui/parts";
import { can } from "@/modules/Auth/core/can";
import { Can } from "@/components/common/Can";
import { useMemo } from "react";
import NiceModal from "@ebay/nice-modal-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, CornerDownRight, FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
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
    <div className={cn("group/row flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40", sub && "ps-10")}>
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
      {/* top-level rows: how much of the category (with its sub-categories) guests can already turn in 3D */}
      {!sub && coverage.get(c.id) && coverage.get(c.id)!.items > 0 && (
        <span className="hidden w-32 shrink-0 flex-col gap-1.5 md:flex" title={t("cat_3d_coverage", { n: coverage.get(c.id)!.models, total: coverage.get(c.id)!.items })}>
          <span className="text-[0.6875rem] text-muted-foreground">{t("cat_3d_share", { n: Math.round((coverage.get(c.id)!.models / coverage.get(c.id)!.items) * 100) })}</span>
          <Meter thin value={coverage.get(c.id)!.models / coverage.get(c.id)!.items} tone={coverage.get(c.id)!.models === coverage.get(c.id)!.items ? "good" : "accent"} label={t("cat_3d_coverage", { n: coverage.get(c.id)!.models, total: coverage.get(c.id)!.items })} />
        </span>
      )}
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
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : parents.length === 0 ? (
        <EmptyState icon={FolderTree} title={t("no_categories")} hint={t("no_categories_hint")} action={<Can permission="MenuCategories.Add"><Button variant="primary" onClick={() => open()}>{t("add_category")}</Button></Can>} />
      ) : (
        <div className="space-y-3">
          {parents.map((p, i) => {
            const sub = kids(p.id);
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.3) }} className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                <Row c={p} list={parents} i={i} />
                {sub.length > 0 && (
                  <div className="divide-y divide-border border-t border-border bg-muted/20">
                    {sub.map((s, j) => (
                      <Row key={s.id} c={s} list={sub} i={j} sub />
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
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
