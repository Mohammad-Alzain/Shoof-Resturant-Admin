import { DatePickerLayer } from "./DatePickerLayer";
import i18next from "@/Translation/i18n";
/* eslint-disable react-refresh/only-export-components */

import React, { useState, useEffect, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FieldProps as FieldPropsInterface } from "../interfaces/FieldProps";
import InputLabel from "./Common/InputLabel";
import InputContainer from "./Common/InputContainer";
import { Input } from "@/components/ui/input";
import { isAfter, isBefore, startOfYear, endOfYear } from "date-fns";
import { getDirection } from "@/Translation/i18n";
import "./styles/datepicker-custom.css";
import { ArrowLeft2, ArrowRight2, Calendar } from "iconsax-react";
import clsx from "clsx";
import { useForm } from "react-hook-form";
export function convertToISO(date: Date) {
  const localDate = new Date(date);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");
  const hours = String(localDate.getHours()).padStart(2, "0");
  const minutes = String(localDate.getMinutes()).padStart(2, "0");
  const seconds = String(localDate.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

function DateTimePicker(props: FieldPropsInterface) {
  const { setValue } = useForm();
  const [isFocused, setIsFocused] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const direction = getDirection();
  const formatString = "yyyy-MM-dd HH:mm";
  const minDate = useMemo(() => {
    return props?.min ? new Date(props.min(props?.getValues())) : null;
  }, [props?.getValues()]);
  const maxDate = useMemo(() => {
    return props?.max ? new Date(props.max(props?.getValues())) : null;
  }, [props?.getValues()]);

  const maxField = props?.dateSettings?.maxFieldName;

  useEffect(() => {
    const value = props?.value;
    if (value) {
      const parsedDate = new Date(value);
      setSelectedDate(isNaN(parsedDate.getTime()) ? null : parsedDate);
    }
  }, [props?.value]);

  useEffect(() => {
    if (props?.watch(maxField) && maxField) {
      props?.onChange(props?.watch(maxField));
      if (typeof props?.afterChangeFunction === "function")
        props?.afterChangeFunction(
          props?.getValues(),
          setValue,
          props?.watch(maxField)
        );
      setSelectedDate(new Date(props?.watch(maxField)));
    }
  }, [props?.watch(maxField)]);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (props.register && props.name) {
      const event = {
        target: {
          name: props.name,
          value: date ? convertToISO(date) : "",
        },
      };
      props.register(props.name).onChange(event);

      if (typeof props?.afterChangeFunction === "function")
        props?.afterChangeFunction(
          props?.getValues(),
          setValue,
          event?.target?.value
        );
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const currentValue = event.currentTarget.value;
    const keyPressed = event.key;
    const proposedValue = currentValue + keyPressed;
    const proposedDate = new Date(proposedValue);

    if (
      (minDate && isBefore(proposedDate, minDate)) ||
      (maxDate && isAfter(proposedDate, maxDate))
    ) {
      event.preventDefault();
    }
  };

  const getYearRange = () => {
    const currentYear = new Date().getFullYear();
    const minYear = minDate ? minDate.getFullYear() : currentYear - 100;
    const maxYear = maxDate ? maxDate.getFullYear() : currentYear + 100;
    return Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);
  };

  const getMonthRange = (year: number) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    if (minDate && year === minDate.getFullYear()) {
      return months.slice(minDate.getMonth());
    }
    if (maxDate && year === maxDate.getFullYear()) {
      return months.slice(0, maxDate.getMonth() + 1);
    }
    return months;
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
        className={`border-[0.11rem] duration-200 transition-all mx-1 ${
          !isFocused
            ? "border-gray-200 dark:border-gray-700 hover:border-gray-400"
            : "border-primary shadow-[0 0 0 3px color-mix(in srgb, var(--ring) 30%, transparent)]"
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
          className={`dark:text-white ps-10  opacity-50 w-full absolute  ${
            direction === "rtl" ? "text-right" : "text-left"
          }`}
        >
          {!selectedDate && props?.placeholder}
        </span>
        <DatePicker
          preventOpenOnFocus
          // portalId="calendar-portal"
          // appendTo={typeof window !== "undefined" ? document.body : undefined} // 👈 Important
          popperContainer={DatePickerLayer}
          selected={selectedDate}
          onChange={handleDateChange}
          minDate={maxField ? new Date(props?.watch(maxField)) : minDate}
          maxDate={maxDate}
          showTimeSelect
          dateFormat={formatString}
          timeFormat="HH:mm"
          timeIntervals={15}
          timeCaption="Time"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          customInput={
            <Input
              {...props?.register(props?.name)}
              placeholder="yyyy-MM-DD HH:mm"
              style={{
                height: "42px",
                ...props?.style,
              }}
              disabled={props?.disabled}
              className={`dark:text-white pr-10 ${
                direction === "rtl" ? "text-right" : "text-left"
              }`}
              dir={direction}
              onKeyDown={handleKeyDown}
            />
          }
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          renderCustomHeader={({
            date,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled,
            changeYear,
            changeMonth,
          }) => (
            <div className="flex items-center justify-between px-2 py-2">
              <button
                onClick={decreaseMonth}
                aria-label={i18next.t("a11y_prev_month")}
                disabled={prevMonthButtonDisabled}
                type="button"
                className="p-1 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft2 className=" stroke-primary size-4 stroke-2" />
              </button>
              <div className="flex gap-2">
                <select
                  value={date.getFullYear()}
                  onChange={({ target: { value } }) =>
                    changeYear(Number(value))
                  }
                  className="bg-transparent text-sm border rounded px-1 py-0.5"
                >
                  {getYearRange().map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <select
                  value={date.getMonth()}
                  onChange={({ target: { value } }) =>
                    changeMonth(Number(value))
                  }
                  className="bg-transparent text-sm border rounded px-1 py-0.5"
                >
                  {getMonthRange(date.getFullYear()).map((month, index) => (
                    <option key={month} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={increaseMonth}
                aria-label={i18next.t("a11y_next_month")}
                disabled={nextMonthButtonDisabled}
                type="button"
                className="p-1 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight2 className=" stroke-primary size-4 stroke-2" />
              </button>
            </div>
          )}
          dayClassName={(date) => {
            if (
              (minDate && isBefore(date, startOfYear(minDate))) ||
              (maxDate && isAfter(date, endOfYear(maxDate)))
            ) {
              return "react-datepicker__day--disabled";
            }
            return "";
          }}
        />
        <Calendar
          className={clsx(
            "absolute stroke-gray-400 size-3  top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none",
            direction === "ltr" ? "right-3" : "left-3"
          )}
        />
      </div>
    </InputContainer>
  );
}

export default DateTimePicker;
