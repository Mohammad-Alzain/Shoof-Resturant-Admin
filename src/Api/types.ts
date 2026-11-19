/** Paged list reply of every GET list endpoint (docs/00-common-spec.md §2.4). */
export interface IPagedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/** Kept for the generic table/form library, which was written against a `{ data }` envelope. */
export interface IBaseApiResponse<T> {
  data: T;
}

export enum ApiMsgTypes {
  success = "Success",
  error = "Error",
  warning = "Warning",
}

/**
 * Keys the DataTable library reads from a list reply and sends as query params.
 * They match the API: `?page=&pageSize=` → `{ data, page, pageSize, totalCount, totalPages }`.
 */
export enum BaseApiResponseEnumKeys {
  data = "data",
  pagination = "",
  total = "totalCount",
  last_page = "totalPages",

  // Query param keys
  page = "page",
  per_page = "pageSize",
}

export interface DataParams {
  [key: string]: string | number | undefined | boolean;
}
