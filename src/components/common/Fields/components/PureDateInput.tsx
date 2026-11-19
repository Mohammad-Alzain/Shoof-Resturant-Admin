import { FieldProps as FieldPropsInterface } from "../interfaces/FieldProps";
import InputLabel from "./Common/InputLabel";
import InputContainer from "./Common/InputContainer";
import { Input } from "@/components/ui/input";
import { getDirection } from "@/Translation/i18n";
import "react-day-picker/style.css";

function PureDateInput(props: FieldPropsInterface) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Get the current value of the input
    const currentValue = event.currentTarget.value;
    // Get the pressed key
    const keyPressed = event.key;
    // Get the proposed value if the key is pressed
    const proposedValue = currentValue + keyPressed;
    // Parse the proposed value as a date
    const proposedDate = new Date(proposedValue);
    // Parse the min and max dates

    const minDate =
      typeof props?.min === "function"
        ? new Date(props?.min(props?.getValues()))
        : "";
    const maxDate =
      typeof props?.max === "function"
        ? new Date(props?.max(props?.getValues()))
        : "";

    // Check if the proposed date is within the valid range
    if (proposedDate < minDate || proposedDate > maxDate) {
      // Prevent the default behavior (typing the character)
      event.preventDefault();
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
        className="border border-gray-500 "
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: "6px",
          position: "relative",
        }}
      >
        <Input
          id={props?.name}
          disabled={props?.disabled}
          {...props?.register(props?.name)}
          placeholder={props?.placeholder}
          style={{
            height: "42px",

            ...props?.style,
          }}
          dir={getDirection()}
          className={`dark:text-white flex justify-end  ${
            getDirection() === "rtl" ? "text-right" : " text-left"
          }`}
          type="date"
          onKeyDown={handleKeyDown}
          min={
            typeof props?.min === "function" ? props.min(props?.getValues()) : undefined
          } // Add min date
          max={
            typeof props?.max === "function" ? props.max(props?.getValues()) : undefined
          } // Add max date
        />
      </div>
    </InputContainer>
  );
}

export default PureDateInput;
