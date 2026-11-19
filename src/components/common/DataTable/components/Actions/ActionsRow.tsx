import React from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import { useModal } from "@ebay/nice-modal-react";
import { useTranslation } from "react-i18next";
import { DataTableProps } from "../../interfaces/DataTableProps";
import DeleteTablePopover from "./components/DeleteModal";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Props = {
  row: any;
  keyProp?: any;
  setRowSelected?: any;
  setShowDrawer?: any;
  setUpdateChangeStatus?: any;
};

export const actionStyle = "size-8 shrink-0 rounded-lg p-0 text-muted-foreground transition-colors";

/** Icon button with a tooltip: the building block of every row action (standard and extra). */
export function RowAction({
  label,
  onClick,
  children,
  tone = "default",
  disabled,
}: {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  tone?: "default" | "danger";
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          aria-label={label}
          disabled={disabled}
          className={cn(actionStyle, tone === "danger" ? "hover:bg-destructive/10 hover:text-destructive" : "hover:bg-accent hover:text-accent-foreground")}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Row actions in a fixed order: view, edit, delete, then the page's extra actions last.
 * `viewAction` replaces the default view (a custom detail page or dialog); extras come from `primaryActions` / `secondaryActions`.
 */
function ActionsRow<T extends object>(props: Props & DataTableProps<T>) {
  const { t } = useTranslation();
  const routerState = useRouterState();
  const modalDelete = useModal(DeleteTablePopover);
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const row = props.row;

  const canView = typeof props.allowView === "function" && props.allowView(row);
  const canEdit = typeof props.allowEdit === "function" && props.allowEdit(row);
  const canDelete = typeof props.allowDelete === "function" && props.allowDelete(row);

  const view = (e: React.MouseEvent) => {
    e.preventDefault();
    if (props.viewAction) return props.viewAction(row);
    e.stopPropagation();
    if (props.viewModal) return props.viewModal.show({ params, id: row?.Id, row });
    navigate({ to: `${row?.id}` });
  };
  const edit = (e: React.MouseEvent) => {
    e.preventDefault();
    if (props.editAction) return props.editAction(row, props.keyProp);
    e.stopPropagation();
    props.createModal?.show({ params, id: row?.id, row, ...props.addEditProps, routerState });
  };
  const remove = (e: React.MouseEvent) => {
    e.preventDefault();
    if (props.deleteAction) return props.deleteAction(row, props.keyProp);
    e.stopPropagation();
    modalDelete.show({
      id: row?.id,
      deleteModalTitle: props.deleteModalTitle,
      deleteQuery: props.deleteQuery,
      row,
      textAccess: props.textDeleteAccessor,
    });
  };

  const buttons = (
    <>
      {canView && (
        <RowAction label={t("view_tool_tip")} onClick={view}>
          <Eye className="size-[17px]" />
        </RowAction>
      )}
      {canEdit && (
        <RowAction label={t("edit_tool_tip")} onClick={edit}>
          <Pencil className="size-[17px]" />
        </RowAction>
      )}
      {canDelete && (
        <RowAction label={t("delete_tool_tip")} onClick={remove} tone="danger">
          <Trash2 className="size-[17px]" />
        </RowAction>
      )}
      {props.primaryActions?.(row)}
      {props.secondaryActions?.(row)}
    </>
  );

  return props.tableMode === "table" || !props.tableMode ? (
    <td align="left" className="table-td text-start">
      <div className="flex items-center gap-0.5">{buttons}</div>
    </td>
  ) : (
    <div className="flex items-center gap-0.5">{buttons}</div>
  );
}

export default ActionsRow;
