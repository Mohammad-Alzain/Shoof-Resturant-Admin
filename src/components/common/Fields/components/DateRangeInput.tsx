"use client";

import { DatePickerLayer } from "./DatePickerLayer";
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FieldProps as FieldPropsInterface } from "../interfaces/FieldProps";
import InputLabel from "./Common/InputLabel";
import InputContainer from "./Common/InputContainer";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { getDirection } from "@/Translation/i18n";
import "./styles/datepicker-custom.css";
import { Calendar } from "iconsax-react";
import clsx from "clsx";

function DateRangePicker({
  name,
  style,
  className,
  labelClassName,
  toolTipText,
  required,
  label,
  toolTipVariant,
  placeholder,
  disabled,
  register,
  getValues,
  dateSettings,
  afterChangeFunction,
}: FieldPropsInterface) {
  const [isFocused, setIsFocused] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const direction = getDirection();

  useEffect(() => {
    const startValue = getValues(`${dateSettings?.rangeDateStartKey}${name}`);
    const endValue = getValues(`${dateSettings?.rangeDateEndKey}${name}`);

    if (startValue) setStartDate(new Date(startValue));
    if (endValue) setEndDate(new Date(endValue));
  }, [
    getValues,
    dateSettings?.rangeDateStartKey,
    dateSettings?.rangeDateEndKey,
    name,
  ]);

  const handleDateChange = ([start, end]: [Date | null, Date | null]) => {
    setStartDate(start);
    setEndDate(end);

    if (register) {
      if (dateSettings?.rangeDateStartKey) {
        register(`${dateSettings?.rangeDateStartKey}${name}`).onChange({
          target: {
            name: `${dateSettings?.rangeDateStartKey}${name}`,
            value: start ? format(start, "yyyy-MM-dd") : "",
          },
        });
        if (typeof afterChangeFunction === "function")
          afterChangeFunction(getValues());
      }

      if (dateSettings?.rangeDateEndKey) {
        register(`${dateSettings?.rangeDateEndKey}${name}`).onChange({
          target: {
            name: `${dateSettings?.rangeDateEndKey}${name}`,
            value: end ? format(end, "yyyy-MM-dd") : "",
          },
        });
        if (typeof afterChangeFunction === "function")
          afterChangeFunction(getValues());
      }
    }
  };

  return (
    <InputContainer style={style} className={className}>
      <InputLabel
        className={labelClassName}
        toolTipText={toolTipText}
        required={required}
        label={label}
        variant={toolTipVariant}
      />

      <div
        className={clsx(
          "border-[0.11rem] duration-200 transition-all mx-1 flex items-center justify-center relative rounded-lg",
          isFocused
            ? "border-primary shadow-input-primary"
            : "border-gray-200 dark:border-gray-700 hover:border-gray-400"
        )}
      >
        <DatePicker
          popperContainer={DatePickerLayer}
          // popperContainer={CalendarContainer}
          selected={startDate}
          onChange={handleDateChange}
          startDate={startDate}
          endDate={endDate}
          selectsRange
          dateFormat="yyyy-MM-dd"
          customInput={
            <Input
              {...register(`${dateSettings?.rangeDateStartKey}${name}`)}
              placeholder={placeholder}
              style={{ height: "42px", ...style }}
              disabled={disabled}
              className={clsx(
                "dark:text-white pr-10",
                direction === "rtl" ? "text-right" : "text-left"
              )}
              dir={direction}
            />
          }
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <Calendar
          className={clsx(
            "absolute top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none",
            direction === "ltr" ? "right-3" : "left-3"
          )}
        />
      </div>
    </InputContainer>
  );
}

export default DateRangePicker;
