/* eslint-disable @typescript-eslint/no-explicit-any */
// Helper type to handle arrays
type HandleArray<T> = T extends Array<infer U> ? U : T;

// Main type to get nested keys
type NestedKeys<T> = T extends object
  ? {
      [K in keyof T]: T[K] extends Array<any>
        ?
            | `${K & string}`
            | `${K & string}[${number}]`
            | `${K & string}[${number}].${NestedKeys<HandleArray<T[K]>> &
                string}`
        : T[K] extends object
        ? `${K & string}` | `${K & string}.${NestedKeys<T[K]> & string}`
        : K & string;
    }[keyof T]
  : never;

// Recursive object type for dot-notation access
type NestedObject<T> = T extends object
  ? {
      [K in keyof T]: T[K] extends object
        ? NestedObject<T[K]>
        : T[K] extends Array<infer U>
        ? NestedObject<U>
        : string;
    }
  : never;

// Main function to create the keys object
export function createKeysFromInterface<T>(): NestedObject<T> & {
  [P in NestedKeys<T>]: string;
} {
  const handler: ProxyHandler<any> = {
    get(_, prop: string | symbol) {
      if (typeof prop === "string") {
        return prop;
      }
      return prop.toString();
    },
  };

  return new Proxy({}, handler) as any;
}
