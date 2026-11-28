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

/**
 * A column header. It is sortable only when the column names the API's sort key (`sortKey`): the server sorts the whole
 * list, so a column the API cannot sort by offers no sorting.
 */
const CustomHeaderColumn: FC<Props> = ({ column }) => {
  const { filters, setCheckedFilters } = useContext(TableFilterContext);

  const sortKey = column?.sortKey ?? "";
  const isSortable = column?.enableSort !== false && Boolean(sortKey);
  const isCurrent = isSortable && filters?.sortBy === sortKey;
  const descending = isCurrent && String(filters?.sortDescending) === "true";

  const handleSort = () => {
    // Dates start newest first; everything else A → Z.
    const first = /date|at$|atutc$/i.test(sortKey);
    setCheckedFilters?.((prev: Record<string, unknown>) => ({
      ...prev,
      [BaseApiResponseEnumKeys.page]: 1,
      sortBy: sortKey,
      sortDescending: isCurrent ? !descending : first,
    }));
  };

  const translatedHeader = useTranslated(column?.header);
  const headerTitle =
    column?.header !== "image" && column?.header !== "photo" && translatedHeader;

  if (!isSortable) {
    return (
      <th scope="col" className={headerClassName} style={{ border: "none" }}>
        <div className="inline-flex items-center gap-1.5">
          <span>{headerTitle}</span>
        </div>
      </th>
    );
  }

  const hint = isCurrent
    ? descending
      ? i18n.t("sorted_desc_hint")
      : i18n.t("sorted_asc_hint")
    : i18n.t("click_to_sort");

  return (
    <th
      scope="col"
      aria-sort={isCurrent ? (descending ? "descending" : "ascending") : "none"}
      className={`${headerClassName} group select-none transition-colors hover:bg-accent/60`}
      style={{ border: "none" }}
    >
      <button
        type="button"
        onClick={handleSort}
        title={`${headerTitle} - ${hint}`}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm [font:inherit] [letter-spacing:inherit] [text-transform:inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span>{headerTitle}</span>
        <span aria-hidden className="shrink-0 transition-all duration-200">
          {isCurrent ? (
            descending ? (
              <ArrowDown className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
            ) : (
              <ArrowUp className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
            )
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" />
          )}
        </span>
      </button>
    </th>
  );
};

export { CustomHeaderColumn };
