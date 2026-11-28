import { useFieldA11yProps } from "@/components/ui/field-a11y";
import { FieldProps } from "../interfaces/FieldProps";
import InputLabel from "./Common/InputLabel";
import InputContainer from "./Common/InputContainer";
import Select, { components } from "react-select";
import React, { useEffect, useState } from "react";
// import { reactSelectStyle } from "./styles/selectStyle/SelectStyle";
import "./styles/selectStyle/index.css";
import i18next from "@/Translation/i18n";
import { ConvertArrayToOptions } from "@/helpers/arrays";

function SelectInput(props: FieldProps) {
  const a11y = useFieldA11yProps();
  const selectLabelAttributeName = props?.selectLabelAttributeName ?? "label";
  const selectValueAttributeName = props?.selectValueAttributeName ?? "value";
  const setValue = props?.setValue;
  const t = i18next.t;
  const [state, setState] = useState<any>(null);
  const [options, setOptions] = useState<any[]>(props?.options || []);

  const handleAfterChange = (value) => {
    if (typeof props?.afterChangeFunction === "function") {
      props?.afterChangeFunction(
        props?.getValues(),
        setValue,
        value,
        props.name
      );
    }
  };

  const handleChange = (selectedOption: any) => {
    if (selectedOption === null || selectedOption === undefined) {
      props?.onChange(null);
      handleAfterChange(null);
      setState(null);
      return;
    }

    let finalValue;
    if (props?.isMulti) {
      if (Array.isArray(selectedOption)) {
        finalValue = selectedOption.map((item) => item?.value);
      } else {
        finalValue = [];
      }
    } else {
      finalValue = selectedOption?.value ?? selectedOption;
    }

    props?.onChange(finalValue);
    handleAfterChange(finalValue);
    setState(selectedOption);
  };

  useEffect(() => {
    if (props?.options) {
      setOptions(
        ConvertArrayToOptions(
          props?.options,
          selectLabelAttributeName || "",
          selectValueAttributeName || ""
        )
      );
    }
  }, [
    props?.value,
    props?.options,
    selectLabelAttributeName,
    selectValueAttributeName,
  ]);

  useEffect(() => {
    const currentValue = props?.value;
    let valueToFind = currentValue;

    // Handle multi-select object array
    if (props?.isMulti && Array.isArray(currentValue)) {
      const isObjectArray = typeof currentValue?.[0] === "object";
      if (isObjectArray) {
        valueToFind = currentValue.map(
          (item) => item?.[selectValueAttributeName]
        );
        props?.onChange(valueToFind); // normalize
        handleAfterChange(valueToFind);
      }
    }

    // Handle single object
    if (
      currentValue &&
      typeof currentValue === "object" &&
      currentValue?.value !== undefined
    ) {
      valueToFind = currentValue.value;
      props?.onChange(valueToFind); // normalize
      handleAfterChange(valueToFind);
    }

    // Set internal selected state
    if (valueToFind !== undefined && valueToFind !== null) {
      if (props?.isMulti && Array.isArray(valueToFind)) {
        const selected = options.filter((opt) =>
          valueToFind.includes(opt.value)
        );
        setState(selected);
      } else {
        const selected = options.find((opt) => opt.value === valueToFind);
        setState(selected || null);
      }
    } else {
      setState(null);
    }
  }, [props?.value, options]);

  const Option = (optionProps: any) => (
    <components.Option {...optionProps}>
      {props.optionNode
        ? props.optionNode(optionProps.data)
        : optionProps.children}
    </components.Option>
  );

  const MenuList = (menuListProps: any) => (
    <components.MenuList
      {...menuListProps}
      innerProps={{
        ...menuListProps.innerProps,
        "data-radix-scroll-lock-ignore": "true",
        className: `${menuListProps.innerProps?.className || ""} react-remove-scroll-allow`,
        onWheel: (e: any) => {
          e.stopPropagation();
          if (menuListProps.innerProps?.onWheel) {
            menuListProps.innerProps.onWheel(e);
          }
        },
        onTouchMove: (e: any) => {
          e.stopPropagation();
          if (menuListProps.innerProps?.onTouchMove) {
            menuListProps.innerProps.onTouchMove(e);
          }
        },
      }}
    />
  );

  return (
    <InputContainer>
      <InputLabel
        htmlFor={props?.name}
        className={props?.labelClassName}
        toolTipText={props.toolTipText}
        required={props.required}
        label={props.label}
        variant={props?.toolTipVariant}
      />

      <div className=" overflow-visible px-1">
        <Select
          aria-invalid={a11y["aria-invalid"]}
          aria-errormessage={a11y["aria-describedby"]}
          inputId={props?.name}
          aria-label={props?.label ? undefined : (props?.placeholder ?? props?.name)}
          menuShouldBlockScroll={false}
          menuPortalTarget={typeof document !== "undefined" ? document.body : null}
          styles={{
            menuPortal: (base) => ({ ...base, zIndex: 999999999, pointerEvents: "auto" }),
            menu: (base) => ({
              ...base,
              zIndex: 999999999,
            }),
            menuList: (base) => ({
              ...base,
              maxHeight: "220px",
              overflowY: "auto",
            }),
          }}
          disabled={props?.disabled}
          placeholder={props?.placeholder ?? t("select_field_placeholder")}
          className="react-select-container"
          classNamePrefix="react-select"
          components={{ Option, MenuList }}
          value={state}
          closeMenuOnSelect={!props?.isMulti}
          isMulti={props.isMulti}
          isClearable
          options={options}
          {...props?.register?.(props?.name)}
          onChange={handleChange}
        />
      </div>
    </InputContainer>
  );
}

export default SelectInput;
