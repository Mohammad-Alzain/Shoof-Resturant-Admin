import { FieldProps as FieldPropsInterface } from "../interfaces/FieldProps";
import InputLabel from "./Common/InputLabel";
import InputContainer from "./Common/InputContainer";

import { Input, InputAddon, InputGroup } from "@/components/ui/input";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

function TextInput(props: FieldPropsInterface) {
  const { t } = useTranslation();
  // Prevent more than one space
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let cleanedValue = e.target.value.replace(/\s{2,}/g, " "); // Replace 2+ spaces with a single space
    if (cleanedValue.startsWith(" ")) {
      cleanedValue = cleanedValue.replace(/^\s+/g, "");
    }
    e.target.value = cleanedValue;
    if (props?.register) {
      props.register(props?.name)?.onChange(e); // Ensure `react-hook-form` still handles the value
      if (typeof props?.afterChangeFunction === "function")
        props?.afterChangeFunction(props?.getValues());
    }
  };

  // Determine if addon is an icon (you might want to make this configurable via props)
  const isAddonBeforeIcon = typeof props?.addonBefore === "object";
  const isAddonAfterIcon = typeof props?.addonAfter === "object";

  return (
    <InputContainer
      style={props?.style}
      className={twMerge(props?.className, " me-2")}
    >
      <InputLabel
        htmlFor={props?.name}
        className={props?.labelClassName}
        toolTipText={props.toolTipText}
        required={props.required}
        label={props.label}
        variant={props?.toolTipVariant}
      />

      <InputGroup className="w-full h-[42px] mx-1 hover:border-gray-200">
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
          key={props?.name}
          {...props?.register(props?.name)}
          placeholder={t(props?.placeholder)}
          // style={{
          //   height: "42px",
          //   ...props?.style,
          // }}
          disabled={props?.disabled}
          type={"text"}
          className={clsx(
            "dark:text-white shadow-none h-full  text-base",
            props?.disabled && "cursor-not-allowed opacity-60 border-gray-300",
            // !isFocused
            //   ? "border-gray-400 hover:border-gray-500"
            //   : "border-primary shadow-input-primary",
            // "border-[0.11rem] duration-200 transition-all"
          )}
          // onFocus={() => setIsFocused(true)}
          // onBlur={() => setIsFocused(false)}
          onChange={handleInputChange}
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

export default TextInput;
