import React, { useContext } from "react";
import { TableFilterContext } from "../../../Context/TableFilterProvider";
import { DataTableProps, Sort } from "../../../interfaces/DataTableProps";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Sort as SortIcon } from "iconsax-react";
import { useTranslation } from "react-i18next";
import { BaseApiResponseEnumKeys } from "@/Api/types";

const SortsMenu = <T extends object>(props: DataTableProps<T>) => {
  const { filters, setCheckedFilters } = useContext(TableFilterContext);
  const { t } = useTranslation();

  // Detect available sort options from columns
  const columns = props?.columns || [];
  const hasIdColumn = columns.some(
    (c) => c.access === "id" || c.sortKey === "id",
  );

  // Check if table contains a name/title column
  const nameColumn = columns.find(
    (c) =>
      c.enableSort !== false &&
      (c.access === "name" ||
        c.access === "title" ||
        c.access === "admin_name" ||
        c.access === "role_name" ||
        c.access === "point_of_sale_name" ||
        c.sortKey === "name" ||
        c.sortKey === "title"),
  );
  const nameKey = nameColumn?.sortKey || nameColumn?.access || "name";

  const customSorts: Sort[] = props?.sorts || [];

  // Build standard sort options
  const defaultOptions: { value: string; label: string }[] = [];

  if (hasIdColumn || !nameColumn) {
    defaultOptions.push(
      { value: "id:desc", label: t("sort_id_desc", "ID: Newest First") },
      { value: "id:asc", label: t("sort_id_asc", "ID: Oldest First") },
    );
  }

  if (nameColumn) {
    defaultOptions.push(
      { value: `${nameKey}:asc`, label: t("sort_name_asc", "Name: A to Z") },
      { value: `${nameKey}:desc`, label: t("sort_name_desc", "Name: Z to A") },
    );
  }

  // Combine standard options and any custom sorts
  const allOptions = [
    ...defaultOptions,
    ...customSorts.map((s) => ({
      value: String(s.value),
      label: s.label,
    })),
  ];

  if (allOptions.length === 0) return null;

  // Determine current active sort
  const currentKey =
    filters?.order_by ||
    filters?.sort_by ||
    (hasIdColumn ? "id" : nameColumn ? nameKey : "");
  const currentDir =
    filters?.order_direction || filters?.sort_direction || "desc";
  const currentValue = currentKey ? `${currentKey}:${currentDir}` : "";

  const handleSortChange = (val: string) => {
    if (!val) return;
    const [key, dir] = val.split(":");
    setCheckedFilters?.((prev: any) => ({
      ...prev,
      [BaseApiResponseEnumKeys.page]: 1,
      order_by: key,
      order_direction: dir,
      sort_by: key,
      sort_direction: dir,
      sort: dir === "desc" ? `-${key}` : key,
    }));
  };

  const activeOption = allOptions.find((o) => o.value === currentValue);
  const activeLabel = activeOption?.label || t("sort", "Sort");

  return (
    <Select value={currentValue} onValueChange={handleSortChange}>
      <SelectTrigger
        className="flex items-center  w-fit gap-1.5 h-9 md:h-10 px-2 md:px-3 border border-border bg-card hover:bg-accent text-xs font-semibold rounded-xl cursor-pointer shadow-2xs"
        title={t("sort", "Sort")}
      >
        <SortIcon size={18} className="text-primary shrink-0" />
        <span className="hidden md:inline-block max-w-[130px] truncate text-foreground">
          {activeLabel}
        </span>
      </SelectTrigger>
      <SelectContent align="end" className="text-xs min-w-[170px]">
        {allOptions.map((item) => (
          <SelectItem
            key={item.value}
            value={item.value}
            className="text-xs cursor-pointer"
          >
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SortsMenu;
