import React from "react";
import { FieldProps } from "../../../interfaces/FieldProps";
import { useFieldArray } from "react-hook-form";
import FormField from "../../../index";
import { FieldTypes } from "../../../Enums/Field";
import { Trash } from "iconsax-react";
import { primarySolidBtn } from "@/assets/tailwindClasses/buttons";
import { useTranslation } from "react-i18next";

export const OptionsList = (props: FieldProps) => {
  const { t } = useTranslation();
  const { append, remove, fields } = useFieldArray({
    control: { ...props.controlField },
    name: props.name,
  });

  return (
    <div className="bg-slate-100 p-2">
      {fields.map((item, index) => (
        <div
          className="flex flex-auto flex-wrap items-center gap-4 "
          key={index}
        >
          <FormField
            getFieldState={props.getFieldState}
            onChange={props.onChange}
            getValues={props.getValues}
            register={props.register}
            {...item}
            label={t("option_label")}
            control={FieldTypes.text}
            name={`${props.name}.${index}.label`}
          />
          <FormField
            getFieldState={props.getFieldState}
            onChange={props.onChange}
            getValues={props.getValues}
            register={props.register}
            {...item}
            label={t("option_name")}
            control={FieldTypes.text}
            name={`${props.name}.${index}.value`}
          />

          <div>
            <button
              className="hover:text-red-500 transition-all text-gray-500 dark:text-gray-400 pt-4 ps-2"
              type="button"
              aria-label={t("remove_option", "Remove option")}
              onClick={() => remove(index)}
            >
              <Trash size={14} />
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        className={primarySolidBtn}
        onClick={() => append({ value: "bill", label: "luo" })}
      >
        {t("add_option")}
      </button>
    </div>
  );
};
