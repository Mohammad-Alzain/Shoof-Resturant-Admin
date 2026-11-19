import { JSX } from "react";

export interface Columns {
  header: string;
  access?: string;
  Cell?: (cell: any, item: any) => JSX.Element;
}
