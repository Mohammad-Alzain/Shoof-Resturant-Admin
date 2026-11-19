import InputLabel from "./Common/InputLabel";
import InputContainer from "./Common/InputContainer";
//import { useThemeMode } from '../../../../../_metronic/partials';
import { useEffect, useState } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/high-res.css";
import { FieldProps } from "../interfaces/FieldProps";
import "./styles/phoneNumberInput/index.css";
import { getDirection } from "@/Translation/i18n";
function PhoneFieldInput(props: FieldProps) {
  const [value, setValue] = useState("");

  const handleChange = (event: any) => {
    const inputValue = event;
    const sanitizedValue = inputValue.replace(/(?:^\.|[^\d.])/g, "");
    //setFieldValue(props?.name, sanitizedValue);
    props?.onChange("+" + sanitizedValue);
    setValue(sanitizedValue);
    if (typeof props?.afterChangeFunction === "function")
      props?.afterChangeFunction(props?.getValues());
  };

  useEffect(() => {
    setValue(props?.value);
  }, [props?.value]);
  return (
    <InputContainer>
      <InputLabel
        className={props?.labelClassName}
        toolTipText={props.toolTipText}
        required={props.required}
        label={props.label}
        variant={props?.toolTipVariant}
      />

      <PhoneInput
        disabled={props?.disabled}
        value={value}
        containerClass={`d`}
        onChange={handleChange}
        disableSearchIcon
        copyNumbersOnly
        enableAreaCodes
        enableAreaCodeStretch
        enableSearch
        inputStyle={{
          width: "100%",
          height: "42px",
          borderRadius: "6px",
          textAlign: getDirection() === "rtl" ? "end" : "start",
        }}
        dropdownStyle={{ direction: getDirection() }}
      />
    </InputContainer>
  );
}

export default PhoneFieldInput;
