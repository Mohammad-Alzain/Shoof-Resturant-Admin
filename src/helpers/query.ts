/** Small helpers for page choices kept in the query string (a tab, a quick range) beside the table's own keys. */

export const queryParam = (name: string): string => new URLSearchParams(window.location.search).get(name) ?? "";

/** Set or (with `null` / "") remove parameters, without adding a history entry. */
export const setQueryParams = (values: Record<string, string | null>) => {
  const { pathname, search, hash } = window.location;
  const query = new URLSearchParams(search);
  for (const [key, value] of Object.entries(values)) {
    if (value) query.set(key, value);
    else query.delete(key);
  }
  const text = query.toString();
  window.history.replaceState(window.history.state, "", `${pathname}${text ? `?${text}` : ""}${hash}`);
};
