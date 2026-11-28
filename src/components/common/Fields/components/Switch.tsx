import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import InputLabel from "./Common/InputLabel";
import { FieldProps } from "../interfaces/FieldProps";
import { useTranslation } from "react-i18next";
import { useFieldA11yProps } from "@/components/ui/field-a11y";

/** The form value is a real boolean (what the API and the zod schemas use); legacy 1 / "on" / "true" read as on. */
const isOn = (v: unknown) => v === true || v === 1 || v === "on" || v === "true";

export const SwitchFormField = (props: FieldProps) => {
  const { t } = useTranslation();
  const [checked, setChecked] = useState(isOn(props?.value));
  const a11y = useFieldA11yProps();

  useEffect(() => {
    setChecked(isOn(props?.value));
  }, [props?.value]);

  return (
    <div className={props?.className + " flex items-center space-x-4 gap-2 "}>
      <InputLabel className={props?.labelClassName} label={props.label} htmlFor={props?.name} />
      <Switch
        {...a11y}
        disabled={props?.disabled}
        className="flex direction-reverse"
        id={props?.name}
        aria-label={props?.label ? t(props.label) : props?.name}
        // No `register` here: the value is owned by the form Controller (a blur would read the DOM value "on" back).
        checked={checked}
        onCheckedChange={(on) => {
          setChecked(on);
          props?.onChange(on);
          if (typeof props?.afterChangeFunction === "function") props?.afterChangeFunction(props?.getValues());
        }}
      />
    </div>
  );
};
