import { FC, useContext } from "react";
import i18n from "i18next";
import { Columns } from "../../interfaces/DataTableProps";
import { headerClassName } from "../../Constant/styles";
import { useTranslated } from "@/Translation/helper/getTranslation";
import { TableFilterContext } from "../../Context/TableFilterProvider";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { BaseApiResponseEnumKeys } from "@/Api/types";

type Props = {
  column: Columns;
};

const CustomHeaderColumn: FC<Props> = ({ column }) => {
  const { filters, setCheckedFilters } = useContext(TableFilterContext);

  const isSortable =
    column?.enableSort !== false &&
    Boolean(column?.access || column?.sortKey) &&
    column?.header !== "image" &&
    column?.header !== "photo" &&
    column?.header !== "actions" &&
    column?.header !== "action";

  const sortKey = column?.sortKey || column?.access || "";

  // Check if this column is currently active for sorting
  const currentSortKey = filters?.order_by || filters?.sort_by;
  // If no sorting was explicitly initiated yet, check if this is the default sorted column
  const isDefaultId = !currentSortKey && (sortKey === "id");
  const isCurrentSort = currentSortKey === sortKey || isDefaultId;
  const currentDirection = (isCurrentSort && filters?.order_direction)
    ? filters.order_direction
    : (isCurrentSort && filters?.sort_direction)
    ? filters.sort_direction
    : (isDefaultId ? "desc" : undefined);

  const handleSort = () => {
    if (!isSortable || !sortKey) return;

    let nextDirection: "asc" | "desc" = "asc";
    if (isCurrentSort) {
      nextDirection = currentDirection === "asc" ? "desc" : "asc";
    } else {
      nextDirection =
        sortKey === "id" ||
        sortKey.toLowerCase().includes("date") ||
        sortKey.toLowerCase().includes("created")
          ? "desc"
          : "asc";
    }

    setCheckedFilters?.((prev: any) => ({
      ...prev,
      [BaseApiResponseEnumKeys.page]: 1,
      order_by: sortKey,
      order_direction: nextDirection,
      sort_by: sortKey,
      sort_direction: nextDirection,
      sort: nextDirection === "desc" ? `-${sortKey}` : sortKey,
    }));
  };

  const translatedHeader = useTranslated(column?.header);
  const headerTitle =
    column?.header !== "image" && column?.header !== "photo" && translatedHeader;

  return (
    <th
      className={`${headerClassName} ${
        isSortable
          ? "cursor-pointer select-none group hover:bg-accent/60 transition-colors"
          : ""
      }`}
      style={{ border: "none" }}
      onClick={isSortable ? handleSort : undefined}
      role={isSortable ? "button" : undefined}
      tabIndex={isSortable ? 0 : undefined}
      onKeyDown={
        isSortable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleSort();
              }
            }
          : undefined
      }
      title={
        isSortable
          ? `${headerTitle} - ${
              isCurrentSort
                ? currentDirection === "asc"
                  ? i18n.t("sorted_asc_hint")
                  : i18n.t("sorted_desc_hint")
                : i18n.t("click_to_sort")
            }`
          : undefined
      }
    >
      <div className="flex items-center gap-1.5 inline-flex">
        <span>{headerTitle}</span>
        {isSortable && (
          <span className="shrink-0 transition-all duration-200">
            {isCurrentSort ? (
              currentDirection === "desc" ? (
                <ArrowDown className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
              ) : (
                <ArrowUp className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
              )
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </span>
        )}
      </div>
    </th>
  );
};

export { CustomHeaderColumn };

