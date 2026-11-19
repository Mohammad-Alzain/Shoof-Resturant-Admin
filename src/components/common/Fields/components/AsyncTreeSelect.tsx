import React, { useEffect, useState } from "react";
import { UseQueryResult } from "@tanstack/react-query";
import { FieldProps as FieldPropsInterface } from "../interfaces/FieldProps";
import InputLabel from "./Common/InputLabel";
import InputContainer from "./Common/InputContainer";
import { ConvertArrayToOptions } from "../../../../helpers/arrays";
import TreeSelect from "./Common/TreeSelect/TreeSelect";
import { TreeNode } from "./Common/TreeSelect/types";
import { BaseApiResponseEnumKeys, IBaseApiResponse } from "@/Api/types";
import i18next from "@/Translation/i18n";

function TreeAsyncSelect(props: FieldPropsInterface) {
  const [options, setOptions] = useState(props.options);
  const { t } = i18next;
  const [state, setState] = useState<TreeNode[]>(() => {
    const initialValue = props?.value;
    if (Array.isArray(initialValue)) {
      return initialValue.map((item) =>
        typeof item === "object" && item.label
          ? item
          : {
              value: item,
              label:
                options?.find((opt) => opt.value === item)?.label ||
                item.toString(),
            }
      );
    } else if (initialValue) {
      return [
        typeof initialValue === "object" && initialValue.label
          ? initialValue
          : {
              value: initialValue,
              label:
                options?.find((opt) => opt.value === initialValue)?.label ||
                initialValue.toString(),
            },
      ];
    }
    return [];
  });
  const [inputText, setInputText] = useState("");
  const [searchTextDebounced, setSearchTextDebounced] = useState("");

  const [paramsSearch, setParamsSearch] = useState({
    [props.searchAttribute]: "",
  });
  const params = props?.queryParams ?? {};
  const queryResult = props.query
    ? (props.query({
        ...paramsSearch,
        ...params,
      }) as UseQueryResult<IBaseApiResponse<any>>)
    : { isLoading: false, data: undefined };

  const { isLoading, data } = queryResult;

  const handleChange = (selectedOption: TreeNode | TreeNode[]) => {
    if (Array.isArray(selectedOption)) {
      const values = selectedOption.map((item) => item.value);
      props?.onChange(values);
      if (typeof props?.afterChangeFunction === "function")
        props?.afterChangeFunction(props?.getValues());
      setState(selectedOption);
    } else if (selectedOption) {
      props?.onChange(selectedOption.value);
      if (typeof props?.afterChangeFunction === "function")
        props?.afterChangeFunction(props?.getValues());
      setState([selectedOption]);
    } else {
      props?.onChange(null);
      if (typeof props?.afterChangeFunction === "function")
        props?.afterChangeFunction(props?.getValues());
      setState([]);
    }
  };

  useEffect(() => {
    if (data) {
      setOptions(
        ConvertArrayToOptions(
          data[BaseApiResponseEnumKeys.data],
          props.selectLabelAttributeName,
          props.selectValueAttributeName,
          props.selectChildrenKey,
          props.selectChildLabelAttributeName,
          props.selectChildValueAttributeName
        )
      );
    } else if (props.options) {
      setOptions(
        ConvertArrayToOptions(
          props.options,
          props.selectLabelAttributeName,
          props.selectValueAttributeName,
          props.selectChildrenKey,
          props.selectChildLabelAttributeName,
          props.selectChildValueAttributeName
        )
      );
    }
  }, [data, props.options]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(event.target.value);
    setTimeout(() => {
      setSearchTextDebounced(event.target.value);
    }, 500);
  };

  useEffect(() => {
    if (props.searchAttribute) {
      setParamsSearch({ ...paramsSearch, [props.searchAttribute]: inputText });
    }
  }, [searchTextDebounced]);

  return (
    <InputContainer className={props.className}>
      <InputLabel
        required={props.required}
        label={props.label}
        toolTipText={props.toolTipText}
      />
      <TreeSelect
        handleInputChange={handleInputChange}
        inputSearchValue={inputText}
        isLoading={isLoading}
        canSelectParent={props?.canSelectParent}
        value={state}
        multiSelect={props?.isMulti}
        data={options ?? []}
        onSelect={handleChange}
        placeholder={t("select")}
      />
    </InputContainer>
  );
}

export default TreeAsyncSelect;
