import { useHasPermission } from "@/hooks/useHasPermission";
import { useTranslation } from "react-i18next";
import NiceModal from "@ebay/nice-modal-react";
import DataTable from "@/components/common/DataTable";
import FormModal from "@/components/common/Modal/FormModal";
import DetailModal from "@/components/common/Modal/DetailModal";
import type { Columns, Filter } from "@/components/common/DataTable/interfaces/DataTableProps";
import type { FieldProps } from "@/components/common/Fields/interfaces/FieldProps";
import { Badge } from "@/components/ui/badge";
export { RowAction } from "@/components/common/DataTable/components/Actions/ActionsRow";
import type { createCrudApi } from "@/Api/crud";
import type { DataParams } from "@/Api/types";

type CrudApi<T> = ReturnType<typeof createCrudApi<T, any, any>>;

export interface ResourcePageProps<T extends { id: string | number }> {
  /** Translation key of the page title and of the add button ("add_x"). */
  title: string;
  api: CrudApi<T>;
  columns: Columns[];
  /** Form fields; `row` is set when editing so create-only fields can differ. */
  fields: (row?: T) => FieldProps[];
  initialState: (row?: T) => Record<string, unknown>;
  schema?: (row?: T) => unknown;
  /** Form values → request body. */
  toBody?: (values: any, row?: T) => unknown;
  filters?: Filter[];
  /** Permission group (e.g. "MenuItems"): add / edit / delete are offered only with `Group.Add` / `.Edit` / `.Delete`. */
  permissionGroup?: string;
  canCreate?: boolean;
  canEdit?: (row: T) => boolean;
  canDelete?: (row: T) => boolean;
  /** Row field shown in the delete confirmation. */
  deleteLabel?: string;
  /** Explains what deleting this kind of record means (shown in the delete dialog). */
  deleteDescription?: string;
  formWidth?: string;
  /** Extra row actions: rendered after the standard view / edit / delete. Use `RowAction` for icon buttons. */
  rowActions?: (row: T) => React.ReactNode;
  /** Custom view (a detail page or dialog); replaces the default detail dialog. */
  onView?: (row: T) => void;
  /** Width class of the default detail dialog. */
  detailWidth?: string;
  /** Adds names for ids to the detail record (a hook that returns the enrich function). */
  detailEnrich?: () => (data: any) => any;
  /** Show a read-only detail dialog fetched from `{api.path}/{id}`. */
  detail?: boolean;
  /** Called with the API reply after a record is created (e.g. to show a show-once secret). */
  onCreated?: (result: any) => void;
  /** Extra buttons next to the add button. */
  topActions?: () => React.ReactNode;
  /** Query params applied until the user filters (e.g. status=Pending). */
  defaultParams?: DataParams;
  /** Show the list as designed cards instead of a table. */
  renderCard?: (row: T, ctx: { actions: React.ReactNode; index: number; rows: T[] }) => React.ReactNode;
  cardGridClassName?: string;
  /** Rendered between the page title and the table (e.g. quick filter chips). */
  belowTitle?: React.ReactNode;
}

/** Active / inactive pill used by most lists. */
export const ActiveBadge = ({ active }: { active: boolean }) => {
  const { t } = useTranslation();
  return (
    <Badge variant={active ? "success" : "secondary"} appearance="light" size="md">
      {active ? t("active") : t("inactive")}
    </Badge>
  );
};

/** Title + card + DataTable + create/edit dialog + delete, driven by a `createCrudApi` resource. */
export function ResourcePage<T extends { id: string | number }>(props: ResourcePageProps<T>) {
  const { t } = useTranslation();
  const { api } = props;
  const remove = api.useRemove();
  const { hasPermission } = useHasPermission();
  const can = (action: string) => !props.permissionGroup || hasPermission(`${props.permissionGroup}.${action}`);

  const openForm = (row?: T) =>
    NiceModal.show(FormModal, {
      title: row ? t("edit") : t(`add_${props.title}`),
      fields: props.fields(row),
      initialState: props.initialState(row),
      validationSchema: props.schema?.(row),
      valuesBody: (values: any) => props.toBody?.(values, row) ?? values,
      query: row ? () => api.useUpdate(row.id) : () => api.useCreate(),
      width: props.formWidth,
      onDone: row ? undefined : props.onCreated,
    });

  return (
    <section className="space-y-5">
      <header>
        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">{t(props.title)}</h1>
      </header>
      {props.belowTitle}
      <div className={props.renderCard ? "" : "rounded-xl border border-border bg-card p-4 shadow-card"}>
        <DataTable
          query={(params) => api.useList({ ...props.defaultParams, ...params })}
          columns={props.columns}
          allowSearch
          filterSearchParamName="searchTerm"
          allowSorts={false}
          allowCreate={() => props.canCreate !== false && can("Add")}
          tableMode={props.renderCard ? "cards" : undefined}
          renderCard={props.renderCard as never}
          cardGridClassName={props.cardGridClassName}
          createText={props.canCreate === false || !can("Add") ? undefined : `add_${props.title}`}
          createAction={() => openForm()}
          allowEdit={(row) => can("Edit") && (props.canEdit ? props.canEdit(row) : true)}
          editAction={(row) => openForm(row)}
          allowDelete={(row) => can("Delete") && (props.canDelete ? props.canDelete(row) : true)}
          deleteQuery={remove}
          textDeleteAccessor={props.deleteLabel}
          deleteModalDescription={props.deleteDescription}
          filters={props.filters}
          secondaryActions={props.rowActions}
          primaryTopActions={props.topActions}
          allowView={props.onView || props.detail ? () => true : undefined}
          viewAction={
            props.onView
              ? props.onView
              : props.detail
                ? (row: T) =>
                    NiceModal.show(DetailModal, { title: t(props.title), path: `${api.path}/${row.id}`, width: props.detailWidth, useEnrich: props.detailEnrich })
                : undefined
          }
        />
      </div>
    </section>
  );
}
