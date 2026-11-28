import { useContext } from "react";
import { TableFilterContext } from "../../Context/TableFilterProvider";
import { useTranslation } from "react-i18next";

import { ArrowLeft2, ArrowRight2 } from "iconsax-react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { getDirection } from "@/Translation/i18n";
import SelectField from "./SelectField";
import { BaseApiResponseEnumKeys } from "@/Api/types";

const ITEM =
  "flex items-center justify-center min-w-8 px-3 h-8 transition-all rounded-lg text-muted-foreground bg-muted " +
  "enabled:cursor-pointer enabled:hover:bg-card disabled:opacity-40 disabled:cursor-not-allowed";
const ACTIVE =
  "flex items-center justify-center min-w-8 px-3 h-8 transition-all rounded-lg cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90";

const ListPagination = () => {
  const { t } = useTranslation();
  const { filters, setCheckedFilters, tableSetting } =
    useContext(TableFilterContext);

  const handleChangePage = async (value: number) => {
    await setCheckedFilters({
      ...filters,
      [BaseApiResponseEnumKeys.page]: value,
    });
    tableSetting?.paginationSettings.onChange(value);
  };

  if (tableSetting?.loading) {
    return null;
  }

  const current = tableSetting?.paginationSettings?.current ?? 1;
  // An empty list reports 0 pages: it is still "page 1 of 1".
  const last = Math.max(1, tableSetting?.paginationSettings?.lastPage || 1);
  const empty = !tableSetting?.data || tableSetting?.data?.length === 0;

  if (empty && current <= 1) {
    return (
      <div className="flex items-center text-xs text-muted-foreground py-2 px-3 font-medium">
        <span>{t("no_items", "No items")}</span>
      </div>
    );
  }

  const rtl = getDirection() === "rtl";
  const atStart = current <= 1;
  const atEnd = current >= last;

  const nav = (label: string, disabled: boolean, target: number, icon: React.ReactNode) => (
    <li>
      <button type="button" className={ITEM} aria-label={label} disabled={disabled} onClick={() => handleChangePage(target)}>
        {icon}
      </button>
    </li>
  );

  return (
    <div className="flex flex-wrap items-center gap-y-2">
      {tableSetting?.paginationSettings?.total !== undefined && (
        <span className="text-xs text-muted-foreground me-3">
          {t("total", "Total")}:{" "}
          <strong className="text-foreground">
            {tableSetting.paginationSettings.total}
          </strong>
        </span>
      )}
      <SelectField />
      <ul className="inline-flex flex-wrap text-sm mx-2 sm:mx-6 my-2 gap-1">
        {nav(t("a11y_first_page"), atStart, 1, rtl ? <ChevronsRight aria-hidden className="size-3.5 text-primary" /> : <ChevronsLeft aria-hidden className="size-3.5 text-primary" />)}
        {nav(t("a11y_prev_page"), atStart, current - 1, rtl ? <ArrowRight2 aria-hidden className="stroke-primary" size={12} /> : <ArrowLeft2 aria-hidden className="stroke-primary" size={12} />)}
        {tableSetting?.paginationSettings.pages?.map((item: number) => (
          <li key={item}>
            <button
              type="button"
              className={current === item ? ACTIVE : ITEM}
              aria-label={String(item)}
              aria-current={current === item ? "page" : undefined}
              onClick={() => handleChangePage(item)}
            >
              {item}
            </button>
          </li>
        ))}
        {nav(t("next_page"), atEnd, current + 1, rtl ? <ArrowLeft2 aria-hidden className="stroke-primary" size={12} /> : <ArrowRight2 aria-hidden className="stroke-primary" size={12} />)}
        {nav(t("a11y_last_page"), atEnd, last, rtl ? <ChevronsLeft aria-hidden className="size-3.5 text-primary" /> : <ChevronsRight aria-hidden className="size-3.5 text-primary" />)}
      </ul>
    </div>
  );
};

export { ListPagination };
