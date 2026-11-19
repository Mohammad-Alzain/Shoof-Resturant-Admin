/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-constant-condition */
/* eslint-disable no-var */
import { FieldTypes } from "@/components/common/Fields/Enums/Field";

export function objectKeysToArray<T extends Record<string, string>>(
  obj: T,
  exclude?: string[]
): string[] {
  const keys = Object.keys(obj);
  if (exclude) {
    return keys.filter((key) => !exclude.includes(key));
  }
  return keys;
}

export function getFirstValidKey<T extends Record<string, any>>(
  obj: T,
  excludeKeys: string[]
): string {
  for (const key in obj) {
    if (key in obj && !excludeKeys.includes(key)) {
      return key;
    }
  }
  return "";
}
export function getNestedValue(obj: any, path: string): any {
  return path?.split(".").reduce((acc, part) => acc && acc?.[part], obj);
}
export const concatenatedString = (
  array: any[],
  access: string,
  numberOfElemnt?: number
) => {
  const arraySpliced = numberOfElemnt ? array?.slice(0, numberOfElemnt) : array;

  const concatedArray = arraySpliced?.map((obj) => obj[access]).join(", ");

  return concatedArray;
};
export function convertArrayToObject(
  filters: any,
  valueKey?: string
): Record<string, null> {
  const result: Record<string, null> = {};
  if (typeof filters === "object")
    for (const filter of filters) {
      result[filter.name] = filter[valueKey] ?? null;
    }

  return result;
}
export function filterObjectByArray(
  obj: Record<string, any>,
  filterArray: any[]
): Record<string, any> {
  return Object.keys(obj).reduce((result: Record<string, any>, key: any) => {
    if (filterArray.includes(key)) {
      result[key] = obj[key];
    }
    return result;
  }, {});
}
function getObjectByKeyAndAccessor(
  items: any[],
  key: string | number,
  accessor: string,
  labelAccessorAt?: string
): any | undefined {
  var item;
  var labelAccessor;
  if (items?.length) {
    item = items?.find((item) => item[accessor] === key);
    if (labelAccessorAt?.length === 0 || labelAccessorAt === null)
      labelAccessor = "label";
    else labelAccessor = labelAccessorAt;

    if (item)
      return {
        value: item[accessor],
        label: item[labelAccessor],
      };
    else return null;
  }
}
export function convertArrayToObjectWithValues(
  filters: any,
  row: any
): Record<string, null> {
  const result: Record<string, any> = {};
  if (typeof filters === "object")
    for (const filter of filters) {
      if (filter.control === FieldTypes.select) {
        if (typeof row[filter.name] === "number" || "string") {
          const object = getObjectByKeyAndAccessor(
            filter.options,
            row[filter.name],
            "value"
          );
          result[filter.name] = object;
        }
        if (typeof row[filter.name] === "object") {
          var rowObject: any;
          if (filter?.rowAccessor && row[filter.rowAccessor])
            rowObject = row[filter.rowAccessor];
          else rowObject = row[filter.name];
          var key;
          if (rowObject[filter?.valueAccessor] && filter?.valueAccessor)
            key = rowObject[filter?.valueAccessor];
          else key = rowObject["value"];
          const object = getObjectByKeyAndAccessor(
            filter.options,
            key,
            "value"
          );
          result[filter.name] = object.value;
        }
        if (typeof row[filter.rowAccessor] == "object") {
          var rowObject = row[filter.rowAccessor];
          var key;
          if (filter.valueAccessor && rowObject !== null) {
            key = rowObject[filter.valueAccessor];
          } else if (!filter.valueAccessor && rowObject["value"])
            key = rowObject["value"];
          var object;
          if (key !== null && rowObject !== null) {
            object = getObjectByKeyAndAccessor(filter.options, key, "value");
          } else object = null;
          result[filter.name] = object.value;
        }
      } else if (filter.control === FieldTypes.text) {
        if (!filter.rowAccessor) result[filter.name] = row[filter.name];
        else result[filter.name] = row[filter.rowAccessor];
      } else if (filter.control === FieldTypes.number) {
        if (!filter.rowAccessor) result[filter.name] = row[filter.name];
        else result[filter.name] = row[filter.rowAccessor];
      }
      if (filter.control === FieldTypes.asyncSelect) {
        if (typeof row[filter.name] === "number" || "string") {
          const object = getObjectByKeyAndAccessor(
            filter.options,
            row[filter.name],
            "value"
          );
          result[filter.name] = object;
        }
        if (typeof row[filter.name] === "object") {
          var rowObject: any;
          if (filter?.rowAccessor && row[filter.rowAccessor])
            rowObject = row[filter.rowAccessor];
          else rowObject = row[filter.name];
          var key;
          if (rowObject[filter?.valueAccessor] && filter?.valueAccessor)
            key = rowObject[filter?.valueAccessor];
          else key = rowObject["value"];
          const object = getObjectByKeyAndAccessor(
            filter.options,
            key,
            "value"
          );
          result[filter.name] = object.value;
        } else if (typeof row[filter.rowAccessor] == "object") {
          var rowObject = row[filter.rowAccessor];
          var key;

          if (filter.valueAccessor && rowObject !== null) {
            key = rowObject[filter.valueAccessor];
          } else if (!filter.valueAccessor && rowObject["value"])
            key = rowObject["value"];
          var object;
          if (key !== null && rowObject !== null) {
            if (filter.query) {
              object = getObjectByKeyAndAccessor(
                filter?.options,
                key,
                filter?.selectValueAttributeName,
                filter?.selectLabelAttributeName
              );
            }
          } else object = null;
          result[filter.name] = object?.value;
        }
      }
    }

  return result;
}

export const getNumberOfAttributes = <T>(obj: T): number => {
  return Object.keys(obj).length;
};
export function convertObjectTypes(
  input: Record<string, any>
): Record<string, string | number | boolean> {
  const output: Record<string, string | number | boolean> = {};
  for (const key in input) {
    if (input.hasOwnProperty(key)) {
      const value = input[key];
      if (typeof value === "string") {
        output[key] = "string";
      } else if (typeof value === "number") {
        output[key] = "number";
      } else if (typeof value === "boolean") {
        output[key] = "boolean";
      }
    }
  }
  return output;
}
export const setAllKeysNull = (obj: any): any => {
  const returnedObj = JSON.parse(JSON.stringify(obj));
  for (const key in returnedObj) {
    returnedObj[key] = null;
  }
  return returnedObj;
};
