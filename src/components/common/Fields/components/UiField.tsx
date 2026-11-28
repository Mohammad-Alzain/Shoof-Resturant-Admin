import clsx from "clsx";
import FormField from "..";
import { FieldProps } from "../interfaces/FieldProps";
import { Controller } from "react-hook-form";
import { FormErrorMessage } from "../../FormBuilder/FormErrorMsg";
import React, { ReactNode } from "react";
import { errorId, FieldA11yContext } from "@/components/ui/field-a11y";

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
              <FieldA11yContext.Provider value={{ invalid: Boolean(props?.errors?.[item?.name]), describedBy: errorId(item?.name) }}>
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
              </FieldA11yContext.Provider>
              <FormErrorMessage id={errorId(item?.name)} error={props?.errors[item?.name]} />
            </div>
          );
        })
        : renderUiCell()}
    </div>
  );
};

export default UiField;
