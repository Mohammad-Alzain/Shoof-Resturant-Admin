import { UseQueryResult } from "@tanstack/react-query";
import {
  BaseApiResponseEnumKeys,
  IBaseApiResponse,
} from "../../../../Api/types";
import { FieldProps } from "../../Fields/interfaces/FieldProps";
import { UseMutationResult } from "@tanstack/react-query";
import React, { JSX, ReactNode } from "react";

export type ChangeStatusQuery = (
  config: MutationConfig
) => UseMutationResult<
  IBaseApiResponse<any>,
  unknown,
  any | undefined,
  unknown
>;

export interface MutationConfig {
  onSuccess: () => void;
  onError: () => void;
}

export interface DataParams {
  [key: string]: string | number | undefined | boolean;
}
export interface BaseModelResponse<T> {
  status_code: number;
  message: string;
  error_field: null | string;
  total_recordes: null | number;
  items: T[];
  next: null | string;
  previous: null | string;
}
export interface Columns {
  header?: string;
  access?: string;
  Cell?: (cell: any, item: any, row: any) => JSX.Element;
  enableSort?: boolean;
  show?: boolean;
  sortKey?: string;
}

export interface StatusField extends FieldProps {
  valueAccessor?: string;
  rowAccessor?: string;
  show?: boolean;
}
export interface Sort {
  value: string | number;
  label: string;
}
export interface Filter extends FieldProps {
  // type: "Field" | "Sort" | "Select";
  sortValue?: number;
  keyName?: string;
}
export interface DataTableProps<T extends object> {
  childrenKey?: string;
  tableMode?: "table" | "cards" | "tree";
  /** Cards mode: draws one record as a designed card. `actions` holds the standard row buttons, `rows` is the whole page. */
  renderCard?: (row: any, ctx: { actions: React.ReactNode; index: number; rows: any[] }) => React.ReactNode;
  /** Tailwind classes of the card grid (default: a 3-column responsive grid). */
  cardGridClassName?: string;
  addEditProps?: any;
  primaryTopActions?: () => React.ReactNode;
  secondaryTopActions?: () => React.ReactNode;
  bulkActions?: (ids: any[], handleUnCheckAll: () => void) => React.ReactNode;
  createAction?: (row?: any) => any;
  editAction?: (row?: any, index?: number) => any;
  viewAction?: (row?: any) => any;
  loading?: boolean;
  query?: (params?: DataParams) => UseQueryResult<T>;
  data?: any[];
  createText?: string;
  columns: Columns[];
  allowCheckBox?: boolean;
  //actions
  allowSearch?: boolean;
  allowEdit?: (row: any) => boolean;
  allowCreate?: (row: any) => boolean;
  createModal?: any;
  textDeleteAccessor?: string;
  deleteModalTitle?: string;
  /** Text under the delete question (what deleting means for this resource). */
  deleteModalDescription?: string;
  allowView?: (row: any) => boolean;
  viewModal?: any;
  viewActionText?: string;
  deleteQuery?: any;
  deleteAction?: (row?: any, index?: number) => any;
  allowClickRow?: boolean;
  ClickRowAction?: (values: any) => any;
  allowDelete?: (row: any) => boolean;
  primaryActions?: (row: any) => ReactNode;
  secondaryActions?: (row: any) => ReactNode;
  checkedRows?: any[];
  setCheckedRows?: any;
  //sorts
  allowSorts?: boolean;
  sorts?: Sort[];

  //filters
  allowFilters?: boolean;
  filters?: Filter[];
  filterSearchParamName?: string;

  columnsShowHideControl?: boolean;
  allowReorder?: boolean;
  reorderQuery?: any;
  allowVirtualization?: boolean;
  virtualRowHeight?: number;
  virtualOverscan?: number;
}
export interface Pagination {
  [BaseApiResponseEnumKeys.per_page]: number;
  [BaseApiResponseEnumKeys.page]: number;
}
