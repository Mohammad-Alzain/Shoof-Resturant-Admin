"use client";

import InputLabel from "./Common/InputLabel";
import InputContainer from "./Common/InputContainer";
import "./styles/selectStyle/index.css";
import Select, { components } from "react-select";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";

// Assuming these types and helpers are available in your project
import { ConvertArrayToOptions } from "../../../../helpers/arrays";
import type { UseQueryResult } from "@tanstack/react-query";
import { BaseApiResponseEnumKeys, type IBaseApiResponse } from "@/Api/types";
import i18next from "@/Translation/i18n";
import { getNestedValue } from "@/helpers/objects";
import type { FieldProps as FieldPropsInterface } from "../interfaces/FieldProps";

// Helper function to get or create an option object for react-select
const getOrCreateOption = (
  value: any,
  selectValueAttr: string,
  selectLabelAttr: string,
  existingOptions: any[]
) => {
  // If value is already an object with label/value, use it directly
  if (typeof value === "object" && value?.value && value?.label) {
    return value;
  }

  // Try to find in existing options
  const foundOption = existingOptions.find((opt) => opt.value === value);
  if (foundOption) {
    return foundOption;
  }

  // Fallback: create a temporary option
  // Ensure label is always a string
  const finalValue = typeof value === "object" ? value[selectValueAttr] : value;
  const finalLabel =
    typeof value === "object" ? value[selectLabelAttr] : String(value);
  return { value: finalValue, label: finalLabel };
};

