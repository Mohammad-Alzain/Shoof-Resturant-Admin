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
import { Clock } from "iconsax-react";
import clsx from "clsx";
function TimePicker(props: FieldPropsInterface) {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const direction = getDirection();
  const formatString = "HH:mm:ss";

  useEffect(() => {
    const value = props?.value;
    if (value) {
      const time = new Date(`1970-01-01T${value}`);
      setSelectedTime(isNaN(time.getTime()) ? null : time);
    }
  }, [props?.value]);

  const handleTimeChange = (time: Date | null) => {
    setSelectedTime(time);
    if (props.register && props.name) {
      const formattedTime = time ? format(time, formatString) : "";
      const event = {
        target: {
          name: props.name,
          value: formattedTime,
        },
      };
      props.register(props.name).onChange(event);
      if (typeof props?.afterChangeFunction === "function")
        props?.afterChangeFunction(props?.getValues());
    }
  };

  return (
    <InputContainer style={props?.style} className={props?.className}>
      <InputLabel
        className={props?.labelClassName}
        toolTipText={props.toolTipText}
        required={props.required}
        label={props.label}
        variant={props?.toolTipVariant}
      />

      <div
        className={`border-[0.11rem] duration-200 mx-1 transition-all ${
          !isFocused
            ? "border-gray-200 dark:border-gray-700 hover:border-gray-400"
            : "border-primary shadow-input-primary"
        }`}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: "6px",
          position: "relative",
        }}
      >
        <span
          className={`dark:text-white ps-10 opacity-50 w-full absolute ${
            direction === "rtl" ? "text-right" : "text-left"
          }`}
        >
          {!selectedTime && props?.placeholder}
        </span>
        <DatePicker
          popperContainer={DatePickerLayer}
          // popperContainer={CalendarContainer}
          selected={selectedTime}
          onChange={handleTimeChange}
          showTimeSelect
          showTimeSelectOnly
          timeIntervals={15}
          timeCaption="Time"
          dateFormat={formatString}
          timeFormat={formatString}
          popperPlacement="bottom-start"
          customInput={
            <Input
              {...props?.register(props?.name)}
              placeholder="HH:mm:ss"
              style={{
                height: "42px",
                ...props?.style,
              }}
              disabled={props?.disabled}
              className={`dark:text-white pr-10 ${
                direction === "rtl" ? "text-right" : "text-left"
              }`}
            />
          }
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <Clock
          className={clsx(
            "absolute top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none",
            direction === "ltr" ? "right-3" : "left-3"
          )}
        />
      </div>
    </InputContainer>
  );
}

export default TimePicker;
