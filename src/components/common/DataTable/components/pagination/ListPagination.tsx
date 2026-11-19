import { onKeyActivate } from "@/helpers/a11y";
import { useContext } from "react";
import { TableFilterContext } from "../../Context/TableFilterProvider";
import { useTranslation } from "react-i18next";

import { ArrowLeft2, ArrowRight2 } from "iconsax-react";
import { getDirection } from "@/Translation/i18n";
import SelectField from "./SelectField";
import { BaseApiResponseEnumKeys } from "@/Api/types";

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
  const ItemClassName =
    "  text-muted-foreground cursor-pointer flex items-center justify-center px-3 h-8 transition-all " +
    "bg-muted hover:bg-card rounded-lg";
  const ItemActiveClassName =
    "flex items-center justify-center px-3 h-8 transition-all " +
    " bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg";

  if (tableSetting?.loading) {
    return null;
  }

  if (!tableSetting?.data || tableSetting?.data?.length === 0) {
    return (
      <div className="flex items-center text-xs text-muted-foreground py-2 px-3 font-medium">
        <span>{t("no_items", "No items")}</span>
      </div>
    );
  }

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
        <ul className="inline-flex -space-x-px text-sm mx-2 sm:mx-6 my-2 gap-1">
          <li>
            <span role="button" tabIndex={0} onKeyDown={onKeyActivate} className={ItemClassName} aria-label={t("a11y_first_page")} onClick={() => handleChangePage(1)}>
              {getDirection() === "ltr" ? (
                <ArrowLeft2 className="stroke-primary" size={12} />
              ) : (
                <ArrowRight2 className="stroke-primary" size={12} />
              )}
            </span>
          </li>
          {tableSetting?.paginationSettings.pages?.map(
            (item: any, key: any) => {
              return (
                <li key={key} className={
                    tableSetting?.paginationSettings.current === item
                      ? ItemActiveClassName
                      : ItemClassName
                  }>
                  <button
                    type="button"
                    className="w-full h-full"
                    aria-label={String(item)}
                    aria-current={
                      tableSetting?.paginationSettings.current === item
                        ? "page"
                        : undefined
                    }
                    onClick={() => {
                      handleChangePage(item);
                    }}
                  >
                    {item}
                  </button>
                </li>
              );
            }
          )}

          <li className="mx-1 sm:mx-3">
            <span role="button" tabIndex={0} onKeyDown={onKeyActivate}
              className={ItemClassName}
              onClick={() => {
                handleChangePage(tableSetting?.paginationSettings?.lastPage);
              }}
              aria-label={t("next_page")}
            >
              {getDirection() === "ltr" ? (
                <ArrowRight2 className="stroke-primary" size={12} />
              ) : (
                <ArrowLeft2 className="stroke-primary" size={12} />
              )}
            </span>
          </li>
        </ul>
      </div>
  );
};

export { ListPagination };
