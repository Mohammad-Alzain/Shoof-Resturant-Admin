import type { TFunction } from "i18next";
import { FieldTypes } from "@/components/common/Fields/Enums/Field";
import type { Filter } from "@/components/common/DataTable/interfaces/DataTableProps";

/**
 * Filters every SuperAdmin list endpoint supports (OpenAPI: `SearchTerm` is the table's search box; `IsActive` and the
 * `CreatedFrom` / `CreatedTo` date range are listed on all lists that have them).
 */

/** Active / inactive: `IsActive=true|false`. */
export const activeFilter = (t: TFunction): Filter =>
  ({
    name: "isActive",
    control: FieldTypes.select,
    label: t("status"),
    options: [
      { value: true, label: t("active") },
      { value: false, label: t("inactive") },
    ],
  }) as Filter;

/** Creation date range: `CreatedFrom` / `CreatedTo` (dates). */
export const createdFilters = (t: TFunction): Filter[] =>
  [
    { name: "createdFrom", control: FieldTypes.date, label: t("created_from") },
    { name: "createdTo", control: FieldTypes.date, label: t("created_to") },
  ] as Filter[];
