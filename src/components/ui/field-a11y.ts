import { createContext, useContext } from "react";

/** Set by a form around each field, so the control itself reports its error to assistive technology. */
export const FieldA11yContext = createContext<{ invalid: boolean; describedBy?: string }>({ invalid: false });

/** `aria-invalid` / `aria-describedby` of the surrounding field. Spread them before the caller's own props. */
export const useFieldA11yProps = () => {
  const { invalid, describedBy } = useContext(FieldA11yContext);
  return invalid ? ({ "aria-invalid": true, "aria-describedby": describedBy } as const) : {};
};

/** Id of a field's error message. */
export const errorId = (name: string) => `${name}-error`;
