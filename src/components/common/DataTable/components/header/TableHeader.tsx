import { DataTableProps } from "../../interfaces/DataTableProps";

import { TableHeaderToolbar } from "./HeaderToolbar";

//import { TableHeaderToolbar } from "./HeaderToolbar";

const TableHeader = <T extends object>(props: DataTableProps<T>) => {
  return (
    <div className="w-full min-w-0 mt-3 md:mt-[1.81rem] px-2 md:px-4">
      <TableHeaderToolbar {...props} />
    </div>
  );
};

export { TableHeader };
