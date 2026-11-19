import { FieldProps as FieldPropsInterface } from "../interfaces/FieldProps";
import InputLabel from "./Common/InputLabel";
import InputContainer from "./Common/InputContainer";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import clsx from "clsx";
import { getDirection } from "@/Translation/i18n";
import { useTranslation } from "react-i18next";

function TextAreaInput(props: FieldPropsInterface) {
  const { t } = useTranslation();
  const [charCount, setCharCount] = useState(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCharCount(e.target.value.length);
    if (props.register) {
      props.register(props.name).onChange(e);
      if (typeof props?.afterChangeFunction === "function")
        props?.afterChangeFunction(props?.getValues());
    }
  };
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

      <div
        className={`duration-200 px-1 transition-all `}
        style={{
          display: "flex",
          flexDirection: "column",
          borderRadius: "6px",
          position: "relative",
        }}
      >
        <Textarea
          id={props?.name}
          key={props?.name}
          style={{
            // height: "42px",
            ...props?.style,
          }}
          maxLength={props?.max}
          disabled={props?.disabled}
          {...(props?.register && props.register(props?.name))}
          placeholder={t(props?.placeholder)}
          type="text"
          className={clsx(
            "dark:text-white "
            // props?.max ? "resize-none" : " resize-y"
          )}
          onChange={handleInputChange}
        />
        {props.max && (
          <div
            className={clsx(
              "text-xs z-0 text-gray-500 dark:text-gray-400 p-2  bottom-0 absolute",
              getDirection() === "ltr" ? "right-4" : "left-4"
            )}
          >
            {charCount} {t("of")} {props.max(props?.getValues())}
          </div>
        )}
      </div>
    </InputContainer>
  );
}

export default TextAreaInput;
