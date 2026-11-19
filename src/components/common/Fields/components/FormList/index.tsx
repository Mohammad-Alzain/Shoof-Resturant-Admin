import { FieldProps } from "../../interfaces/FieldProps";
import { useFieldArray } from "react-hook-form";
import FormField from "../..";
import { FieldTypes, FieldTypesOptions } from "../../Enums/Field";

import SelectInput from "../Select";
import React, { useState } from "react";
import { primarySolidBtn } from "@/assets/tailwindClasses/buttons";

import { CloseCircle } from "iconsax-react";
import { OptionsList } from "./components/OptionsList";

import { useTranslation } from "react-i18next";

interface FormList extends FieldProps {
  AddFieldButtonLabel?: string;
}

export const FormList = (props: FormList) => {
  const { t } = useTranslation();
  const { append, remove, fields } = useFieldArray({
    control: { ...props.controlField },
    name: props.name,
  });
  const [, setUpdate] = useState(false);

  return (
    <div className="flex flex-col ">
      {fields.map((item, index) => (
        <div className="my-2" key={index}>
          <SelectInput
            getFieldState={props.getFieldState}
            onChange={props.onChange}
            getValues={props.getValues}
            register={props.register}
            {...item}
            control={FieldTypes.select}
            options={FieldTypesOptions}
            name={`${props.name}.${index}.type`}
            label={t("type_of_field")}
            afterChangeFunction={() => setUpdate((prev) => !prev)}
          />
          <div className="flex flex-auto gap-4 flex-wrap items-center">
            <FormField
              getFieldState={props.getFieldState}
              onChange={props.onChange}
              getValues={props.getValues}
              register={props.register}
              label={t("field_label")}
              {...item}
              control={FieldTypes.text}
              name={`${props.name}.${index}.fieldLabel`}
            />

            <FormField
              getFieldState={props.getFieldState}
              onChange={props.onChange}
              getValues={props.getValues}
              register={props.register}
              {...item}
              label={t("field_name")}
              control={FieldTypes.text}
              name={`${props.name}.${index}.fieldName`}
            />
            <FormField
              getFieldState={props.getFieldState}
              onChange={props.onChange}
              getValues={props.getValues}
              register={props.register}
              {...item}
              label={t("required")}
              control={FieldTypes.switch}
              name={`${props.name}.${index}.required`}
              className="h-fit  pt-4"
            />

            <button
              className={
                "p-0 transition-all w-fit h-fit hover:text-red-500 pt-4"
              }
              type="button"
              onClick={() => {
                remove(index);
              }}
            >
              <CloseCircle size={14} />
            </button>
          </div>
          {props?.getValues(`${props.name}.${index}.type`) ===
            FieldTypes.select && (
              <div>
                <OptionsList {...props} name={`${props.name}.${index}.options`} />
              </div>
            )}

          {/* <hr className="border-t w-[80%]  self-center  border-gray-800 my-4" /> */}
        </div>
      ))}

      <button
        type="button"
        className={primarySolidBtn + " mt-4"}
        onClick={() =>
          append({
            type: { value: "text", label: "text" },
            fieldLabel: "field label",
            fieldName: "field name",
            required: false,
            options: [],
          })
        }
      >
        {props.AddFieldButtonLabel
          ? props.AddFieldButtonLabel
          : t("add_field")}
      </button>
    </div>
  );
};
