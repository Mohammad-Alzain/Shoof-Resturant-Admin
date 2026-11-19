import { useState } from "react";
import { Eye, EyeSlash } from "iconsax-react";
import { Button } from "@/components/ui/button";
import { Input, InputAddon, InputGroup } from "@/components/ui/input";

import { FieldProps } from "../interfaces/FieldProps";
import InputContainer from "./Common/InputContainer";
import InputLabel from "./Common/InputLabel";
import { getDirection } from "@/Translation/i18n";
import clsx from "clsx";

import { useTranslation } from "react-i18next";

const PasswordInput = (props: FieldProps) => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let cleanedValue = e.target.value.replace(/\s{1,}/g, ""); // Replace 2+ spaces with a single space
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
  const isAddonBeforeIcon = typeof props?.addonBefore === "object";
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
      <InputGroup
        className={` rounded-[8px] mx-1 h-[42px] relative flex  duration-200 transition-all `}
      >
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
          {...props?.register(props?.name)}
          placeholder={t(props?.placeholder)}
          style={{
            height: "42px",
            borderRadius: "6px",
            ...props?.style,
          }}
          disabled={props?.disabled}
          type={"text"}
          className={clsx(
            "dark:text-white shadow-none h-full text-base",
            props?.disabled && "cursor-not-allowed opacity-60 border-gray-200 dark:border-gray-700"
          )}
          onChange={handleInputChange}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`absolute top-0 h-full rounded-[6px] px-3 py-2 hover:bg-transparent ${getDirection() === "rtl" ? " left-0" : " right-0"
            }`}
          onClick={() => setShowPassword((prev) => !prev)}
        >
          {showPassword ? (
            <Eye className="h-4 w-4 stroke-gray-600" aria-hidden="true" />
          ) : (
            <EyeSlash className="h-4 w-4 stroke-gray-600" aria-hidden="true" />
          )}
          <span className="sr-only">
            {showPassword ? t("Hide password") : t("Show password")}
          </span>
        </Button>

        {/* hides browsers password toggles */}
        <style>{`
					.hide-password-toggle::-ms-reveal,
					.hide-password-toggle::-ms-clear {
						visibility: hidden;
						pointer-events: none;
						display: none;
					}
				`}</style>
      </InputGroup>
    </InputContainer>
  );
};

export { PasswordInput };
