import i18next from "@/Translation/i18n";
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useContext, useEffect, useState } from "react";

import { DataTableProps } from "../../interfaces/DataTableProps";
import {
  convertArrayToObject,
  setAllKeysNull,
} from "../../../../../helpers/objects";
import FormBuilder from "../../../FormBuilder";
import { TableFilterContext } from "../../Context/TableFilterProvider";
import { deleteObjectFromArray } from "../../../../../helpers/arrays";
import { useRouterState } from "@tanstack/react-router";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { getDirection } from "@/Translation/i18n";
import { useTranslation } from "react-i18next";
import { FilterIcon } from "lucide-react";
import { INDEX_pageSize_DEFAULT } from "../../Constant";
import { BaseApiResponseEnumKeys } from "@/Api/types";

const FilterDrawer = <T extends object>(props: DataTableProps<T>) => {
  const { setCheckedFilters, tableSetting } = useContext(TableFilterContext);
  const location = useRouterState();
  const state: any = location?.location?.state;
  const [open, setOpen] = useState(false);
  const [values, _setValues] = useState({
    ...convertArrayToObject(deleteObjectFromArray(props?.filters, state)),
  });
  const { t } = useTranslation();
  const publicT = useTranslation();
  const handleFilter = (values: any) => {
    const filterArray: Record<string, any> = Object.fromEntries(
      Object.entries(values).filter(([key, value]) => {
        if (typeof value === "number" && isNaN(value)) {
          return;
        }

        return [key, value];
      }),
    );

    setCheckedFilters((prev: any) => ({
      ...prev,
      ...filterArray,
      [BaseApiResponseEnumKeys.page]: 1,
    }));
    tableSetting?.paginationSettings?.onChange(1);
    _setValues(values);
    setOpen(false);
  };
  useEffect(() => {}, [values]);
  const resetFilter = (values) => {
    setCheckedFilters(() => ({
      ...setAllKeysNull(values),
      [BaseApiResponseEnumKeys.page]: 1,
      [BaseApiResponseEnumKeys.per_page]: INDEX_pageSize_DEFAULT,
    }));
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          className="flex gap-2 font-semibold px-3 border-2 hover:text-primary  duration-500 border-border bg-card group"
          variant="ghost"
          aria-label={i18next.t("a11y_filters")}
        >
          <FilterIcon
            strokeWidth={2}
            className=" stroke-primary fill-primary text-primary"
            size={12}
          />
          {/* {t("Filter")} */}
        </Button>
      </SheetTrigger>
      <SheetContent
        dir={getDirection()}
        side={getDirection() === "rtl" ? "left" : "right"}
      >
        <SheetHeader>
          <SheetTitle>{publicT?.t("Filter_Results")}</SheetTitle>
          <SheetDescription>
            {publicT?.t("filter_description")}
          </SheetDescription>
        </SheetHeader>
        <FormBuilder
          ContainerClassName=""
          seconderyButtonSubmit={resetFilter}
          seconderyText={t("reset_filters")}
          OnSubmit={handleFilter}
          initialState={values}
          fields={deleteObjectFromArray(
            props?.filters,
            location?.location?.state,
          )}
          setValues={_setValues}
        />
        {/* <SheetFooter>
          <SheetClose asChild>
            <Button type="submit">{t("save_changes")}</Button>
          </SheetClose>
        </SheetFooter> */}
      </SheetContent>
    </Sheet>
  );
};

export { FilterDrawer };
