import { menuDataKey, useMenuData, useSufra } from "@/modules/Dashboard/ui/components/SufraMap";
import { Meter } from "@/modules/shared/ui/parts";
import { can } from "@/modules/Auth/core/can";
import { Can } from "@/components/common/Can";
import { useMemo, useState, type ReactNode } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import NiceModal from "@ebay/nice-modal-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, CornerDownRight, EyeOff, FolderTree, GripVertical, ImageOff, Pencil, Plus, Trash2 } from "lucide-react";
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
import { getBilingual } from "@/modules/shared/core/lookups";
import { useRestaurantId, useRestaurants } from "@/modules/shared/core/restaurant";
import { EmptyState } from "@/modules/shared/ui/parts";
import { categoriesApi, type ICategory } from "../../core/api";
import { ListSearch, useListSearch, useMatchingIds } from "@/modules/shared/ui/ListSearch";


/** What a sortable item hands its drag handle: the activator ref and the pointer/keyboard listeners. */
type Handle = { ref: (el: HTMLElement | null) => void; props: Record<string, unknown>; dragging: boolean };

/** One draggable entry (a stall in the grid or a shelf row in a stall); only its handle starts a drag. */
function Sortable({ id, disabled, className, children }: { id: string; disabled?: boolean; className?: string; children: (h: Handle) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition, zIndex: isDragging ? 30 : undefined, position: "relative" }}
      className={cn(className, isDragging && "[&>*]:shadow-[0_24px_40px_-18px_rgb(38_28_26/0.55)]")}
    >
      {children({ ref: setActivatorNodeRef, props: { ...attributes, ...listeners }, dragging: isDragging })}
    </div>
  );
}

/** The grip that picks an entry up: drag with the pointer, or focus it and use Space + arrow keys. */
function Grip({ h, label, disabled }: { h: Handle; label: string; disabled?: boolean }) {
  if (disabled) return null;
  return (
    <button
      type="button"
      ref={h.ref}
      {...h.props}
      aria-label={label}
      title={label}
      className={cn("grid size-7 shrink-0 touch-none place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", h.dragging ? "cursor-grabbing" : "cursor-grab")}
    >
      <GripVertical className="size-4" aria-hidden />
    </button>
  );
}

