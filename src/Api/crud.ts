import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { http } from "./httpClient";
import type { DataParams, IPagedResponse } from "./types";

/**
 * REST helper for the API's standard resources (`GET/POST/PUT/DELETE api/{path}`).
 * Returns plain functions plus react-query hooks; the list hook has the shape the DataTable `query` prop expects.
 */
/** Keys that are never worth matching a search against: identifiers and secrets. */
const SKIP_KEY = /(^|[a-z])Ids?$|^id$|token|secret|hash/i;
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;

/** True when any readable text or number in the row (nested too) contains the term. */
const rowMatches = (row: unknown, term: string, depth = 0): boolean => {
  if (row === null || row === undefined || depth > 3) return false;
  if (typeof row === "string") return !GUID.test(row) && row.toLowerCase().includes(term);
  if (typeof row === "number") return String(row).includes(term);
  if (Array.isArray(row)) return row.some((v) => rowMatches(v, term, depth + 1));
  if (typeof row === "object")
    return Object.entries(row as Record<string, unknown>).some(([k, v]) => !SKIP_KEY.test(k) && rowMatches(v, term, depth + 1));
  return false;
};

/** The table library puts these in the filters when a header is clicked; the API has no sort parameter, so they never go out. */
const SORT_KEYS = ["order_by", "order_direction", "sort_by", "sort_direction", "sort"];
const stripSort = (params?: DataParams): DataParams => {
  const out: DataParams = { ...params };
  for (const k of SORT_KEYS) delete out[k];
  return out;
};

/** Compare two cell values: numbers and booleans numerically, ISO dates by time, text by locale (numeric aware); empty last. */
const compareValues = (a: unknown, b: unknown): number => {
  const empty = (v: unknown) => v === null || v === undefined || v === "";
  if (empty(a) || empty(b)) return empty(a) && empty(b) ? 0 : empty(a) ? 1 : -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  const sa = String(a);
  const sb = String(b);
  if (/^\d{4}-\d{2}-\d{2}/.test(sa) && /^\d{4}-\d{2}-\d{2}/.test(sb)) return Date.parse(sa) - Date.parse(sb);
  return sa.localeCompare(sb, undefined, { numeric: true, sensitivity: "base" });
};
const valueAt = (row: unknown, path: string): unknown =>
  path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), row);

interface CrudOptions {
  /** The endpoint filters by `SearchTerm` itself. Most SuperAdmin lists ignore it, so the table searches client-side. */
  serverSearch?: boolean;
}

export function createCrudApi<TItem, TCreate = Partial<TItem>, TUpdate = TCreate>(
  path: string,
  queryKey: string,
  options: CrudOptions = {},
) {
  const list = (params?: DataParams): Promise<IPagedResponse<TItem>> =>
    http.get(path, { params });
  const get = (id: string | number): Promise<TItem> => http.get(`${path}/${encodeURIComponent(String(id))}`);
  const create = (body: TCreate): Promise<TItem> => http.post(path, body);
  const update = ({ id, body }: { id: string | number; body: TUpdate }): Promise<TItem> =>
    // The update DTOs carry the id too (it must match the route), so it is sent in the body as well.
    http.put(`${path}/${encodeURIComponent(String(id))}`, body && typeof body === "object" ? { ...body, id } : body);
  const remove = (id: string | number): Promise<void> => http.delete(`${path}/${encodeURIComponent(String(id))}`);

  /** Every page of the list with the given filters (page size 100, at most 20 pages), for the client-side search. */
  const listAll = async (params?: DataParams): Promise<TItem[]> => {
    const out: TItem[] = [];
    for (let page = 1; page <= 20; page++) {
      const r = await list({ ...params, page, pageSize: 100 });
      out.push(...(r.data ?? []));
      if (page >= (r.totalPages ?? 1)) break;
    }
    return out;
  };

  const useList = (params?: DataParams, enabled = true) => {
    const term = String(params?.searchTerm ?? "").trim().toLowerCase();
    const sortKey = String(params?.sort_by ?? params?.order_by ?? "");
    const sortDesc = String(params?.sort_direction ?? params?.order_direction ?? "asc") === "desc";
    // The API has no sort parameter and ignores SearchTerm on most lists: sort and search here, on the full list.
    const fallback = (!!term && !options.serverSearch) || !!sortKey;
    const base = useQuery({
      queryKey: [queryKey, "list", params],
      queryFn: () => list(stripSort(params)),
      placeholderData: keepPreviousData,
      enabled: enabled && !fallback,
    });
    // The server ignores SearchTerm on these lists: load everything matching the other filters and search here.
    const rest: DataParams = stripSort(params);
    if (!options.serverSearch) delete rest.searchTerm;
    delete rest.page;
    delete rest.pageSize;
    const all = useQuery({
      queryKey: [queryKey, "search-all", rest],
      queryFn: () => listAll(rest),
      placeholderData: keepPreviousData,
      staleTime: 30_000,
      enabled: enabled && fallback,
    });
    if (!fallback) return base;
    const page = Number(params?.page ?? 1);
    const size = Number(params?.pageSize ?? 10);
    let matched = term && !options.serverSearch ? (all.data ?? []).filter((row) => rowMatches(row, term)) : (all.data ?? []);
    if (sortKey) {
      matched = [...matched].sort((x, y) => (sortDesc ? -1 : 1) * compareValues(valueAt(x, sortKey), valueAt(y, sortKey)));
    }
    const data: IPagedResponse<TItem> | undefined = all.data
      ? { data: matched.slice((page - 1) * size, page * size), page, pageSize: size, totalCount: matched.length, totalPages: Math.max(1, Math.ceil(matched.length / size)) }
      : undefined;
    return { ...all, data } as unknown as typeof base;
  };

  const useGet = (id?: string | number) =>
    useQuery({
      queryKey: [queryKey, "detail", id],
      queryFn: () => get(id as string | number),
      enabled: id !== undefined && id !== null && id !== "",
    });

  const useCreate = () => {
    const client = useQueryClient();
    return useMutation({
      mutationFn: create,
      onSuccess: () => client.invalidateQueries({ queryKey: [queryKey] }),
    });
  };

  const useUpdate = (id: string | number) => {
    const client = useQueryClient();
    return useMutation({
      mutationFn: (body: TUpdate) => update({ id, body }),
      onSuccess: () => client.invalidateQueries({ queryKey: [queryKey] }),
    });
  };

  const useRemove = () => {
    const client = useQueryClient();
    return async (id: string | number) => {
      await remove(id);
      await client.invalidateQueries({ queryKey: [queryKey] });
    };
  };

  return { path, queryKey, list, listAll, get, create, update, remove, useList, useGet, useCreate, useUpdate, useRemove };
}

/** Typeahead/lookup hook for pickers: `GET api/{path}?searchTerm=…` → first page. */
export const useLookup = <T,>(path: string, params?: DataParams) =>
  useQuery({
    queryKey: ["lookup", path, params],
    queryFn: (): Promise<IPagedResponse<T>> => http.get(path, { params }),
    staleTime: 60_000,
  });
