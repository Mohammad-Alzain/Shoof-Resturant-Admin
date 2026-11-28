import { FieldTypes } from "../../Fields/Enums/Field";
import type { Filter } from "../interfaces/DataTableProps";
import { INDEX_pageSize_DEFAULT, INDEX_pageSize_OPTIONS } from "../Constant";

/**
 * A list's view (search, sort, page, page size, filters) in the query string, so a refresh keeps it and a filtered view
 * can be shared: `?q=…&sort=name&desc=1&page=2&size=50&isActive=true`. Only the table's own keys are touched.
 */

export type TableFilters = Record<string, unknown>;

const OWN = ["q", "sort", "desc", "page", "size"];
const empty = (v: unknown) => v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length);

/** A raw query value back into the type its filter field works with. */
const parseValue = (field: Filter, raw: string): unknown => {
  const typed = (text: string): unknown => {
    const option = (field.options as { value?: unknown }[] | undefined)?.find((o) => String(o?.value) === text);
    if (option) return option.value;
    if (field.control === FieldTypes.number) return Number.isFinite(Number(text)) ? Number(text) : undefined;
    // A fixed list that doesn't offer the value: a hand-edited link.
    return field.control === FieldTypes.select && field.options ? undefined : text;
  };
  if (field.isMulti) {
    const values = raw.split(",").map(typed).filter((v) => !empty(v));
    return values.length ? values : undefined;
  }
  return typed(raw);
};

export const readUrlState = (search: string, fields: Filter[] = [], searchName = "searchTerm"): TableFilters => {
  const query = new URLSearchParams(search);
  const page = Number(query.get("page"));
  const size = Number(query.get("size"));
  const out: TableFilters = {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: INDEX_pageSize_OPTIONS.includes(size) ? size : INDEX_pageSize_DEFAULT,
  };
  const term = query.get("q");
  if (term) out[searchName] = term;
  const sort = query.get("sort");
  if (sort) {
    out.sortBy = sort;
    out.sortDescending = query.get("desc") === "1";
  }
  for (const field of fields) {
    const raw = query.get(field.name);
    if (raw === null || raw === "") continue;
    const value = parseValue(field, raw);
    if (!empty(value)) out[field.name] = value;
  }
  return out;
};

/** The new query string (with its `?`, or empty): the table's keys replaced, any other parameter kept. */
export const writeUrlState = (search: string, filters: TableFilters, fields: Filter[] = [], searchName = "searchTerm"): string => {
  const query = new URLSearchParams(search);
  for (const key of [...OWN, ...fields.map((f) => f.name)]) query.delete(key);
  const set = (key: string, value: unknown) => {
    if (!empty(value)) query.set(key, Array.isArray(value) ? value.join(",") : String(value));
  };
  set("q", filters[searchName]);
  if (filters.sortBy) {
    set("sort", filters.sortBy);
    if (String(filters.sortDescending) === "true") query.set("desc", "1");
  }
  if (Number(filters.page) > 1) set("page", filters.page);
  if (Number(filters.pageSize) !== INDEX_pageSize_DEFAULT) set("size", filters.pageSize);
  for (const field of fields) set(field.name, filters[field.name]);
  const text = query.toString();
  return text ? `?${text}` : "";
};
