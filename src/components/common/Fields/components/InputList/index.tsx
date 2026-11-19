"use client";

import React, { useEffect } from "react";
import { Controller, useFieldArray } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { FieldProps } from "../../interfaces/FieldProps";
import FormField from "../..";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { CardAdd, CardRemove } from "iconsax-react";
import { FormErrorMessage } from "@/components/common/FormBuilder/FormErrorMsg";
import { FieldTypes } from "../../Enums/Field";

const InputList: React.FC<FieldProps> = (props: FieldProps) => {
  // Initialize field array with react-hook-form
  const { append, remove, fields } = useFieldArray({
    control: props.controlField,
    name: props.name + "_input_list", // Unique name for the field array
  });

  // Effect to handle initial values
  useEffect(() => {
    if (props.value && Array.isArray(props.value) && fields.length === 0) {
      // Clear any existing fields first to avoid duplicates
      while (fields.length > 0) {
        remove(0);
      }

      // Append each item from the default value
      props.value.forEach((item, index) => {
        append(createFieldArrayObject(index, item));
      });
    }
  }, [props.value]);

  /**
   * Creates a field array object with proper typing and structure
   * @param index - The index of the field in the array
   * @param values - The initial values for the field
   * @returns Properly typed field object
   */
  const createFieldArrayObject = (
    index: number,
    values: any = null
  ): Record<string, FieldProps> => {
    const fieldObj: Record<string, FieldProps> = {};

    props?.fields?.forEach((field) => {
      if (field.control === FieldTypes.uiField) {
        // Special handling for uiField components
        fieldObj[`uiField_${index}`] = {
          ...field,
          name: `${props.name}[${index}].uiField`, // Proper nested naming
          value: values,
          register: props.register,
          controlField: props.controlField,
          getFieldState: props.getFieldState,
          onChange: props.onChange,
          getValues: props.getValues,
          watch: props.watch,
          setValue: props.setValue,
          errors: props.errors,
        };
      } else {
        // Regular field handling
        fieldObj[field.name] = {
          ...field,
          name: `${props.name}[${index}].${field.name}`, // Proper nested naming
          value: values?.[field.name] ?? "", // Fallback to empty string
          register: props.register,
          controlField: props.controlField,
          getFieldState: props.getFieldState,
          onChange: props.onChange,
          getValues: props.getValues,
          watch: props.watch,
          setValue: props.setValue,
          errors: props.errors,
        };
      }
    });

    return fieldObj;
  };

  /**
   * Gets the error message for a specific field
   * @param index - The index of the field in the array
   * @param fieldName - The name of the field
   * @param errors - The errors object from react-hook-form
   * @returns The error message if exists, otherwise null
   */
  const getError = (index: number, fieldName: string, errors: any) => {
    const errorArray = errors?.[props.name];
    if (!errorArray || !Array.isArray(errorArray)) return null;

    const fieldError = errorArray[index];
    if (!fieldError) return null;

    // Handle nested field names (e.g., "games[0].levelFamily")
    const parts = fieldName.split(".");
    let current = fieldError;

    // Traverse the error object to find the specific error
    for (const part of parts.slice(1)) {
      // Skip the array index part
      current = current?.[part];
      if (!current) break;
    }

    return current;
  };

  return (
    <div className={clsx("", props?.inputListSettings?.containerClassName)}>
      <AnimatePresence>
        {fields.map((field, index) => (
          <motion.div
            key={field.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={clsx(props?.className, "")}
          >
            {/* Render each field in the array */}
            {Object.entries(field).map(([key, fieldItem]) => {
              if (key === "id") return null; // Skip the id field

              // Type assertion to ensure TypeScript knows the shape of our fieldItem
              const typedFieldItem = fieldItem as unknown as FieldProps;

              return (
                <Controller
                  key={`${field.id}_${key}`}
                  name={typedFieldItem.name}
                  control={props.controlField}
                  render={({
                    field: { onChange, value },
                    formState: { errors },
                  }) => (
                    <div className="flex flex-col gap-2">
                      {/* Spread the field props safely with explicit typing */}
                      <FormField
                        {...{
                          ...typedFieldItem,
                          controlField: props.controlField,
                          getFieldState: props.getFieldState,
                          onChange,
                          value,
                          name: typedFieldItem.name,
                          getValues: props.getValues,
                          register: props.register,
                          watch: props.watch,
                          setValue: props.setValue,
                          errors: props.errors,
                        }}
                      />
                      <FormErrorMessage
                        error={getError(index, typedFieldItem.name, errors)}
                      />
                    </div>
                  )}
                />
              );
            })}

            {/* Remove button for this field set */}
            <Button
              variant="destructive"
              className={clsx(
                "mt-6",
                props?.inputListSettings?.removeBtnClassName
              )}
              onClick={(e) => {
                e.preventDefault();
                const currentValues = props.getValues(props.name);
                const newArray = Array.isArray(currentValues)
                  ? [...currentValues]
                  : [];

                // Remove the item at current index
                newArray.splice(index, 1);
                props.onChange(newArray);

                // Call afterChange callback if provided
                if (typeof props.afterChangeFunction === "function") {
                  props.afterChangeFunction(props.getValues());
                }
                remove(index);
              }}
            >
              <CardRemove size={24} className="stroke-white stroke-3 size-5" />
              {props?.removeFieldInputText || "Remove Field"}
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add new field button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          className={clsx(
            "mt-2 bg-blue-50 border-blue-500 hover:bg-blue-100 text-blue-500 hover:text-blue-600",
            props?.inputListSettings?.addBtnClassName
          )}
          variant="outline"
          disabled={
            props?.max &&
            typeof props?.max === "function" &&
            fields.length >= Number(props?.max?.(props.getValues()) || 0)
          }
          onClick={(e) => {
            e.preventDefault();
            append(createFieldArrayObject(fields.length));
          }}
        >
          <CardAdd size={24} className="stroke-blue-800 stroke-3 size-5" />
          {props?.addFieldInputText || "Add Field"}
        </Button>
      </motion.div>
    </div>
  );
};

export default InputList;
