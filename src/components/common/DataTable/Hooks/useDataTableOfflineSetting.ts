import {
  INDEX_pageSize_DEFAULT,
  INDEX_pageSize_OPTIONS,
  PAGE_NUMBER,
} from "../Constant/index";
import { useEffect, useMemo, useState } from "react";
import { Columns, Pagination } from "../interfaces/DataTableProps";
import { spliceArrayAroundItem } from "../../../../helpers/arrays";
import { TableSettingType } from "./useDataTableSetting";
import {
  BaseApiResponseEnumKeys,
  DataParams,
  IBaseApiResponse,
} from "@/Api/types";
import { UseQueryResult } from "@tanstack/react-query";

export type TableProps<T extends object> = {
  query: (params?: DataParams) => UseQueryResult<IBaseApiResponse<T>>;
};

export function useDataTableOfflineSetting(props: {
  isLoading: any;
  isFetching: any;
  data: any;
  columns: Columns[];
}): TableSettingType {
  const [pagination, setPagination] = useState<Pagination>({
    [BaseApiResponseEnumKeys.page]: PAGE_NUMBER,
    [BaseApiResponseEnumKeys.per_page]: INDEX_pageSize_DEFAULT,
  });

  const [stickyData, set_stickyData] = useState(props.data);
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
    if (props.data) {
      let data: any[] = JSON.parse(JSON.stringify(props?.data));
      const start_index =
        (pagination[BaseApiResponseEnumKeys.page] - 1) *
        pagination[BaseApiResponseEnumKeys.per_page];
      const last_index =
        start_index + pagination[BaseApiResponseEnumKeys.per_page];
      data = data?.slice(start_index, last_index);
      set_stickyData(data);
    }
  }, [props.data, pagination]);

  const paginationSettings = useMemo(() => {
    return {
      total: props?.data ? props?.data?.length : 0,
      pageSize: pagination[BaseApiResponseEnumKeys.per_page],
      showSizeChanger: "true",
      pageSizeOptions: INDEX_pageSize_OPTIONS,
      current: pagination[BaseApiResponseEnumKeys.page],
      lastPage: props?.data
        ? props?.data?.length
          ? Math.ceil(
              props?.data?.length / pagination[BaseApiResponseEnumKeys.per_page]
            )
          : 1
        : 1,
      pages: spliceArrayAroundItem(
        Array.from(
          {
            length: props?.data?.length
              ? Math.ceil(
                  props?.data?.length /
                    pagination[BaseApiResponseEnumKeys.per_page]
                )
              : 1,
          },
          (_, index) => index + 1
        ),
        pagination[BaseApiResponseEnumKeys.page],
        3
      ),
      onShowSizeChange: async (perPage: number) => {
        const updatedParams: any = JSON.parse(JSON.stringify(pagination));
        updatedParams[BaseApiResponseEnumKeys.per_page] = perPage;
        let data: any[] = JSON.parse(JSON.stringify(props?.data));
        const last_index = 0 + perPage - 1;
        data = data?.slice(0, last_index);
        set_stickyData(data);
        setPagination((prev) => ({
          ...prev,
          [BaseApiResponseEnumKeys.per_page]: perPage,
          [BaseApiResponseEnumKeys.page]: 1,
        }));

        return updatedParams;
      },
      onChange: async (page: number) => {
        const updatedParams: any = JSON.parse(JSON.stringify(pagination));
        updatedParams.page = page;
        setPagination((prev) => ({ ...prev, page: page }));
        // change sticky data
        let data: any[] = JSON.parse(JSON.stringify(props?.data));
        const start_index =
          (page - 1) * pagination[BaseApiResponseEnumKeys.per_page];
        const last_index =
          start_index + pagination[BaseApiResponseEnumKeys.per_page];
        data = data?.slice(start_index, last_index);
        set_stickyData(data);
        return updatedParams;
      },
    };
  }, [pagination, props.data]);

  return {
    paginationSettings,
    onShowHideChange,
    showedColumns,
    loading: props.isLoading || props.isFetching,
    data: stickyData,
  };
}
