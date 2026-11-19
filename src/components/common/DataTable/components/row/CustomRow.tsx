import i18next from "@/Translation/i18n";
import React, { useContext } from "react";
import { Columns, DataTableProps } from "../../interfaces/DataTableProps";
import { getNestedValue } from "../../../../../helpers/objects";
import ActionsRow from "../Actions/ActionsRow";
import { Checkbox } from "@/components/ui/checkbox";
import { TableFilterContext } from "../../Context/TableFilterProvider";

type Props = {
  row: any;
  keyProp: any;
  className?: string;
  ref?: React.Ref<HTMLTableRowElement>;
  "data-index"?: number;
};

function CustomRow<T extends object>(props: Props & DataTableProps<T>) {
  const { handleCheckOne, checkedRows, tableSetting } =
    useContext(TableFilterContext);
  const checked =
    checkedRows?.findIndex((item) => item === props?.row?.id) !== -1;
  const showActions =
    props?.allowDelete ||
    props?.allowEdit ||
    props?.allowView ||
    props?.primaryActions ||
    props?.secondaryActions;
  return (
    <tr
      ref={props.ref}
      data-index={props["data-index"]}
      className={
        " border-b border-muted bg-transparent text-sm " + (props.className || "")
      }
      onClick={() => {
        if (typeof props?.ClickRowAction == "function")
          props?.ClickRowAction(props?.row);
      }}
      style={{ cursor: props?.allowClickRow ? "pointer" : undefined }}
    >
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
              className="py-4 table-td text-start ps-4   dark:text-gray-300 light:text-gray-800"
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

export { CustomRow };
