import React, { useContext } from "react";
import { DataTableProps } from "../../interfaces/DataTableProps";
import { ListLoading } from "../Loading";

import { ListPagination } from "../pagination/ListPagination";
import { TableFilterContext } from "../../Context/TableFilterProvider";

import TableBulkAction from "../Actions/BulkAction";
import { EmojiSad } from "iconsax-react";
import { useTranslated } from "@/Translation/helper/getTranslation";

import TreeNode from "../row/treeNode/TreeNode";

function TableRowsAsATreeRows<T extends object>(props: DataTableProps<T>) {
  const { tableSetting } = useContext(TableFilterContext);
  const Rows = tableSetting?.data;
  const nodata = useTranslated("nodata");
  return (
    <div className="py-4 overflow-x-auto flex flex-col gap-4 ">
      <div className="flex flex-col flex-wrap gap-2">
        {typeof Rows === "object" && Rows.length > 0 ? (
          Rows.map((row: any, i: any) => {
            return (
              <TreeNode
                keyProp={i}
                {...props}
                row={row}
                key={`row-${i}-${row?.id}`}
              />
            );
          })
        ) : Rows?.length === 0 ? (
          <div>
            <div className="py-4 flex-col w-full flex items-center">
              <EmojiSad
                size={90}
                color="currentColor"
                className="text-gray-300 dark:text-gray-800 my-3 "
              />
              <span className=" font-medium text-gray-300 dark:text-gray-800">
                {nodata}
              </span>
            </div>
          </div>
        ) : (
          <></>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        {<ListPagination />}
      </div>
      {tableSetting?.loading && <ListLoading />}
      <TableBulkAction {...props} />
    </div>
  );
}

export default TableRowsAsATreeRows;
