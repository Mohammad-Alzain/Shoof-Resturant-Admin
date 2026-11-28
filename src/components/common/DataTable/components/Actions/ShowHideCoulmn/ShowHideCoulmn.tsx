import i18next from "@/Translation/i18n";
import React, { useContext, useMemo, useCallback } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getDirection } from "@/Translation/i18n";
import { GridEdit } from "iconsax-react";
import { useTranslation } from "react-i18next";
import { TableFilterContext } from "../../../Context/TableFilterProvider";
import { Columns } from "../../../interfaces/DataTableProps";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
const ShowHideColumnsControlComponent = ({
  columns,
}: {
  columns: Columns[];
}) => {
  const { t } = useTranslation();
  const { t: publicT } = useTranslation();
  const { tableSetting } = useContext(TableFilterContext);

  // Memoize column items
  const columnItems = useMemo(
    () => columns?.filter((item) => item?.header) || [],
    [columns]
  );

  // Memoized state selectors
  const columnStates = useMemo(() => {
    return columnItems.map((item) => ({
      header: item.header,
      checked: tableSetting?.showedColumns[item.header],
      className: tableSetting?.showedColumns[item.header]
        ? "text-primary bg-primary/10"
        : "",
    }));
  }, [columnItems, tableSetting?.showedColumns]);

  // Memoize click handler
  const handleShowHideChange = useCallback(
    (header: string, checked: boolean) => {
      tableSetting?.onShowHideChange(header, checked);
    },
    [tableSetting]
  );

  return (
    <TooltipProvider>
      <Tooltip defaultOpen={false}>
        <TooltipContent className="bg-foreground text-background">
          {t("show_hide_columns")}
        </TooltipContent>
        <DropdownMenu dir={getDirection() === "ltr" ? "ltr" : "rtl"}>
          <DropdownMenuTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                className="flex gap-1 md:gap-2 font-semibold hover:text-primary p-2 md:p-3 border-2 duration-500 border-border bg-card group"
                variant="ghost"
                aria-label={i18next.t("a11y_columns")}
              >
                <GridEdit
                  variant="Broken"
                  strokeWidth={2}
                  className="size-[16px] stroke-3 stroke-primary"
                />
              </Button>
            </TooltipTrigger>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="bottom"
            align={"end"}
            className="w-56 bg-card border border-border"
          >
            <DropdownMenuLabel className="text-secondary-foreground bg-secondary rounded-md">
              {publicT("show_hide_columns")}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columnStates.map(
              ({ header, checked, className }, index) =>
                // The first column names the row, so it always stays.
                index > 0 && header !== "actions" && header !== "action" && (
                  <DropdownMenuCheckboxItem
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleShowHideChange(header, !checked);
                    }}
                    className={`mt-[0.2rem] text-xs ${className}`}
                    checked={checked}
                  >
                    {header !== "photo" && header !== "image"
                      ? t(header)
                      : t("image")}
                  </DropdownMenuCheckboxItem>
                )
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </Tooltip>
    </TooltipProvider>
  );
};

const ShowHideColumnsControl = React.memo(ShowHideColumnsControlComponent);
export { ShowHideColumnsControl };
