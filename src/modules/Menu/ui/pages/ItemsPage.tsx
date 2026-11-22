import { can } from "@/modules/Auth/core/can";
import { useMemo, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Box, ImageOff } from "lucide-react";
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
/** Items as cards of data: photo, name, category, price, active switch and the 3D state. */
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
      key={`${onlyNoModel}-${fromPlate ?? ""}`}
      belowTitle={
        <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground">
          <Switch checked={onlyNoModel} onCheckedChange={setOnlyNoModel} aria-label={t("only_without_model")} />
          {t("only_without_model")}
        </label>
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
