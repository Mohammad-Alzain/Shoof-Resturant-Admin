import { Can } from "@/components/common/Can";
import NiceModal from "@ebay/nice-modal-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Pencil } from "lucide-react";
import { z } from "zod";
import { FieldTypes } from "@/components/common/Fields/Enums/Field";
import FormModal from "@/components/common/Modal/FormModal";
import { ResourcePage, RowAction } from "@/components/common/ResourcePage";
import { strOrNull } from "@/helpers/body";
import { getBilingual } from "@/modules/shared/core/lookups";
import { ingredientsApi, type IIngredient } from "../../core/api";

const schema = (t: (k: string) => string) =>
  z.object({
    nameEn: z.string().min(1, t("field_required")).max(150),
    nameAr: z.string().max(150).optional().nullable(),
    descriptionEn: z.string().max(1000).optional().nullable(),
    descriptionAr: z.string().max(1000).optional().nullable(),
  });

const fields = (t: (k: string) => string) => [
  { name: "nameEn", pairName: "nameAr", control: FieldTypes.bilingual, label: t("name"), required: true },
  { name: "descriptionEn", pairName: "descriptionAr", control: FieldTypes.bilingual, multiline: true, rows: 3, label: t("description") },
];

const body = (v: any) => ({ nameEn: v.nameEn, nameAr: strOrNull(v.nameAr), descriptionEn: strOrNull(v.descriptionEn), descriptionAr: strOrNull(v.descriptionAr) });

/** The restaurant-wide library of reusable ingredients. */
export default function IngredientsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const edit = async (row: IIngredient) => {
    const b = await getBilingual<IIngredient>("ingredients", row.id, ["name", "description"]);
    NiceModal.show(FormModal, {
      title: t("edit"),
      initialState: { nameEn: b.en.name, nameAr: b.ar.name, descriptionEn: b.en.description, descriptionAr: b.ar.description },
      validationSchema: schema(t),
      fields: fields(t),
      query: () => ingredientsApi.useUpdate(row.id),
      valuesBody: body,
      onDone: () => qc.invalidateQueries({ queryKey: ["ingredients"] }),
    });
  };

  return (
    <ResourcePage<IIngredient>
      permissionGroup="Ingredients"
      title="ingredients"
      api={ingredientsApi}
      deleteLabel="name"
      filters={[{ name: "unusedOnly", control: FieldTypes.select, label: t("usage_filter"), options: [{ value: true, label: t("unused_only") }] }]}
      canEdit={() => false}
      columns={[
        { header: "name", sortKey: "name", access: "name", Cell: (_c, _v, i: IIngredient) => <span className="font-medium text-foreground">{i.name}</span> },
        { header: "description", sortKey: "description", access: "description", Cell: (_c, _v, i: IIngredient) => <span className="block max-w-[28rem] truncate text-muted-foreground" title={i.description ?? ""}>{i.description || "—"}</span> },
      ]}
      schema={() => schema(t)}
      initialState={() => ({ nameEn: "", nameAr: "", descriptionEn: "", descriptionAr: "" })}
      toBody={body}
      fields={() => fields(t)}
      rowActions={(row) => (
        <Can permission="Ingredients.Edit">
          <RowAction label={t("edit")} onClick={() => edit(row)}>
            <Pencil className="size-[17px]" />
          </RowAction>
        </Can>
      )}
    />
  );
}
