import { FieldProps } from "../interfaces/FieldProps";
import InputLabel from "./Common/InputLabel";
import InputContainer from "./Common/InputContainer";
import { useState } from "react";
import AddonInput from "./Common/AddonInput";
import clsx from "clsx";
import { Checkbox } from "@/components/ui/checkbox";
export default function CheckBox(props: FieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <InputContainer style={props?.style} className={props?.className}>
      <InputLabel
        className={props?.labelClassName}
        toolTipText={props.toolTipText}
        required={props.required}
        label={props.label}
        variant={props?.toolTipVariant}
      />

      <div>
        {props?.addonBefore && (
          <AddonInput
            isFocused={isFocused}
            position="start"
            value={props?.addonBefore}
          />
        )}

        <Checkbox
          {...props?.register(props?.name)}
          style={{
            ...props?.style,
          }}
          disabled={props?.disabled}
          className={clsx(
            "dark:text-white ",
            props?.disabled && "cursor-not-allowed opacity-60 border-gray-300"
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          checked={props?.value}
          onCheckedChange={(value) => {
            props?.onChange(value);
            if (typeof props?.afterChangeFunction === "function")
              props?.afterChangeFunction(props?.getValues());
          }}
          // onCheckedChange={handleInputChange}
        />
        {props?.addonAfter && (
          <AddonInput
            isFocused={isFocused}
            position="end"
            value={props?.addonAfter}
          />
        )}
      </div>
    </InputContainer>
  );
}
