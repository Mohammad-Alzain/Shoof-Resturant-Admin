import React, { useContext } from "react";
import { TableFilterContext } from "../../../Context/TableFilterProvider";
import { DataTableProps } from "../../../interfaces/DataTableProps";
import clsx from "clsx";

const TableBulkAction = (props: DataTableProps<any>) => {
  const { checkedRows, handleUnCheckAll } = useContext(TableFilterContext);

  const opacityClass = checkedRows?.length > 0 ? "opacity-90" : "opacity-0";

  return (
    <div
      className={clsx(
        opacityClass,
        "transition-opacity absolute top-[90%] bg-card border border-primary shadow-input-primary left-1/2 -translate-x-1/2  rounded-xl"
      )}
      style={{ backdropFilter: "blur(50px)" }}
    >
      {props?.bulkActions && props?.bulkActions(checkedRows, handleUnCheckAll)}
    </div>
  );
};

export default TableBulkAction;
