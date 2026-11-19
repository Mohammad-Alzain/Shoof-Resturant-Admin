import i18next from "@/Translation/i18n";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Columns, DataTableProps } from "../../../interfaces/DataTableProps";
import { Checkbox } from "@/components/ui/checkbox";
import { Fragment, useContext, useState } from "react";
import { TableFilterContext } from "../../../Context/TableFilterProvider";
import { getNestedValue } from "@/helpers/objects";
import ActionsRow from "../../Actions/ActionsRow";
import { ArrowDown2 } from "iconsax-react";

type Props = {
  row: any;
  keyProp: any;

  className?: string;
};

const TreeNode = <T extends object>(props: Props & DataTableProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);

  const { handleCheckOne, checkedRows } = useContext(TableFilterContext);
  const checked =
    checkedRows?.findIndex((item) => item === props?.row?.id) !== -1;
  const showActions =
    props?.allowDelete || props?.allowEdit || props?.allowView;
  const hasChild = props?.childrenKey
    ? props?.row[props?.childrenKey]?.length > 0
    : props?.row?.children?.length > 0;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={(open) => hasChild && setIsOpen(open)}
      id="Collapsible"
      className={`px-4`}
    >
      <CollapsibleTrigger
        className={` cursor-${hasChild ? "pointer" : "default"} flex  w-[100%] items-center flex-auto flex-row justify-between bg-card hover:bg-accent transition-all shadow-[rgba(0,_0,_0,_0.06)_0px_3px_8px] border-gray-100 dark:border-gray-800  rounded-lg px-4`}
      >
        <div className="w-2 me-2">
          {hasChild && (
            <ArrowDown2
              width={10}
              className={` transition-all ${isOpen ? "rotate-180" : ""}`}
            />
          )}
        </div>

        {props?.allowCheckBox && (
          <div className="ps-4 pt-1">
            <Checkbox
              color="muted"
              checked={checked}
              onCheckedChange={(value: boolean) => {
                handleCheckOne(value, props?.row);
              }}
              aria-label={i18next.t("a11y_select_row")}
              className="hover:border-blue-500 transition-all"
            />
          </div>
        )}
        {props?.columns?.map((cell: Columns, key: any) => {
          return (
            <Fragment key={key}>
              {!cell.Cell ? (
                cell?.access && getNestedValue(props?.row, cell.access) ? (
                  getNestedValue(props?.row, cell.access)
                ) : (
                  <span className="dark:text-white light:text-gray-300">-</span>
                )
              ) : (
                cell?.access &&
                cell?.Cell(
                  cell,
                  getNestedValue(props?.row, cell.access),
                  props?.row
                )
              )}
            </Fragment>
          );
        })}
        {showActions && <ActionsRow {...props} />}
      </CollapsibleTrigger>
      <CollapsibleContent className="CollapsibleContent w-[100%]  dark:bg-neutral-900 rounded-lg ">
        <div className="flex flex-col gap-2 my-2 tree-node-element-h relative  ">
          <div className=" absolute w-4 h-full bottom-0 border-dashed border-r-[0.5px]" />
          {/* <div className=" absolute w-4 h-2 top-1 bottom-0 border-dashed border-b-[0.5px]" /> */}
          {props?.childrenKey
            ? props?.row[props?.childrenKey]?.map((item, key) => (
                <TreeNode {...props} row={item} key={key} />
              ))
            : props?.row?.children?.map((item, key) => (
                <TreeNode {...props} row={item} key={key} />
              ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default TreeNode;
