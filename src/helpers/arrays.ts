/* eslint-disable @typescript-eslint/no-explicit-any */
//import { FieldTypes } from "../components/Common/Fields/Enums/Field";
import { FieldProps } from "@/components/common/Fields/interfaces/FieldProps";
import { getNestedValue } from "./objects";

export function spliceArrayAroundItem(
  arr: any,
  item: any,
  valueOfSplice: number
) {
  const index = arr.indexOf(Number(item));
  if (index === -1) {
    return [];
  }
  const start = Math.max(0, index - valueOfSplice);
  const end = Math.min(arr.length - 1, index + valueOfSplice);
  return arr.slice(start, end + 1);
}

export function ConvertArrayToOptions(
  arr: Record<string, any>[],
  labelKey: string,
  valueKey: string,
  childrenKey?: string,
  labelChildKey?: string,
  valueChildKey?: string
): any[] {
  if (!Array.isArray(arr) || arr.length === 0) {
    return [];
  }

  return arr.map((item) => {
    const label = getNestedValue(item, labelKey) || "No label provided";
    const value = getNestedValue(item, valueKey);

    const children =
      childrenKey && item[childrenKey]
        ? ConvertArrayToOptions(
            item[childrenKey],
            labelChildKey || labelKey,
            valueChildKey || valueKey,
            childrenKey,
            labelChildKey,
            valueChildKey
          )
        : undefined;

    return {
      data: item,
      label,
      value,
      children,
    };
  });
}
export function deleteObjectFromArray(
  arr: FieldProps[],
  obj: Record<string, any>
): FieldProps[] {
  if (!arr) return;
  if (!obj) return arr;
  const updatedArray = arr.filter((item) => {
    return !Object.keys(obj).includes(item.name);
  });
  return [...updatedArray];
}

// function getObjectFields(obj: Record<string, any>): FieldProps[] {
//   return Object.entries(obj).map(([key, value]) => {
//     return {
//       name: key,
//       control: typeof value === "string" ? FieldTypes.text : FieldTypes.number, // Adjust control type as needed
//       // Other properties...
//     };
//   });
// }