/** Categories as a two-level tree: a category holds sub-categories, a sub-category holds items. */
export default function CategoriesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const restaurantId = useRestaurantId();
  const restaurants = useRestaurants();
  const multi = (restaurants.data?.length ?? 0) > 1;

  // categories and their dish counts come from the menu data the dashboard shares: one read, not three
  const menu = useMenuData(restaurantId);
  const cats = { data: menu.data?.categories, isLoading: menu.isLoading };
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of menu.data?.items ?? []) m.set(i.menuCategoryId, (m.get(i.menuCategoryId) ?? 0) + 1);
    return { data: m };
  }, [menu.data]);
  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["menu-categories"] });
    await qc.invalidateQueries({ queryKey: menuDataKey(restaurantId) });
  };

  // the dashboard's per-category 3D coverage (items and items with a live model, sub-categories included)
  const sufra = useSufra(restaurantId);
  const coverage = useMemo(() => new Map((sufra.data ?? []).map((p) => [p.id, p])), [sufra.data]);
  const rows = useMemo(() => (cats.data ?? []).filter((c) => !multi || !restaurantId || c.restaurantId === restaurantId), [cats.data, multi, restaurantId]);
  // a reorder shows at once; the saved order replaces it once the server has every new position
  const [order, setOrder] = useState<Record<string, string[]>>({});
  const arrange = (key: string, list: ICategory[]) => {
    const o = order[key];
    if (!o) return list;
    const pos = new Map(o.map((id, i) => [id, i]));
    return [...list].sort((a, b) => (pos.get(a.id) ?? 0) - (pos.get(b.id) ?? 0));
  };
  const parents = arrange("root", rows.filter((c) => !c.parentCategoryId).sort((a, b) => a.displayOrder - b.displayOrder));
  const kids = (id: string) => arrange(id, rows.filter((c) => c.parentCategoryId === id).sort((a, b) => a.displayOrder - b.displayOrder));
  // The server decides what matches; a match inside a category keeps that category on screen.
  const search = useListSearch();
  const matches = useMatchingIds("menu-categories", search.term, restaurantId ? { restaurantId } : {});
  const shownKids = (c: ICategory) => (!matches || matches.has(c.id) ? kids(c.id) : kids(c.id).filter((k) => matches.has(k.id)));
  const shown = matches ? parents.filter((c) => matches.has(c.id) || kids(c.id).some((k) => matches.has(k.id))) : parents;
  // No reordering while searching: positions are only meaningful in the full list.
  const canEdit = can("MenuCategories.Edit") && !search.term;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

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

  /**
   * Move one entry to a new place in its list (by drag or by arrow) and save the list's order as 0..n. The API has no bulk
   * reorder, so only the rows whose position changed are PUT.
   */
  const reorder = async (key: string, list: ICategory[], from: number, to: number) => {
    if (from === to || to < 0 || to >= list.length) return;
    const next = arrayMove(list, from, to);
    setOrder((o) => ({ ...o, [key]: next.map((c) => c.id) }));
    try {
      await Promise.all(next.flatMap((c, i) => (c.displayOrder === i ? [] : [patch.mutateAsync({ c, changes: { displayOrder: i } })])));
    } catch {
      toast.error(t("something_went_wrong"));
    } finally {
      await refresh();
      setOrder((o) => {
        const rest = { ...o };
        delete rest[key];
        return rest;
      });
    }
  };
  const onDrop = (key: string, list: ICategory[]) => ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    reorder(key, list, list.findIndex((c) => c.id === active.id), list.findIndex((c) => c.id === over.id));
  };

  /** A sub-category: a shelf row inside its stall. The shelves stack, so its arrows point up and down. */
  const row = (c: ICategory, list: ICategory[], i: number, sub: boolean, h: Handle) => (
    <div className={cn("group/row flex items-center gap-2 bg-card/60 px-4 py-2 transition-colors hover:bg-accent/40", sub && "ps-2", h.dragging && "bg-card")}>
      <Grip h={h} label={t("drag_to_reorder")} disabled={!canEdit} />
      <span className="flex flex-col opacity-50 transition-opacity group-hover/row:opacity-100">
        <button type="button" aria-label={t("move_up")} disabled={i === 0 || !canEdit} onClick={() => reorder(c.parentCategoryId ?? "root", list, i, i - 1)} className="rounded p-0.5 hover:bg-accent disabled:opacity-30">
          <ChevronUp className="size-3.5" />
        </button>
        <button type="button" aria-label={t("move_down")} disabled={i === list.length - 1 || !canEdit} onClick={() => reorder(c.parentCategoryId ?? "root", list, i, i + 1)} className="rounded p-0.5 hover:bg-accent disabled:opacity-30">
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
   * it holds, how much of it guests can turn in 3D, and its sub-categories as the stall's shelves. Stalls sit in a grid
   * that reads from the start edge, so their arrows point to the start (earlier) and the end (later); on a phone the grid
   * is one column and the same arrows point up and down.
   */
  const stall = (c: ICategory, i: number, h: Handle) => {
    const sub = shownKids(c);
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
        className={cn("group/stall flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-shadow", !c.isActive && "opacity-75", h.dragging && "ring-2 ring-ring")}
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
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDrop(c.id, sub)}>
              <SortableContext items={sub.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="-mx-4 divide-y divide-border border-y border-border bg-muted/25">
                  {sub.map((s, j) => (
                    <Sortable key={s.id} id={s.id} disabled={!canEdit}>
                      {(sh) => row(s, sub, j, true, sh)}
                    </Sortable>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          <div className="mt-auto flex items-center gap-1 border-t border-dashed border-border pt-3">
            <span className="flex items-center">
              <Grip h={h} label={t("drag_to_reorder")} disabled={!canEdit} />
              {/* earlier = toward the start edge (right in Arabic, left in English); one column on phones = up */}
              <button type="button" aria-label={t("move_earlier")} title={t("move_earlier")} disabled={i === 0 || !canEdit} onClick={() => reorder("root", parents, i, i - 1)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30">
                <ChevronUp className="size-4 sm:hidden" aria-hidden />
                <ChevronLeft className="hidden size-4 sm:block rtl:-scale-x-100" aria-hidden />
              </button>
              <button type="button" aria-label={t("move_later")} title={t("move_later")} disabled={i === parents.length - 1 || !canEdit} onClick={() => reorder("root", parents, i, i + 1)} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30">
                <ChevronDown className="size-4 sm:hidden" aria-hidden />
                <ChevronRight className="hidden size-4 sm:block rtl:-scale-x-100" aria-hidden />
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

      <ListSearch value={search.text} onChange={search.setText} />

      {cats.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : parents.length > 0 && shown.length === 0 ? (
        <EmptyState icon={FolderTree} title={t("no_search_results")} hint={t("no_search_results_hint")} />
      ) : parents.length === 0 ? (
        <EmptyState icon={FolderTree} title={t("no_categories")} hint={t("no_categories_hint")} action={<Can permission="MenuCategories.Add"><Button variant="primary" onClick={() => open()}>{t("add_category")}</Button></Can>} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDrop("root", parents)}>
          <SortableContext items={shown.map((p) => p.id)} strategy={rectSortingStrategy}>
            <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((p, i) => (
                <Sortable key={p.id} id={p.id} disabled={!canEdit} className="h-full">
                  {(h) => stall(p, i, h)}
                </Sortable>
              ))}
            </div>
          </SortableContext>
        </DndContext>
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
