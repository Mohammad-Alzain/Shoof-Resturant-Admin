//import { getFirstValidKey } from '../../../../helpers/objects';
import React, { createContext, useState } from "react";

export const TableSearchContext = createContext<string>("");
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const TableSearchActionsContext = createContext<
  React.Dispatch<React.SetStateAction<string>>
>(() => {});

function TableSearchProvider(props: { children: React.ReactNode }) {
  const { children } = props;
  // const { getParams } = useObjectSearchParams();
  // const [search, setSearch] = useState(getParams()[getFirstValidKey(getParams(), ["page", "pageSize"])] || "")
  const [search, setSearch] = useState("");
  return (
    <TableSearchContext.Provider value={search}>
      <TableSearchActionsContext.Provider value={setSearch}>
        {children}
      </TableSearchActionsContext.Provider>
    </TableSearchContext.Provider>
  );
}

export default TableSearchProvider;
