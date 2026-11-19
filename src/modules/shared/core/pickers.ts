import { FieldTypes } from "@/components/common/Fields/Enums/Field";
import type { FieldProps } from "@/components/common/Fields/interfaces/FieldProps";
import { createCrudApi } from "@/Api/crud";

type PickerOptions = Partial<Pick<FieldProps, "name" | "label" | "required" | "isMulti" | "className" | "helpertext" | "queryParams">>;

const lists = {
  restaurants: createCrudApi<any>("restaurants", "restaurants"),
  categories: createCrudApi<any>("menu-categories", "menu-categories"),
  items: createCrudApi<any>("menu-items", "menu-items"),
  ingredients: createCrudApi<any>("ingredients", "ingredients"),
  currencies: createCrudApi<any>("currencies", "currencies"),
  countries: createCrudApi<any>("countries", "countries"),
  tables: createCrudApi<any>("tables", "tables"),
};

/** Async (search-as-you-type, paged) select over a list endpoint, matched by id and shown by name. */
const picker =
  (defaults: { name: string; query: unknown; label: string; labelAttr?: string }) =>
  (opts: PickerOptions = {}): FieldProps => ({
    control: FieldTypes.asyncSelect,
    searchAttribute: "searchTerm",
    selectLabelAttributeName: defaults.labelAttr ?? "name",
    selectValueAttributeName: "id",
    query: defaults.query as FieldProps["query"],
    ...opts,
    name: opts.name ?? defaults.name,
    label: opts.label ?? defaults.label,
  });

export const restaurantPicker = picker({ name: "restaurantId", query: lists.restaurants.useList, label: "restaurant" });
export const categoryPicker = picker({ name: "menuCategoryId", query: lists.categories.useList, label: "category" });
export const itemPicker = picker({ name: "menuItemId", query: lists.items.useList, label: "item" });
export const ingredientPicker = picker({ name: "ingredientId", query: lists.ingredients.useList, label: "ingredient" });
export const currencyPicker = picker({ name: "currencyId", query: lists.currencies.useList, label: "currency", labelAttr: "isoCode" });
export const countryPicker = picker({ name: "countryId", query: lists.countries.useList, label: "country", labelAttr: "nameEn" });
export const tablePicker = picker({ name: "tableId", query: lists.tables.useList, label: "table", labelAttr: "label" });
