import { useContext, useEffect, useState, useRef } from "react";
import { useDebounce } from "../../../../../helpers/crud";
import { Input } from "@/components/ui/input";
import { TableFilterContext } from "../../Context/TableFilterProvider";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";

interface SearchComponentProps {
  filterSearchParamName: string;
  placeholder?: string;
  className?: string;
  debounceTime?: number;
  onSearch?: (term: string) => void;
}

const SearchComponent = ({
  filterSearchParamName,
  placeholder,
  className = "",
  debounceTime = 300,
  onSearch,
}: SearchComponentProps) => {
  const { t } = useTranslation();
  const { filters, setCheckedFilters } = useContext(TableFilterContext);
  // A search that came with the link is shown in the box.
  const initial = String(filters?.[filterSearchParamName ?? "searchTerm"] ?? "");
  const [searchTerm, setSearchTerm] = useState<string>(initial);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, debounceTime);

  // The term last pushed into the table filters. Starting from "" means the
  // first (empty) value is not pushed: doing so changed the query key and made
  // every list load request the same page twice (RBC-021).
  const lastPushed = useRef(initial);

  useEffect(() => {
    if (debouncedSearchTerm === undefined) return;
    if (debouncedSearchTerm === lastPushed.current) return;
    lastPushed.current = debouncedSearchTerm;
    setCheckedFilters((prev) => {
      const next = { ...prev };
      if (debouncedSearchTerm === "") delete next[filterSearchParamName];
      else next[filterSearchParamName] = debouncedSearchTerm;
      // a new search always restarts from the first page
      next.page = 1;
      return next;
    });
    onSearch?.(debouncedSearchTerm);
  }, [debouncedSearchTerm, filterSearchParamName, setCheckedFilters, onSearch]);

  const handleClear = () => {
    setSearchTerm("");
    inputRef.current?.focus();
  };

  return (
    <div className={`relative w-full md:w-auto md:justify-self-end ${className}`}>
      <div
        className={`flex items-center rounded-xl border bg-card transition-all duration-200 h-9 md:h-10 px-3 shadow-2xs ${
          isFocused
            ? "ring-2 ring-ring ring-offset-2 border-primary"
            : "border-border"
        }`}
      >
        <Search className="h-4 w-4 me-2.5 text-muted-foreground shrink-0" />

        <Input
          ref={inputRef}
          type="search"
          name="search"
          placeholder={placeholder || t("Search...")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") handleClear();
          }}
          className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-full p-0 text-xs md:text-sm bg-transparent"
        />
      </div>

      {searchTerm && (
        <div className="absolute right-0 mt-1 text-xs text-muted-foreground">
          {t("Press Esc to clear")}
        </div>
      )}
    </div>
  );
};

export { SearchComponent };
