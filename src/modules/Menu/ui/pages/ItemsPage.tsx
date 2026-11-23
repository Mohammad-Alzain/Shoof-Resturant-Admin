import { can } from "@/modules/Auth/core/can";
import { useMemo, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Box, EyeOff, ImageOff, LayoutGrid, Rows3, Rotate3d } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { FieldTypes } from "@/components/common/Fields/Enums/Field";
import { ResourcePage } from "@/components/common/ResourcePage";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { strOrNull } from "@/helpers/body";
import { activeFilter } from "@/modules/shared/core/filters";
import { formatPrice, getBilingual, useCurrencies } from "@/modules/shared/core/lookups";
import { categoryPicker } from "@/modules/shared/core/pickers";
import { useCurrentRestaurant } from "@/modules/shared/core/restaurant";
import { itemsApi, primaryImage, type IItem } from "../../core/api";
type View = "gallery" | "table";
const VIEW_KEY = "shoof.items.view";
const readView = (): View => {
  try {
    return localStorage.getItem(VIEW_KEY) === "table" ? "table" : "gallery";
  } catch {
    return "gallery";
  }
};

/** A two-way segmented switch on one pill: the chosen side sits on the card colour. */
function Segmented<V extends string>({ value, onChange, options, label }: { value: V; onChange: (v: V) => void; options: { value: V; label: string; icon?: React.ComponentType<{ className?: string }> }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-border bg-muted/60 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === o.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.icon && <o.icon className="size-3.5" />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Items as a gallery of dishes (photo first, the way guests meet them) or as a table; the choice is remembered. */
export default function ItemsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const currencies = useCurrencies();
  const { restaurant } = useCurrentRestaurant();
  const plateWantsMissing = useRouterState({ select: (s) => Boolean((s.location.search as { withoutModelOnly?: boolean }).withoutModelOnly) });
  const [onlyNoModel, setOnlyNoModel] = useState(plateWantsMissing);
  // opened from a plate on the dashboard: start filtered to that category
  const fromPlate = useRouterState({ select: (s) => (s.location.search as { menuCategoryId?: string }).menuCategoryId });

  const [view, setViewState] = useState<View>(readView);
  const setView = (v: View) => {
    setViewState(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* private mode: the choice lasts for this visit */
    }
  };
  const curOf = useMemo(() => new Map((currencies.data ?? []).map((c) => [c.id, c])), [currencies.data]);

  const toggle = async (item: IItem, on: boolean) => {
    const b = await getBilingual<IItem>("menu-items", item.id, ["name", "description"]);
    await itemsApi.update({
      id: item.id,
      body: { nameEn: b.en.name, nameAr: b.ar.name || null, descriptionEn: b.en.description || null, descriptionAr: b.ar.description || null, price: item.price, currencyId: item.currencyId, displayOrder: item.displayOrder, isActive: on },
    });
    qc.invalidateQueries({ queryKey: ["menu-items"] });
  };

  return (
    <ResourcePage<IItem>
      permissionGroup="MenuItems"
      title="items"
      api={itemsApi}
      deleteLabel="name"
      defaultParams={onlyNoModel || fromPlate ? { ...(onlyNoModel ? { withoutModelOnly: true } : {}), ...(fromPlate ? { menuCategoryId: fromPlate } : {}) } : undefined}
      key={`${onlyNoModel}-${fromPlate ?? ""}-${view}`}
      belowTitle={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            label={t("only_without_model")}
            value={onlyNoModel ? "missing" : "all"}
            onChange={(v) => setOnlyNoModel(v === "missing")}
            options={[
              { value: "all", label: t("items_all") },
              { value: "missing", label: t("only_without_model"), icon: Box },
            ]}
          />
          <Segmented
            label={t("items_view")}
            value={view}
            onChange={setView}
            options={[
              { value: "gallery", label: t("items_view_gallery"), icon: LayoutGrid },
              { value: "table", label: t("items_view_table"), icon: Rows3 },
            ]}
          />
        </div>
      }
      cardGridClassName="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
      renderCard={
        view === "gallery"
          ? (i: IItem, { actions, index }) => {
              const img = primaryImage(i);
              const model = i.activeModel?.glbUrl;
              const href = `/dashboard/menu/items/${i.id}`;
              return (
                <article className={cn("dish-card group/dish relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card", !i.isActive && "dish-card--off")} style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}>
                  <Link to={href as never} className="relative block aspect-[4/3] overflow-hidden bg-(--souk-bin) outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" aria-label={`${t("open_editor")}: ${i.name}`}>
                    {img ? (
                      <img src={img.url} alt="" loading="lazy" decoding="async" className="size-full object-cover transition-transform duration-700 ease-out group-hover/dish:scale-[1.05]" />
                    ) : (
                      <span className="souk-bin-fill--bare flex size-full flex-col items-center justify-center gap-1.5 text-xs text-muted-foreground">
                        <ImageOff className="size-6" aria-hidden />
                        {t("souk_no_photo")}
                      </span>
                    )}
                    <span aria-hidden className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-[#261c1a]/45 to-transparent" />
                    {model ? (
                      <span className="absolute end-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-[#fbf5e9]/92 px-2 py-0.5 text-[0.6875rem] font-bold text-[#541f2d] shadow-sm">
                        <Rotate3d className="size-3.5" aria-hidden />
                        {i.activeModel?.sourceType === 1 ? t("model_manual") : "3D"}
                      </span>
                    ) : (
                      <span className="absolute end-2.5 top-2.5 rounded-full bg-[#261c1a]/65 px-2 py-0.5 text-[0.6875rem] font-medium text-[#fbf5e9]">{t("no_model")}</span>
                    )}
                    {!i.isActive && (
                      <span className="absolute start-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-[#261c1a]/75 px-2 py-0.5 text-[0.6875rem] font-medium text-[#fbf5e9]">
                        <EyeOff className="size-3" aria-hidden />
                        {t("hidden_from_guests")}
                      </span>
                    )}
                    <span dir="ltr" className="absolute bottom-2.5 start-2.5 rounded-full bg-[#fbf5e9] px-2.5 py-0.5 text-sm font-semibold tabular-nums text-[#261c1a] shadow-sm">
                      {formatPrice(i.price, curOf.get(i.currencyId), i18n.language)}
                    </span>
                  </Link>
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-[0.9375rem] font-semibold text-foreground">{i.name}</h3>
                      <p className="truncate text-xs text-muted-foreground">{i.menuCategoryName}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-dashed border-border pt-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                        <Switch checked={i.isActive} disabled={!can("MenuItems.Edit")} aria-label={t("active")} onCheckedChange={(on) => toggle(i, on)} />
                        {i.isActive ? t("visible_to_guests") : t("hidden_from_guests")}
                      </label>
                      <span className="flex items-center">{actions}</span>
                    </div>
                  </div>
                </article>
              );
            }
          : undefined
      }
      columns={[
        {
          header: "item",
          access: "name",
          Cell: (_c, _v, i: IItem) => {
            const img = primaryImage(i);
            return (
              <span className="flex min-w-0 items-center gap-3">
                {img ? (
                  <img src={img.url} alt="" loading="lazy" className="size-12 shrink-0 rounded-xl border border-border object-cover" />
                ) : (
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-dashed border-border text-muted-foreground">
                    <ImageOff className="size-5" />
                  </span>
                )}
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium text-foreground">{i.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{i.menuCategoryName}</span>
                </span>
              </span>
            );
          },
        },
        { header: "price", access: "price", Cell: (_c, _v, i: IItem) => <span dir="ltr" className="font-semibold tabular-nums">{formatPrice(i.price, curOf.get(i.currencyId), i18n.language)}</span> },
        {
          header: "model_3d",
          access: "id",
          Cell: (_c, _v, i: IItem) =>
            // `activeModel` comes with the item (guide §4): no separate list of every model to load.
            i.activeModel?.glbUrl ? (
              <Badge variant="success" appearance="light" size="md" className="gap-1"><Box className="size-3.5" />{i.activeModel.sourceType === 1 ? t("model_manual") : t("val_ready")}</Badge>
            ) : (
              <Badge variant="secondary" appearance="light" size="md">{t("no_model")}</Badge>
            ),
        },
        { header: "status", access: "isActive", Cell: (_c, _v, i: IItem) => <Switch checked={i.isActive} disabled={!can("MenuItems.Edit")} aria-label={t("active")} onCheckedChange={(on) => toggle(i, on)} /> },
      ]}
      filters={[{ ...categoryPicker({ label: t("category") }) }, activeFilter(t)]}
      schema={() =>
        z.object({
          menuCategoryId: z.string({ message: t("field_required") }).min(1, t("field_required")),
          nameEn: z.string().min(1, t("field_required")).max(200),
          nameAr: z.string().max(200).optional().nullable(),
          descriptionEn: z.string().max(2000).optional().nullable(),
          descriptionAr: z.string().max(2000).optional().nullable(),
          price: z.coerce.number({ message: t("field_required") }).min(0),
          currencyId: z.string().optional().nullable(),
          displayOrder: z.coerce.number().int(),
        })
      }
      initialState={() => ({ menuCategoryId: null, nameEn: "", nameAr: "", descriptionEn: "", descriptionAr: "", price: "", currencyId: restaurant?.currencyId ?? "", displayOrder: 0 })}
      toBody={(v) => ({
        menuCategoryId: String(v.menuCategoryId),
        nameEn: v.nameEn,
        nameAr: strOrNull(v.nameAr),
        descriptionEn: strOrNull(v.descriptionEn),
        descriptionAr: strOrNull(v.descriptionAr),
        price: Number(v.price),
        currencyId: v.currencyId ? String(v.currencyId) : null,
        displayOrder: Number(v.displayOrder) || 0,
      })}
      fields={() => [
        { ...categoryPicker({ label: t("category"), required: true }) },
        { name: "nameEn", pairName: "nameAr", control: FieldTypes.bilingual, label: t("name"), required: true },
        { name: "descriptionEn", pairName: "descriptionAr", control: FieldTypes.bilingual, multiline: true, rows: 3, label: t("description") },
        { name: "price", control: FieldTypes.number, label: t("price"), required: true },
        { name: "currencyId", control: FieldTypes.select, label: t("currency"), options: (currencies.data ?? []).map((c) => ({ value: c.id, label: `${c.isoCode} (${c.symbol})` })) },
        { name: "displayOrder", control: FieldTypes.number, label: t("display_order") },
      ]}
      canEdit={() => false}
      onView={(row) => navigate({ to: `/dashboard/menu/items/${row.id}` as never })}
      rowActions={(row) => (
        <button type="button" onClick={() => navigate({ to: `/dashboard/menu/items/${row.id}` as never })} className="rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-accent">
          {t("open_editor")}
        </button>
      )}
    />
  );
}
