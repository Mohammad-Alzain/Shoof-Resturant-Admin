import React from "react";
import { DataTableProps } from "../../interfaces/DataTableProps";
import { SearchComponent } from "./SearchComponent";

import { Button } from "@/components/ui/button";
import { useParams, useRouterState } from "@tanstack/react-router";
import { Add } from "iconsax-react";
import { FilterDrawer } from "./Filters";
import { useTranslation } from "react-i18next";
import { ShowHideColumnsControl } from "../Actions/ShowHideCoulmn/ShowHideCoulmn";
import SortsMenu from "./Sorts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import clsx from "clsx";
const TableHeaderToolbar = <T extends object>(props: DataTableProps<T>) => {
  const { id } = useParams({ strict: false });
  const routerState = useRouterState();
  const params = useParams({ strict: false });
  const { t } = useTranslation();
  const { t: publicT } = useTranslation();
  return (
    <div
      className={clsx(
        "gap-2.5 w-full min-w-0 flex flex-wrap items-center",
        props?.allowSearch ? "justify-between" : "justify-end"
      )}
    >
      {props?.allowSearch && (
        <div className="w-full sm:w-auto sm:flex-initial min-w-[200px] max-w-full">
          <SearchComponent filterSearchParamName={props?.filterSearchParamName} />
        </div>
      )}
      <div className="flex flex-wrap items-center justify-end gap-1.5 md:gap-2 ms-auto max-w-full">
        {props?.primaryTopActions && props?.primaryTopActions()}
        {(typeof props?.allowCreate === "function" ? props.allowCreate(undefined) : props?.allowCreate) && (
          <TooltipProvider>
            <Tooltip defaultOpen={false}>
              <TooltipTrigger asChild>
                <Button
                  // variant="default"
                  aria-label={props?.createText ? t(props.createText) : publicT("add")}
                  className="text-xs md:text-sm p-2 md:p-3"
                  onClick={(e) => {
                    e.preventDefault();
                    if (props?.createAction) {
                      props?.createAction();
                      return;
                    }
                    props?.createModal?.show({
                      id: id,
                      params,
                      ...props?.addEditProps,
                      routerState: routerState,
                    });
                  }}
                >
                  <div className="flex items-center justify-between gap-1 md:gap-2">
                    <Add className="stroke-current fill-current size-[15px]" />
                    <span className="hidden md:block">
                      {props?.createText ? t(props.createText) : publicT("add")}
                    </span>
                  </div>
                  {/* {t(props?.createText ? props?.createText : "Add", "")} */}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-foreground text-background">
                {t("add_tool_tip")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {props?.filters && <FilterDrawer {...props} />}
        {(props?.allowSorts ?? true) && <SortsMenu {...props} />}
        {(props?.columnsShowHideControl === undefined ||
          props?.columnsShowHideControl) &&
          (props?.tableMode === "table" || props?.tableMode === undefined) && (
            <ShowHideColumnsControl columns={props?.columns} />
          )}
        {props?.secondaryTopActions && props?.secondaryTopActions()}
      </div>
    </div>
  );
};

export { TableHeaderToolbar };
