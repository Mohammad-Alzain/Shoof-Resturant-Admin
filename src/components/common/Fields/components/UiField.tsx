import clsx from "clsx";
import FormField from "..";
import { FieldProps } from "../interfaces/FieldProps";
import { Controller } from "react-hook-form";
import { FormErrorMessage } from "../../FormBuilder/FormErrorMsg";
import React, { ReactNode } from "react";

const UiField = (props: FieldProps) => {
  const renderUiCell = () => {
    if (typeof props.uiCell === "function") {
      const uiCellFunc = props.uiCell as (form: any) => ReactNode;
      return uiCellFunc({
        values: props.getValues ? props.getValues() : {},
        setFieldValue: props.setValue,
        errors: props.errors,
        ...props
      });
    }
    return props.uiCell as ReactNode;
  };

  return (
    <div className={props?.gridClassName || props?.className}>
      {!props?.uiCell
        ? props.fields?.map((item, key) => {
          return (
            <div className={clsx(item?.className)} key={key}>
              <Controller
                control={props?.controlField}
                name={item?.name}
                render={({ field: { onChange, value } }) => {
                  return (
                    <FormField
                      controlField={props?.controlField}
                      onChange={onChange}
                      value={value}
                      setValue={props?.setValue}
                      watch={props?.watch}
                      getFieldState={props?.getFieldState}
                      getValues={props?.getValues}
                      register={props?.register}
                      {...item}
                    />
                  );
                }}
              />
              <FormErrorMessage error={props?.errors[item?.name]} />
            </div>
          );
        })
        : renderUiCell()}
    </div>
  );
};

export default UiField;
