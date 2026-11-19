import { useQuery } from "@tanstack/react-query";
import { http } from "@/Api/httpClient";

/** Every row of a list endpoint (100 per page, at most 20 pages). */
export const fetchAll = async <T = Record<string, unknown>>(path: string, params: Record<string, unknown> = {}): Promise<T[]> => {
  const out: T[] = [];
  for (let page = 1; page <= 20; page++) {
    const r = await http.get<{ data: T[]; totalPages: number }>(path, { params: { ...params, page, pageSize: 100 } });
    out.push(...(r.data ?? []));
    if (page >= (r.totalPages ?? 1)) break;
  }
  return out;
};

/** id -> name map of a list endpoint, so tables can show names instead of ids. */
const useNames = (path: string, key: string) =>
  useQuery({
    queryKey: ["lookup", path, key],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const out = new Map<string, string>();
      for (const row of await fetchAll<Record<string, unknown>>(path)) {
        const name = row[key];
        if (typeof row.id === "string" && typeof name === "string") out.set(row.id, name);
      }
      return out;
    },
  });

export const useCategoryNames = () => useNames("menu-categories", "name");
export const useIngredientNames = () => useNames("ingredients", "name");
export const useRestaurantNames = () => useNames("restaurants", "name");
export const useItemNames = () => useNames("menu-items", "name");

export interface ICurrency {
  id: string;
  isoCode: string;
  symbol: string;
  displayName: string;
  decimalPlaces: number;
}
/** Currencies are loaded once: prices are shown with their symbol and decimal places. */
export const useCurrencies = () =>
  useQuery({ queryKey: ["currencies", "all"], staleTime: 30 * 60_000, queryFn: () => fetchAll<ICurrency>("currencies") });

/** `names.data?.get(id)` with a safe fallback. */
export const nameOf = (map: Map<string, string> | undefined, id?: string | null) => (id ? (map?.get(id) ?? "—") : "—");

/** "1,250.00 $" using the currency's own decimal places. */
export const formatPrice = (price: number | null | undefined, currency: ICurrency | undefined, lang: string): string => {
  if (price === null || price === undefined) return "—";
  const dp = currency?.decimalPlaces ?? 2;
  const n = new Intl.NumberFormat(lang, { minimumFractionDigits: dp, maximumFractionDigits: dp }).format(price);
  return currency ? `${n} ${currency.symbol || currency.isoCode}` : n;
};

/**
 * The API returns only the text resolved for X-Language, but updates need both languages (an update without the Arabic
 * text would erase it). Reads the record once per language: the Arabic value equal to the English one means "none stored".
 */
export async function getBilingual<T extends Record<string, any>>(path: string, id: string, fields: string[]): Promise<{ record: T; en: Record<string, string>; ar: Record<string, string> }> {
  const [en, ar] = await Promise.all([
    http.get<T>(`${path}/${id}`, { headers: { "X-Language": "en" } }),
    http.get<T>(`${path}/${id}`, { headers: { "X-Language": "ar" } }),
  ]);
  const pick = (r: T) => Object.fromEntries(fields.map((f) => [f, (r[f] as string | null) ?? ""]));
  const e = pick(en);
  const a = pick(ar);
  for (const f of fields) if (a[f] === e[f]) a[f] = "";
  return { record: en, en: e, ar: a };
}
