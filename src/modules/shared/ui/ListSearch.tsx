/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/helpers/crud";
import { queryParam, setQueryParams } from "@/helpers/query";
import { fetchAll } from "@/modules/shared/core/lookups";

/**
 * The search box of a list that isn't a table: what is typed, and the term to send (300 ms later). It is kept in the
 * link (`?q=`), so a refresh or a shared link shows the same view.
 */
export const useListSearch = () => {
  const [text, setText] = useState(() => queryParam("q"));
  const term = (useDebounce(text, 300) ?? "").trim();
  useEffect(() => setQueryParams({ q: term }), [term]);
  return { text, setText, term };
};

/** The ids the server matches for a term; `undefined` while there is no term (everything shows). */
export const useMatchingIds = (path: string, term: string, params: Record<string, unknown> = {}) => {
  const q = useQuery({
    queryKey: [path, "search", term, params],
    queryFn: async () => new Set((await fetchAll<{ id: string }>(path, { ...params, searchTerm: term })).map((r) => r.id)),
    enabled: !!term,
    placeholderData: keepPreviousData,
  });
  return term ? q.data : undefined;
};

export function ListSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="relative w-full sm:w-72">
      <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        name="search"
        aria-label={t("search_list")}
        placeholder={t("Search...")}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/^\s+/, ""))}
        className="h-10 rounded-xl ps-9"
      />
    </div>
  );
}
