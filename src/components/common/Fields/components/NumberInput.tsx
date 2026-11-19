import { FieldProps as FieldPropsInterface } from "../interfaces/FieldProps";
import InputLabel from "./Common/InputLabel";
import InputContainer from "./Common/InputContainer";

import { Input, InputAddon, InputGroup } from "@/components/ui/input";
import clsx from "clsx";

function NumberInput(props: FieldPropsInterface) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event?.target?.value;

    const sanitizedValue = inputValue.replace(/[^\d.]/g, "");
    // Ensure the value is treated as a number
    let numericValue = Number(sanitizedValue);
    const max =
      typeof props?.max === "function"
        ? Number(props?.max(props?.getValues()))
        : 10000000;

    // Prevent negative values
    if (numericValue < 0) {
      numericValue = 0;
    }
    if (numericValue === 0) numericValue = 0;

    // Prevent value from exceeding max value from props
    if (numericValue > max) {
      numericValue = max;
    }

    if (props?.register) {
      const e = { ...event, target: { ...event.target, value: numericValue } };
      props.register(props?.name)?.onChange(e);
    } else {
      props?.onChange?.(numericValue);
    }

    if (typeof props?.afterChangeFunction === "function") {
      props?.afterChangeFunction(props?.getValues());
    }
  };

  // Determine if addon is an icon (you might want to make this configurable via props)
  const isAddonBeforeIcon = typeof props?.addonBefore === "object";
  const isAddonAfterIcon = typeof props?.addonAfter === "object";

  return (
    <InputContainer style={props?.style} className={props?.className}>
      <InputLabel
        htmlFor={props?.name}
        className={props?.labelClassName}
        toolTipText={props.toolTipText}
        required={props.required}
        label={props.label}
        variant={props?.toolTipVariant}
      />

      <InputGroup className="h-[42px] mx-1">
        {props?.addonBefore && (
          <InputAddon
            className="h-[42px]"
            mode={isAddonBeforeIcon ? "icon" : undefined}
          >
            {isAddonBeforeIcon ? props.addonBefore : props.addonBefore}
          </InputAddon>
        )}

        <Input

          id={props?.name}
          {...props?.register?.(props?.name, {
            setValueAs: (v) => (v === "" ? undefined : parseFloat(v)),
          })}
          disabled={props?.disabled}
          type="number"
          step={props?.step}
          name={props?.name}
          min={
            typeof props?.min === "function" ? props.min(props?.getValues()) : undefined
          }
          max={
            typeof props?.max === "function" ? props.max(props?.getValues()) : undefined
          }
          // value={props?.value}
          onChange={handleChange}
          placeholder={props?.placeholder}
          className={clsx(
            "dark:text-white shadow-none h-full text-base",
            props?.disabled && "cursor-not-allowed opacity-60 border-gray-300"
          )}
          inputMode="numeric"
        />

        {props?.addonAfter && (
          <InputAddon mode={isAddonAfterIcon ? "icon" : undefined}>
            {isAddonAfterIcon ? props.addonAfter : props.addonAfter}
          </InputAddon>
        )}
      </InputGroup>
    </InputContainer>
  );
}

export default NumberInput;
