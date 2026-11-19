import {
  INDEX_pageSize_DEFAULT,
  INDEX_pageSize_OPTIONS,
  PAGE_NUMBER,
} from "../Constant/index";
import { useEffect, useMemo, useState } from "react";
import { Columns, DataParams, Pagination } from "../interfaces/DataTableProps";
import { UseQueryResult } from "@tanstack/react-query";
import {
  BaseApiResponseEnumKeys,
  IBaseApiResponse,
} from "../../../../Api/types";
import { spliceArrayAroundItem } from "../../../../helpers/arrays";
import { getNestedValue } from "@/helpers/objects";

export type TableProps<T extends object> = {
  query: (params?: DataParams) => UseQueryResult<IBaseApiResponse<T>>;
};

export type TableSettingType = {
  paginationSettings: {
    total: number;
    pageSize: number;
    showSizeChanger: string;
    pageSizeOptions: number[];
    current: number;
    lastPage: number;
    pages: number[];
    onShowSizeChange: (pageSize: number) => Promise<any>;
    onChange: (page: number) => Promise<any>;
  };
  onShowHideChange: (column: string, value: boolean) => void;
  showedColumns: any[];
  loading: boolean;
  data: any[];
};

export function useDataTableSetting(props: {
  isLoading: any;
  isFetching: any;
  data: any;
  columns: Columns[];
}): TableSettingType {
  const [pagination, setPagination] = useState<Pagination>({
    [BaseApiResponseEnumKeys.page]: PAGE_NUMBER,
    [BaseApiResponseEnumKeys.per_page]: INDEX_pageSize_DEFAULT,
  });
  const [stickyData, setStickyData] = useState(props.data);

  const [showedColumns, setShowedColumns] = useState<any>(
    props?.columns?.reduce((acc, item) => {
      if (item?.header) {
        acc[item.header] = typeof item.show === "boolean" ? item.show : true;
      }
      return acc;
    }, {})
  );

  const onShowHideChange = (column: string, value: boolean) => {
    setShowedColumns({ ...showedColumns, [column]: value });
  };
  useEffect(() => {
    setStickyData(props.data);
  }, [props.data, pagination]);

  const paginationSettings = useMemo(() => {
    const rawData = props.data ?? stickyData;
    const resolvedTotal = Number(
      getNestedValue(rawData, BaseApiResponseEnumKeys.total) ??
        rawData?.meta?.pagination?.total ??
        rawData?.meta?.total ??
        rawData?.total ??
        rawData?.pagination?.total ??
        0
    );
    const resolvedLastPage = Number(
      getNestedValue(rawData, BaseApiResponseEnumKeys.last_page) ??
        rawData?.meta?.pagination?.last_page ??
        rawData?.meta?.last_page ??
        rawData?.last_page ??
        rawData?.pagination?.last_page ??
        1
    );

    return {
      total: resolvedTotal,
      pageSize: pagination[BaseApiResponseEnumKeys.per_page],
      showSizeChanger: "true",
      pageSizeOptions: INDEX_pageSize_OPTIONS,
      current: pagination[BaseApiResponseEnumKeys.page],
      lastPage: resolvedLastPage,
      pages: spliceArrayAroundItem(
        Array.from(
          {
            length: resolvedLastPage || 1,
          },
          (_, index) => index + 1
        ),
        pagination[BaseApiResponseEnumKeys.page],
        3
      ),
      onShowSizeChange: async (pageSize: number) => {
        const updatedParams: any = { ...pagination };
        updatedParams[BaseApiResponseEnumKeys.per_page] = pageSize;
        updatedParams[BaseApiResponseEnumKeys.page] = 1;
        setPagination((prev) => ({
          ...prev,
          [BaseApiResponseEnumKeys.per_page]: pageSize,
          [BaseApiResponseEnumKeys.page]: 1,
        }));

        return updatedParams;
      },
      onChange: async (page: number) => {
        const updatedParams: any = { ...pagination };
        updatedParams[BaseApiResponseEnumKeys.page] = page;

        setPagination((prev) => ({
          ...prev,
          [BaseApiResponseEnumKeys.page]: page,
        }));

        return updatedParams;
      },
    };
  }, [pagination, props.data, stickyData]);
  return {
    paginationSettings,
    onShowHideChange,

    showedColumns,
    loading: props.isLoading || props.isFetching,
    data:
      getNestedValue(props.data ?? stickyData, BaseApiResponseEnumKeys.data) ??
      (props.data ?? stickyData),
  };
}
