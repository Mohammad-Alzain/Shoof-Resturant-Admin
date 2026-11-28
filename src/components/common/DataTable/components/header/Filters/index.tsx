/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext, useRef, useState } from "react";

import { DataTableProps } from "../../../interfaces/DataTableProps";
import { deleteObjectFromArray } from "../../../../../../helpers/arrays";
import FormBuilder from "../../../../FormBuilder";
import { TableFilterContext } from "../../../Context/TableFilterProvider";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BaseApiResponseEnumKeys } from "@/Api/types";

const isSet = (v: unknown) => v !== undefined && v !== null && v !== "" && !(typeof v === "number" && isNaN(v)) && !(Array.isArray(v) && !v.length);

const FilterDrawer = <T extends object>(props: DataTableProps<T>) => {
  const { filters, setCheckedFilters } = useContext(TableFilterContext);
  const location = useRouterState();
  const [open, setOpen] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const { t } = useTranslation();

  const fields: any[] = deleteObjectFromArray(props?.filters, location?.location?.state) ?? [];
  const names: string[] = fields.map((f) => f.name);
  const active = names.filter((name) => isSet(filters?.[name])).length;
  // The form opens with what is applied now (including what came from the link).
  const initial = Object.fromEntries(names.map((name) => [name, filters?.[name] ?? null]));

  /** Replace the drawer's own filters; search and sort stay as they are. */
  const apply = (values: Record<string, unknown>) => {
    setCheckedFilters((prev: Record<string, unknown>) => {
      const next: Record<string, unknown> = { ...prev, [BaseApiResponseEnumKeys.page]: 1 };
      for (const name of names) {
        if (isSet(values[name])) next[name] = values[name];
        else delete next[name];
      }
      return next;
    });
    setOpen(false);
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
                className="relative flex gap-1 md:gap-2 font-semibold p-2 md:p-3 border-2 hover:text-primary duration-500 border-border bg-card group"
                variant="ghost"
                aria-label={t("a11y_filters")}
              >
                <Filter
                  strokeWidth={4}
                  className="stroke-primary w-6 h-6 fill-amber-200"
                  size={24}
                />
                {active > 0 && (
                  <span aria-hidden className="absolute -end-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[0.625rem] font-semibold text-primary-foreground">
                    {active}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
          </SheetTrigger>
        </Tooltip>
      </TooltipProvider>
      <SheetContent
        dir={getDirection()}
        side={getDirection() === "rtl" ? "left" : "right"}
        className="overflow-y-auto"
        // Focus the heading, not the first field: a date field would open its calendar over the panel.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          titleRef.current?.focus();
        }}
      >
        <SheetHeader>
          <SheetTitle ref={titleRef} tabIndex={-1} className="focus:outline-none">
            {t("Filter_Results")}
          </SheetTitle>
          <SheetDescription>{t("filter_description")}</SheetDescription>
        </SheetHeader>
        <FormBuilder
          ContainerClassName="mt-4"
          seconderyButtonSubmit={() => apply({})}
          seconderyText={t("reset_filters")}
          OnSubmit={apply}
          initialState={initial}
          fields={fields}
        />
      </SheetContent>
    </Sheet>
  );
};

export { FilterDrawer };
