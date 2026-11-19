import i18next from "@/Translation/i18n";
import { useContext, useEffect, useState } from "react";

import { DataTableProps } from "../../../interfaces/DataTableProps";
import {
  convertArrayToObject,
  setAllKeysNull,
} from "../../../../../../helpers/objects";
import FormBuilder from "../../../../FormBuilder";
import { TableFilterContext } from "../../../Context/TableFilterProvider";
import { deleteObjectFromArray } from "../../../../../../helpers/arrays";
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
import { Filter } from "iconsax-react";
import { INDEX_pageSize_DEFAULT } from "../../../Constant";
import { BaseApiResponseEnumKeys } from "@/Api/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
      })
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
  const resetFilter = (values, methods) => {
    const resetValues = setAllKeysNull(values);
    setCheckedFilters(() => ({
      ...resetValues,
      [BaseApiResponseEnumKeys.page]: 1,
      [BaseApiResponseEnumKeys.per_page]: INDEX_pageSize_DEFAULT,
    }));

    methods?.reset(resetValues);
    _setValues(resetValues);
    //  setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip defaultOpen={false}>
          <TooltipContent className="bg-foreground text-background">
            {t("Filter_Results")}
          </TooltipContent>

          <SheetTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                className="flex gap-1 md:gap-2 font-semibold p-2 md:p-3 border-2 hover:text-primary duration-500 border-border bg-card group"
                variant="ghost"
                aria-label={i18next.t("a11y_filters")}
              >
                <Filter
                  strokeWidth={4}
                  className="stroke-primary w-6 h-6 fill-amber-200"
                  size={24}
                />
                {/* {t("Filter")} */}
              </Button>
            </TooltipTrigger>
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
              ContainerClassName="mt-4"
              seconderyButtonSubmit={resetFilter}
              seconderyText={t("reset_filters")}
              OnSubmit={handleFilter}
              values={values}
              initialState={{}}
              fields={deleteObjectFromArray(
                props?.filters,
                location?.location?.state
              )}
              setValues={_setValues}
            />
            {/* <SheetFooter>
          <SheetClose asChild>
            <Button type="submit">{t("save_changes")}</Button>
          </SheetClose>
        </SheetFooter> */}
          </SheetContent>
        </Tooltip>
      </TooltipProvider>
    </Sheet>
  );
};

export { FilterDrawer };
