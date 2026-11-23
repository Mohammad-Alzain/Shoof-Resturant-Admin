import { useContext } from "react";
import { motion } from "motion/react";
import { DataTableProps } from "../../interfaces/DataTableProps";
import { ListLoading } from "../Loading";

import { ListPagination } from "../pagination/ListPagination";
import { TableFilterContext } from "../../Context/TableFilterProvider";

import TableBulkAction from "../Actions/BulkAction";
import ActionsRow from "../Actions/ActionsRow";
import { EmptyPlate } from "@/components/common/EmptyPlate";
import { useTranslated } from "@/Translation/helper/getTranslation";
import { CustomCardRow } from "../row/cardRow/CardRow";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_GRID = "grid gap-4 sm:grid-cols-2 xl:grid-cols-3";

function TableRowsAsCard<T extends object>(props: DataTableProps<T>) {
  const { tableSetting } = useContext(TableFilterContext);
  const Rows = tableSetting?.data;
  const nodata = useTranslated("nodata");
  const grid = props.cardGridClassName ?? DEFAULT_GRID;

  // Designed cards: the page supplies the card, the table supplies data, paging and the row buttons.
  if (props.renderCard) {
    const rows: any[] = Array.isArray(Rows) ? Rows : [];
    return (
      <div className="flex flex-col gap-5 py-4">
        {tableSetting?.loading && !rows.length ? (
          <div className={grid} aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : rows.length ? (
          <div className={grid}>
            {rows.map((row, index) => (
              <div key={`card-${row?.id ?? index}`} className="min-w-0">
                {props.renderCard!(row, { index, rows, actions: <ActionsRow {...props} row={row} keyProp={index} tableMode="cards" /> })}
              </div>
            ))}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-dashed border-border">
            <EmptyPlate title={nodata} />
          </motion.div>
        )}
        <div className="flex justify-end">
          <ListPagination />
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 overflow-x-auto flex flex-col gap-4 ">
      <div className="flex flex-wrap gap-8">
        {typeof Rows === "object" && Rows.length > 0 ? (
          Rows.map((row: any, i: any) => {
            return (
              <CustomCardRow
                keyProp={i}
                {...props}
                row={row}
                key={`row-${i}-${row?.id}`}
              />
            );
          })
        ) : Rows?.length === 0 ? (
          <div>
            <EmptyPlate title={nodata} />
          </div>
        ) : (
          <></>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        {<ListPagination />}
      </div>
      {tableSetting?.loading && <ListLoading />}
      <TableBulkAction {...props} />
    </div>
  );
}

export default TableRowsAsCard;
