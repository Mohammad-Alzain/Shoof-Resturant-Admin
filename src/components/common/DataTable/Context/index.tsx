import React from "react";
//import TableSearchProvider from './TableSearchProvider'
import TableFilterProvider from "./TableFilterProvider";
import { DataTableProps } from "../interfaces/DataTableProps";

function TableContextProvider<T extends object>({
  children,
  props,
}: {
  children: React.ReactNode;
  props: DataTableProps<T>;
}) {
  return (
    <TableFilterProvider props={props}>
      {/* <TableSearchProvider {...props}> */}
      {children}
      {/* </TableSearchProvider> */}
    </TableFilterProvider>
  );
}

export default TableContextProvider;
