import i18next from "@/Translation/i18n";
import React, { useContext, useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { DataTableProps } from "../../interfaces/DataTableProps";
import { CustomHeaderColumn } from "../header/CustomHeaderColumn";
import { ListLoading } from "../Loading";
import { CustomRow } from "../row/CustomRow";
import { SortableRow } from "../row/SortableRow";
import { SortableWrapper } from "./SortableWrapper";
import { ListPagination } from "../pagination/ListPagination";
import { TableFilterContext } from "../../Context/TableFilterProvider";
import { Checkbox } from "@/components/ui/checkbox";
import TableBulkAction from "../Actions/BulkAction";
import { EmojiSad } from "iconsax-react";
import { useTranslated } from "@/Translation/helper/getTranslation";
import clsx from "clsx";

function TableRows<T extends object>(props: DataTableProps<T>) {
  const { tableSetting, handleCheckAll, checkedRows } =
    useContext(TableFilterContext);
  const Rows = tableSetting?.data;
  const columns = props?.columns;
  const nodata = useTranslated("nodata");
  const actions_title = useTranslated("actions");

  const parentRef = useRef<HTMLDivElement>(null);

  const RowComponent = props.allowReorder ? SortableRow : CustomRow;

  const count = Array.isArray(Rows) ? Rows.length : 0;
  const isVirtualized = props.allowVirtualization !== false && count > 0;

  const rowVirtualizer = useVirtualizer({
    count: isVirtualized ? count : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => props.virtualRowHeight ?? 53,
    overscan: props.virtualOverscan ?? 10,
    enabled: isVirtualized,
  });

  // Reset scroll to top when page index or size changes
  useEffect(() => {
    if (parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
  }, [
    tableSetting?.paginationSettings?.current,
    tableSetting?.paginationSettings?.pageSize,
  ]);

  const hasActions = Boolean(
    props?.allowEdit ||
      props?.allowView ||
      props?.allowDelete ||
      props?.primaryActions ||
      props?.secondaryActions
  );

  const showedColsCount =
    columns?.filter(
      (column: any) => tableSetting?.showedColumns[column?.header]
    )?.length || 0;

  const totalColumns =
    (props?.allowReorder ? 1 : 0) +
    (props?.allowCheckBox ? 1 : 0) +
    showedColsCount +
    (hasActions ? 1 : 0);

  const virtualItems = isVirtualized ? rowVirtualizer.getVirtualItems() : [];
  const totalSize = isVirtualized ? rowVirtualizer.getTotalSize() : 0;

  const paddingTop =
    isVirtualized && virtualItems.length > 0
      ? virtualItems[0]?.start ?? 0
      : 0;

  const paddingBottom =
    isVirtualized && virtualItems.length > 0
      ? totalSize - (virtualItems[virtualItems.length - 1]?.end ?? 0)
      : 0;

  return (
    <div className="py-4 overflow-x-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-400 scrollbar-track-gray-100">
      <div
        ref={parentRef}
        className={clsx(
          "inline-block min-w-full duration-700 transition-all max-h-[60vh] overflow-y-auto rounded-md overflow-auto overflow-x-auto",
          "scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-400 scrollbar-track-gray-100",
          tableSetting.loading ? "opacity-30 blur-[2px]" : "opacity-100 blur-0"
        )}
      >
        <SortableWrapper
          allowReorder={props.allowReorder}
          reorderQuery={props.reorderQuery}
        >
          <table
            id="kt_table_users"
            className="table-auto min-w-full leading-normal overflow-x-auto"
          >
            <thead className="sticky top-0 z-10">
              <tr className="border-b-2 border-muted bg-muted shadow-sm">
                {props?.allowReorder && <td className="w-[30px] px-2"></td>}
                {props?.allowCheckBox && (
                  <td className="ps-4">
                    <Checkbox
                      checked={Boolean(
                        Rows?.length &&
                          Rows.length > 0 &&
                          Rows.every((row: any) =>
                            (checkedRows as any[])?.includes(row?.id)
                          )
                      )}
                      onCheckedChange={handleCheckAll}
                      className="hover:border-blue-500 transition-all"
                      aria-label={i18next.t("a11y_select_row")}
                    />
                  </td>
                )}
                {columns.map(
                  (column: any, key: any) =>
                    tableSetting?.showedColumns[column?.header] && (
                      <CustomHeaderColumn key={key} column={column} />
                    )
                )}
                {hasActions && (
                  <CustomHeaderColumn column={{ header: actions_title }} />
                )}
              </tr>
            </thead>
            <tbody className="">
              {Array.isArray(Rows) && Rows.length > 0 ? (
                isVirtualized ? (
                  <>
                    {paddingTop > 0 && (
                      <tr style={{ height: `${paddingTop}px` }}>
                        <td
                          colSpan={Math.max(totalColumns, 1)}
                          style={{
                            height: `${paddingTop}px`,
                            padding: 0,
                            border: "none",
                          }}
                        />
                      </tr>
                    )}
                    {virtualItems.map((virtualRow) => {
                      const row = Rows[virtualRow.index];
                      return (
                        <RowComponent
                          ref={rowVirtualizer.measureElement}
                          data-index={virtualRow.index}
                          className={
                            virtualRow.index % 2 !== 0 ? " bg-muted/50" : ""
                          }
                          keyProp={virtualRow.index}
                          {...props}
                          row={row}
                          key={`row-${virtualRow.index}-${row?.id ?? virtualRow.index}`}
                        />
                      );
                    })}
                    {paddingBottom > 0 && (
                      <tr style={{ height: `${paddingBottom}px` }}>
                        <td
                          colSpan={Math.max(totalColumns, 1)}
                          style={{
                            height: `${paddingBottom}px`,
                            padding: 0,
                            border: "none",
                          }}
                        />
                      </tr>
                    )}
                  </>
                ) : (
                  Rows.map((row: any, i: any) => {
                    return (
                      <RowComponent
                        className={i % 2 !== 0 ? " bg-muted/50" : ""}
                        keyProp={i}
                        {...props}
                        row={row}
                        key={`row-${i}-${row?.id}`}
                      />
                    );
                  })
                )
              ) : Rows?.length === 0 ? (
                <tr>
                  <td
                    colSpan={Math.max(totalColumns, 15)}
                    align="center"
                    className="py-4"
                  >
                    <EmojiSad
                      size={90}
                      color="currentColor"
                      className="text-muted-foreground my-3 "
                    />
                    <span className=" font-medium text-muted-foreground">{nodata}</span>
                  </td>
                </tr>
              ) : (
                <></>
              )}
            </tbody>
          </table>
        </SortableWrapper>
      </div>

      <div className="flex justify-end mt-2">
        <ListPagination />
      </div>

      {tableSetting?.loading && <ListLoading />}
      {props?.bulkActions && <TableBulkAction {...props} />}
    </div>
  );
}

export default TableRows;