function ASyncSelect(props: FieldPropsInterface) {
  const [options, setOptions] = useState<any[]>(props?.options || []);
  const [state, setState] = useState<any>(props.isMulti ? [] : null);
  const object: Record<string, string | number | any | null | undefined> = {};
  object[props?.searchAttribute || ""] = "";
  const [pramsSearch, setPramsSearch] = useState(object);
  const [inputText, setInputText] = React.useState("");
  const [searchTextDebounced, setSearchTextDebounced] = useState("");
  const t = i18next.t;

  // Ref for debouncing timeout
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleAfterChange = useCallback(
    (value: any) => {
      if (typeof props?.afterChangeFunction === "function") {
        props?.afterChangeFunction(props?.getValues(), props?.setValue, value);
      }
    },
    [props?.afterChangeFunction, props?.getValues, props?.setValue]
  );

  // Infinite scroll: pages are fetched one by one and accumulated in poolRef.
  const [page, setPage] = useState(1);
  const [loadedPage, setLoadedPage] = useState(0);
  const poolRef = useRef<any[]>([]);

  const queryResult = props?.query
    ? (props.query({
        ...props?.queryParams,
        ...pramsSearch,
        page,
      }) as UseQueryResult<
      IBaseApiResponse<any>
    >)
    : {
      isLoading: false,
      isFetching: false,
      data: { data: [] },
    };
  const { isLoading, data, isFetching } =
    typeof queryResult === "function"
      ? queryResult
      : (queryResult as UseQueryResult<IBaseApiResponse<any>>);

  const handleChange = useCallback(
    (selectedOption: any) => {
      if (selectedOption === null || selectedOption === undefined) {
        props?.onChange(null);
        handleAfterChange(null);
        setState(props.isMulti ? [] : null);
        return;
      }

      if (props.isMulti) {
        const values = selectedOption.map((option: any) => {
          if (typeof option === "object") {
            return option.value; // Return only the value
          }
          return option;
        });
        props?.onChange(values); // returns array of values to parent
        handleAfterChange(values);
        setState(selectedOption);
      } else {
        const value =
          typeof selectedOption === "object"
            ? selectedOption.value
            : selectedOption;
        props?.onChange(value); // returns value to parent
        handleAfterChange(value);
        setState(selectedOption);
      }
    },
    [props?.onChange, props.isMulti, handleAfterChange]
  );

  // Effect to synchronize internal state with props.value and ensure options are available
  useEffect(() => {
    const currentValue: any = props?.value;
    let normalizedValueForParent: any;

    // Determine if the incoming value is an object or array of objects
    const isIncomingValueObjectFormat =
      (props.isMulti &&
        Array.isArray(currentValue) &&
        currentValue.length > 0 &&
        typeof currentValue[0] === "object") ||
      (!props.isMulti &&
        currentValue !== null &&
        typeof currentValue === "object" &&
        currentValue?.value !== undefined);

    if (
      !currentValue ||
      (Array.isArray(currentValue) && currentValue.length === 0)
    ) {
      if (state !== (props.isMulti ? [] : null)) {
        // If it's already "empty", don't set state again
        const isEmpty = props.isMulti
          ? Array.isArray(state) && state.length === 0
          : state === null;
        if (!isEmpty) {
          setState(props.isMulti ? [] : null);
        }
      }
      return;
    }

    let newSelectedState: any;
    const optionsToAdd: any[] = [];

    if (props.isMulti) {
      const valuesToProcess = Array.isArray(currentValue) ? currentValue : [];
      const mappedValuesForParent: any[] = [];

      newSelectedState = valuesToProcess
        .map((val) => {
          const primitiveValue =
            typeof val === "object"
              ? val?.[props?.selectValueAttributeName || "value"]
              : val;
          if (primitiveValue !== undefined) {
            mappedValuesForParent.push(primitiveValue);
          }

          const option = getOrCreateOption(
            val,
            props?.selectValueAttributeName || "id",
            props?.selectLabelAttributeName || "name",
            options
          );
          if (option && !options.some((opt) => opt.value === option.value)) {
            optionsToAdd.push(option);
          }
          return option;
        })
        .filter(Boolean);
      normalizedValueForParent = mappedValuesForParent;
    } else {
      const primitiveValue =
        typeof currentValue === "object"
          ? currentValue?.[props?.selectValueAttributeName || "value"]
          : currentValue;
      normalizedValueForParent = primitiveValue;

      const option = getOrCreateOption(
        currentValue,
        props?.selectValueAttributeName || "id",
        props?.selectLabelAttributeName || "name",
        options
      );
      newSelectedState = option;
      if (option && !options.some((opt) => opt.value === option.value)) {
        optionsToAdd.push(option);
      }
    }

    if (optionsToAdd.length > 0) {
      setOptions((prevOptions) => {
        const existingValues = new Set(prevOptions.map((opt) => opt.value));
        const filteredNew = optionsToAdd.filter(
          (opt) => opt && !existingValues.has(opt.value)
        );
        if (filteredNew.length === 0) return prevOptions;
        return [...prevOptions, ...filteredNew];
      });
    }

    // Only update state if it actually changed
    // For single select, check value. For multi, check length/contents
    const isStateDifferent = props.isMulti
      ? JSON.stringify(state) !== JSON.stringify(newSelectedState)
      : state?.value !== newSelectedState?.value;

    if (isStateDifferent) {
      setState(newSelectedState);
    }

    // Only notify parent if we normalized from object to primitive
    if (isIncomingValueObjectFormat) {
      props?.onChange(normalizedValueForParent);
      handleAfterChange(normalizedValueForParent);
    }
  }, [
    props?.value,
    props.isMulti,
    // options, // Removing options from dependency because it's updated inside
    props?.selectValueAttributeName,
    props?.selectLabelAttributeName,
  ]);

  const queryParamsString = JSON.stringify(props?.queryParams);
  useEffect(() => {
    setInputText("");
    setSearchTextDebounced("");
    setPage(1);
  }, [queryParamsString]);

  // A new search restarts the list from the first page.
  useEffect(() => {
    setPage(1);
  }, [searchTextDebounced]);

  // API reply shape: { data, page, totalPages }
  const hasMore =
    (data as any)?.page !== undefined &&
    Number((data as any).page) < Number((data as any).totalPages);

  // Selected options are hidden from the menu of a multi select, so it can
  // shrink until it no longer scrolls: keep fetching while few are visible.
  const MIN_VISIBLE_OPTIONS = 10;
  const selectedValues = new Set(
    (Array.isArray(state) ? state : state ? [state] : []).map(
      (opt: any) => opt?.value,
    ),
  );
  const visibleCount = options.filter(
    (opt) => !selectedValues.has(opt.value),
  ).length;
  useEffect(() => {
    if (
      props?.query &&
      hasMore &&
      !isFetching &&
      loadedPage === page &&
      visibleCount < MIN_VISIBLE_OPTIONS
    ) {
      setPage((current) => current + 1);
    }
  }, [props?.query, hasMore, isFetching, loadedPage, page, visibleCount]);

  // Effect to update options from query results or static props
  useEffect(() => {
    let newOptions: any[] = [];
    const rawData = getNestedValue(data, BaseApiResponseEnumKeys.data);
    // The next page is still loading: keep what is already shown.
    if (props?.query && page > 1 && !Array.isArray(rawData)) return;
    if (Array.isArray(rawData)) {
      newOptions = ConvertArrayToOptions(
        rawData,
        props?.selectLabelAttributeName || "",
        props?.selectValueAttributeName || ""
      );
      if (page > 1) {
        const seen = new Set(poolRef.current.map((opt) => opt.value));
        newOptions = [
          ...poolRef.current,
          ...newOptions.filter((opt) => !seen.has(opt.value)),
        ];
      }
      poolRef.current = newOptions;
      setLoadedPage(page);
    } else if (props?.options) {
      newOptions = ConvertArrayToOptions(
        props?.options,
        props?.selectLabelAttributeName || "",
        props?.selectValueAttributeName || ""
      );
    }

    setOptions(() => {
      const selectedOpts = Array.isArray(state)
        ? state
        : state && typeof state === "object" && state.value !== undefined
        ? [state]
        : [];

      const newValues = new Set(newOptions.map((opt) => opt.value));
      const neededSelected = selectedOpts.filter(
        (opt) => opt && !newValues.has(opt.value)
      );

      return [...neededSelected, ...newOptions];
    });
  }, [
    data,
    props?.options,
    props?.selectLabelAttributeName,
    props?.selectValueAttributeName,
    state,
  ]);

  const handleInputChange = useCallback((inputText: string, event: any) => {
    if (event.action !== "input-blur" && event.action !== "menu-close") {
      setInputText(inputText);
      // Clear previous timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      // Set new timeout
      debounceTimeoutRef.current = setTimeout(() => {
        setSearchTextDebounced(inputText);
      }, 500);
    }
  }, []); // No dependencies needed as debounceTimeoutRef is a ref

  useEffect(() => {
    const object: Record<string, string | number | any | null | undefined> = {};
    if (props?.searchAttribute) {
      object[props?.searchAttribute] = searchTextDebounced;
      setPramsSearch(object);
    }
  }, [searchTextDebounced, props?.searchAttribute]);

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
    <InputContainer style={props?.style} className={props?.className}>
      <InputLabel
        htmlFor={props?.name}
        className={props?.labelClassName}
        required={props.required}
        label={props.label}
        toolTipText={props.toolTipText}
      />
      <div className="w-full overflow-visible px-1">
        <Select
          inputId={props?.name}
          aria-label={props?.label ? undefined : (props?.placeholder ?? props?.name)}
          menuPortalTarget={typeof document !== "undefined" ? document.body : null}
          menuShouldBlockScroll={false}
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
          loadingMessage={() => (
            <span className="flex justify-center text-lg items-center gap-2">
              {t("loading")}
              <Loader2 className="animate-spin" />
            </span>
          )}
          isDisabled={props?.disabled}
          closeMenuOnSelect={!props?.isMulti}
          className="react-select-container w-full"
          classNamePrefix="react-select"
          value={state}
          onInputChange={handleInputChange}
          onMenuScrollToBottom={() => {
            if (hasMore && !isFetching) setPage((current) => current + 1);
          }}
          isMulti={props.isMulti}
          isLoading={isLoading || isFetching}
          isClearable
          noOptionsMessage={() => (
            <span className="flex justify-center text-lg items-center gap-2">
              {t("no_options")}
            </span>
          )}
          options={options}
          inputValue={inputText}
          placeholder={props?.placeholder ?? t("select_field_placeholder")}
          onChange={handleChange}
          components={{ Option, MenuList }}
        />
      </div>
    </InputContainer>
  );
}

export default ASyncSelect;
