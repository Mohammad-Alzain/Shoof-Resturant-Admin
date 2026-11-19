import i18next from "@/Translation/i18n";
import React, { useContext } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Columns, DataTableProps } from "../../interfaces/DataTableProps";
import { getNestedValue } from "../../../../../helpers/objects";
import ActionsRow from "../Actions/ActionsRow";
import { Checkbox } from "@/components/ui/checkbox";
import { TableFilterContext } from "../../Context/TableFilterProvider";
import { Slider } from "iconsax-react";

type Props = {
  row: any;
  keyProp: any;
  className?: string;
  ref?: React.Ref<HTMLTableRowElement>;
  "data-index"?: number;
};

export function SortableRow<T extends object>(props: Props & DataTableProps<T>) {
  const { handleCheckOne, checkedRows, tableSetting } = useContext(TableFilterContext);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.row.id });

  const handleRef = (node: HTMLTableRowElement | null) => {
    setNodeRef(node);
    if (typeof props.ref === "function") {
      props.ref(node);
    } else if (props.ref && "current" in (props.ref as any)) {
      (props.ref as any).current = node;
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 99 : 1,
    position: (isDragging ? "relative" : "static") as any,
    opacity: isDragging ? 0.8 : 1,
  };

  const checked = checkedRows?.findIndex((item) => item === props?.row?.id) !== -1;
  const showActions =
    props?.allowDelete ||
    props?.allowEdit ||
    props?.allowView ||
    props?.primaryActions ||
    props?.secondaryActions;

  return (
    <tr
      ref={handleRef}
      data-index={props["data-index"]}
      style={style}
      className={
        " border-b border-muted text-sm transition-colors hover:bg-muted/50 " +
        (isDragging ? " bg-muted shadow-xl border-primary/30 " : " bg-transparent ") +
        (props.className || "")
      }
      onClick={() => {
        if (typeof props?.ClickRowAction == "function")
          props?.ClickRowAction(props?.row);
      }}
    >
      <td className="ps-4" style={{ cursor: "grab" }}>
        <button
          className="p-1.5 hover:bg-accent rounded-md transition-all active:cursor-grabbing text-muted-foreground hover:text-foreground"
          aria-label={i18next.t("a11y_drag_reorder")}
          {...attributes}
          {...listeners}
          type="button"
        >
          <Slider size="18" color="currentColor" variant="Outline" className="rotate-90" />
        </button>
      </td>
      {props?.allowCheckBox && (
        <td className="ps-4 pt-1">
          <Checkbox
            color="muted"
            checked={checked}
            onCheckedChange={(value: boolean) => {
              handleCheckOne(value, props?.row);
            }}
            aria-label={i18next.t("a11y_select_row")}
            className="hover:border-blue-500 transition-all"
          />
        </td>
      )}
      {props?.columns?.map((cell: Columns, key: any) => {
        return (
          tableSetting?.showedColumns[cell?.header] && (
            <td
              key={key + cell.header}
              className="py-4 table-td text-start ps-4 dark:text-gray-300 light:text-gray-800"
            >
              {!cell.Cell ? (
                cell?.header && getNestedValue(props?.row, cell.access) ? (
                  getNestedValue(props?.row, cell.access)
                ) : (
                  <span className="dark:text-white light:text-gray-300">-</span>
                )
              ) : (
                cell?.access &&
                cell?.Cell(
                  cell,
                  getNestedValue(props?.row, cell.access),
                  props?.row
                )
              )}
            </td>
          )
        );
      })}
      {showActions && <ActionsRow {...props} />}
    </tr>
  );
}
