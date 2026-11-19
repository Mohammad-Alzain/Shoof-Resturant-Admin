//import TableHeader from "./TableHeader";

import { DataTableProps, Pagination } from "./interfaces/DataTableProps";
import TableContextProvider from "./Context";
import TableRows from "./components/TableRows/TableRows";
import { TableHeader } from "./components/header/TableHeader";
import TableRowsAsCard from "./components/TableRows/TableRowsAsCards";
import TableRowsAsATreeRows from "./components/TableRows/TableRowsAsATree";

export interface DataTableRef {
  getPaginationParams: () => Pagination;
}

function DataTable<T extends object>(props: DataTableProps<T>) {
  return (
    <div style={{ position: "relative" }}>
      <TableContextProvider props={props}>
        <TableHeader {...props} />

        {props?.tableMode === "table" || !props?.tableMode ? (
          <TableRows {...props} />
        ) : props?.tableMode === "cards" ? (
          <TableRowsAsCard {...props} />
        ) : (
          <TableRowsAsATreeRows {...props} />
        )}
      </TableContextProvider>
    </div>
  );
}

export default DataTable;
