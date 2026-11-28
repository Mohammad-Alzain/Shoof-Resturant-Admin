/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useEffect, useState } from "react";
import {
  useDataTableSetting,
  TableSettingType,
} from "../Hooks/useDataTableSetting";
import { DataTableProps } from "../interfaces/DataTableProps";
import { INDEX_pageSize_DEFAULT } from "../Constant";
import { useDataTableOfflineSetting } from "../Hooks/useDataTableOfflineSetting";
import { BaseApiResponseEnumKeys } from "@/Api/types";
import { getNestedValue } from "@/helpers/objects";
import { readUrlState, writeUrlState } from "./urlState";

type TableFilterContextType = {
  filters: any;
  setCheckedFilters: any;
  tableSetting: TableSettingType;
  refetch: () => void;
  isLoading: boolean;
  isFetching: boolean;
  checkedRows: number[] | string[];
  setCheckedRows: (values: any) => void;
  handleUnCheckAll: () => void;
  handleCheckAll: (value: boolean) => void;
  handleCheckOne: (value: boolean, index: number | string) => void;
};
export const TableFilterContext = createContext<TableFilterContextType>({
  filters: [],
  setCheckedRows: () => {},
  checkedRows: [],
  setCheckedFilters: () => {},
  tableSetting: {} as TableSettingType,
  refetch: () => {},
  isLoading: false,
  isFetching: false,
  handleCheckAll: () => {},
  handleUnCheckAll: () => {},
  handleCheckOne: () => {},
});

export const TableFilterActionsContext = createContext<
  React.Dispatch<React.SetStateAction<any>>
>(() => {});

function TableFilterProvider<T extends object>({
  children,
  props,
}: {
  children: React.ReactNode;
  props: DataTableProps<T>;
}) {
  // With `syncUrl` the view starts from the link, and every change is written back to it.
  const [filters, setCheckedFilters] = useState<any>(() =>
    props?.syncUrl
      ? readUrlState(window.location.search, props.filters, props.filterSearchParamName)
      : {
          [BaseApiResponseEnumKeys.page]: 1,
          [BaseApiResponseEnumKeys.per_page]: INDEX_pageSize_DEFAULT,
        },
  );
  useEffect(() => {
    if (!props?.syncUrl) return;
    const { pathname, search, hash } = window.location;
    const next = writeUrlState(search, filters, props.filters, props.filterSearchParamName);
    if (next !== search) window.history.replaceState(window.history.state, "", `${pathname}${next}${hash}`);
    // `props.filters` is rebuilt on every render of the page; the view changes only with `filters`.
  }, [filters]);
  const [checkedRows, setCheckedRows] = useState<any[]>(
    props?.checkedRows ?? []
  );
  const { isLoading, isFetching, data, refetch } = props?.query
    ? props.query({
        ...filters,
      })
    : {
        isLoading: false,
        isFetching: false,
        data: props?.data,
        refetch: () => {},
      };

  // `props.query` never changes for a mounted table, so the same hook runs on every render.
  /* eslint-disable react-hooks/rules-of-hooks */
  const TableSetting = props?.query
    ? useDataTableSetting({
        isLoading: isLoading,
        isFetching: isFetching,
        data,
        columns: props?.columns,
        page: Number(filters[BaseApiResponseEnumKeys.page]) || 1,
        pageSize: Number(filters[BaseApiResponseEnumKeys.per_page]) || INDEX_pageSize_DEFAULT,
      })
    : useDataTableOfflineSetting({
        isLoading: false,
        isFetching: false,
        data: data,
        columns: props?.columns,
      });
  /* eslint-enable react-hooks/rules-of-hooks */

  const handleCheckAll = (value: boolean) => {
    const newData: any =
      getNestedValue(data, BaseApiResponseEnumKeys.data) ?? data;
    let currentPageIds: any[];
    if (newData[0] && newData[0]?.id) {
      currentPageIds = newData?.map((item: any) => item?.id);
    } else {
      currentPageIds = [...newData];
    }

    if (value === false) {
      // Uncheck only items on the current page
      setCheckedRows((prev) =>
        prev.filter((id) => !currentPageIds.includes(id))
      );
      return;
    }

    // Check all: Add current page items to selection, preventing duplicates
    setCheckedRows((prev) => {
      const newSelections = currentPageIds.filter((id) => !prev.includes(id));
      return [...prev, ...newSelections];
    });
  };

  const handleUnCheckAll = () => {
    setCheckedRows([]);
  };

  useEffect(() => {
    if (typeof props?.setCheckedRows === "function")
      props?.setCheckedRows(checkedRows);
  }, [checkedRows]);

  const handleCheckOne = (value: boolean, row: any) => {
    if (row?.id) {
      if (!value) {
        // Remove individual item
        setCheckedRows((prev) => prev.filter((id) => id !== row.id));
      } else {
        // Add individual item if not already exists
        setCheckedRows((prev) => {
          if (prev.includes(row.id)) return prev;
          return [...prev, row.id];
        });
      }
    }
  };

  // Sync internal state if props change externally
  useEffect(() => {
    if (props?.checkedRows && JSON.stringify(props.checkedRows) !== JSON.stringify(checkedRows)) {
      setCheckedRows(props.checkedRows);
    }
  }, [props?.checkedRows]);

  return (
    <TableFilterContext.Provider
      value={{
        handleUnCheckAll,
        handleCheckOne,
        handleCheckAll,
        checkedRows,
        setCheckedRows,
        isFetching,
        isLoading,
        filters: filters,
        setCheckedFilters: setCheckedFilters,
        tableSetting: TableSetting,
        refetch: refetch,
      }}
    >
      <TableFilterActionsContext.Provider value={setCheckedFilters}>
        {children}
      </TableFilterActionsContext.Provider>
    </TableFilterContext.Provider>
  );
}

export default TableFilterProvider;
