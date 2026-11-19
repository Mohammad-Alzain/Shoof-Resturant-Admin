import { onKeyActivate } from "@/helpers/a11y";
import React from "react";
import { Columns, DataTableProps } from "../../../interfaces/DataTableProps";
import { getNestedValue } from "@/helpers/objects";
import ActionsRow from "../../Actions/ActionsRow";

type Props = {
  row: any;
  keyProp: any;
  // setRowSelected: any;
  // setShowDrawer: any;
  // setUpdateChangeStatus: any;
};

function CustomCardRow<T extends object>(props: Props & DataTableProps<T>) {
  return (
    <div role="link" tabIndex={0} onKeyDown={onKeyActivate}
      onClick={() => {
        if (typeof props?.ClickRowAction == "function")
          props?.ClickRowAction(props?.row);
      }}
      className={`cursor-${props?.allowClickRow && "pointer"} drop-shadow-lg border-[0.5px] border-border rounded-lg  gap-4 flex flex-col items-center `}
    >
      {props?.columns?.map((cell: Columns, key: any) => {
        return (
          <div
            key={key + cell.header}
            className="flex flex-col items-center w-full h-full"
          >
            {!cell.Cell ? (
              cell?.access && getNestedValue(props?.row, cell.access) ? (
                getNestedValue(props?.row, cell.access)
              ) : (
                <span className="text-gray-300">-</span>
              )
            ) : (
              cell?.access &&
              cell?.Cell(
                cell,
                getNestedValue(props?.row, cell.access),
                props?.row
              )
            )}
          </div>
        );
      })}
      <ActionsRow {...props} />
    </div>
  );
}

export { CustomCardRow };
