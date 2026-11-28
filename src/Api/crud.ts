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
/**
 * Query params as the API takes them: empty filters are left out (an empty boolean or id is a 400), and the sort
 * direction only travels with a sort key. Search and sort happen on the server, over the whole list.
 */
export const listParams = (params?: DataParams): DataParams => {
  const out: DataParams = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null || value === "" || (Array.isArray(value) && !(value as unknown[]).length)) continue;
    out[key] = value;
  }
  if (!out.sortBy) delete out.sortDescending;
  return out;
};

export function createCrudApi<TItem, TCreate = Partial<TItem>, TUpdate = TCreate>(
  path: string,
  queryKey: string,
) {
  const list = (params?: DataParams, signal?: AbortSignal): Promise<IPagedResponse<TItem>> =>
    http.get(path, { params: listParams(params), signal });
  const get = (id: string | number): Promise<TItem> => http.get(`${path}/${encodeURIComponent(String(id))}`);
  const create = (body: TCreate): Promise<TItem> => http.post(path, body);
  const update = ({ id, body }: { id: string | number; body: TUpdate }): Promise<TItem> =>
    // The update DTOs carry the id too (it must match the route), so it is sent in the body as well.
    http.put(`${path}/${encodeURIComponent(String(id))}`, body && typeof body === "object" ? { ...body, id } : body);
  const remove = (id: string | number): Promise<void> => http.delete(`${path}/${encodeURIComponent(String(id))}`);

  /** Every page of the list with the given filters (page size 100, at most 20 pages): for totals over a whole report. */
  const listAll = async (params?: DataParams, signal?: AbortSignal): Promise<TItem[]> => {
    const out: TItem[] = [];
    for (let page = 1; page <= 20; page++) {
      const r = await list({ ...params, page, pageSize: 100 }, signal);
      out.push(...(r.data ?? []));
      if (page >= (r.totalPages ?? 1)) break;
    }
    return out;
  };

  /** One server page. A request that is no longer wanted (the user typed on, or changed page) is aborted. */
  const useList = (params?: DataParams, enabled = true) =>
    useQuery({
      queryKey: [queryKey, "list", listParams(params)],
      queryFn: ({ signal }) => list(params, signal),
      placeholderData: keepPreviousData,
      enabled,
    });

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
