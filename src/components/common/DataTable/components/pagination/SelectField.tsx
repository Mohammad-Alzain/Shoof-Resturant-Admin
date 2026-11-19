import React, { useContext } from "react";

import { TableFilterContext } from "../../Context/TableFilterProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INDEX_pageSize_OPTIONS } from "../../Constant";
import { useTranslation } from "react-i18next";
import { BaseApiResponseEnumKeys } from "@/Api/types";
import { getDirection } from "@/Translation/i18n";

export default function SelectField() {
  const { t } = useTranslation();
  const { filters, setCheckedFilters, tableSetting } =
    useContext(TableFilterContext);

  const handleChangePage = async (value: string) => {
    if (value) {
      await setCheckedFilters({
        ...filters,
        [BaseApiResponseEnumKeys.page]: 1,
        [BaseApiResponseEnumKeys.per_page]: value,
      });
      tableSetting?.paginationSettings.onShowSizeChange(Number(value));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className=" text-[0.6rem] text-muted-foreground w-12 ">
        {t("items_per_page")}
      </span>
      <Select
        dir={getDirection()}
        value={tableSetting?.paginationSettings?.pageSize?.toString()}
        onValueChange={(e) => {
          handleChangePage(e);
        }}
      >
        <SelectTrigger className="w-16 " aria-label={t("a11y_rows_per_page")}>
          <SelectValue placeholder={t("page_size")} />
        </SelectTrigger>
        <SelectContent>
          {INDEX_pageSize_OPTIONS.map((item) => (
            <SelectItem key={item} value={item?.toString()}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
