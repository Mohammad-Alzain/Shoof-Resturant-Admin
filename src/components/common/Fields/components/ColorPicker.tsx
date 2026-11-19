import { onKeyActivate } from "@/helpers/a11y";
import { useEffect, useState } from "react";
import { SketchPicker } from "react-color";
import { Input } from "@/components/ui/input";
import { FieldProps } from "../interfaces/FieldProps";
import InputContainer from "./Common/InputContainer";
import InputLabel from "./Common/InputLabel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CloseCircle } from "iconsax-react";
import i18next from "@/Translation/i18n";
import AddonInput from "./Common/AddonInput";

const ColorPicker = (props: FieldProps) => {
  const [color, setColor] = useState<string | undefined>("");
  const t = i18next.t;

  const handleColorChange = (colorResult) => {
    const value = colorResult.hex;
    setColor(value);
    props?.onChange(value);
    if (typeof props?.afterChangeFunction === "function")
      props?.afterChangeFunction(props?.getValues());
  };

  useEffect(() => {
    if (props?.value) {
      props?.onChange(props?.value);
      if (typeof props?.afterChangeFunction === "function")
        props?.afterChangeFunction(props?.getValues());
      setColor(props?.value);
    } else {
      props?.onChange("");
      if (typeof props?.afterChangeFunction === "function")
        props?.afterChangeFunction(props?.getValues());
      setColor("");
    }
  }, [props?.value]);

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
      <Popover open={isFocused} onOpenChange={setIsFocused}>
        <PopoverTrigger
          className={`border-[1px] duration-200 transition-all w-full ${
            !isFocused
              ? "border-gray-400 hover:border-gray-500"
              : "border-primary shadow-input-primary"
          }`}
          style={{
            display: "flex",
            flexDirection: "column",
            borderRadius: "6px",
            position: "relative",
          }}
          onClick={() => setIsFocused(true)}
        >
          {props?.addonBefore && (
            <AddonInput
              isFocused={isFocused}
              position="start"
              value={props?.addonBefore}
            />
          )}
          <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
            {/* Color Preview - Circle or Square */}
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%", // To make it a circle, change to 0 for a square
                backgroundColor: color || "#fff",
                border: "1px solid #ccc",
                marginRight: "8px",
              }}
            />
            <Input
              {...props?.register(props?.name)}
              readOnly
              className="dark:text-white w-full"
              type="text"
              value={color}
              onChange={(e) => {
                setIsFocused(true);
                const value = e.target.value;
                setColor(value);
                props.onChange(value);
                if (typeof props?.afterChangeFunction === "function")
                  props?.afterChangeFunction(props?.getValues());
              }}
              placeholder={t("no_color_selected")}
              style={{ height: "42px" }}
            />
          </div>

          <span role="button" tabIndex={0} onKeyDown={onKeyActivate}
            className="absolute left-2 top-2 text-gray-500 dark:text-gray-400 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              props?.onChange("");
              if (typeof props?.afterChangeFunction === "function")
                props?.afterChangeFunction(props?.getValues());
              setColor("");
              setIsFocused(false);
            }}
          >
            <CloseCircle className="" size={14} />
          </span>
        </PopoverTrigger>
        <PopoverContent className="m-0 p-0 w-full">
          <SketchPicker
            color={color}
            onChange={handleColorChange}
            disableAlpha
          />
        </PopoverContent>
      </Popover>
    </InputContainer>
  );
};

export default ColorPicker;
