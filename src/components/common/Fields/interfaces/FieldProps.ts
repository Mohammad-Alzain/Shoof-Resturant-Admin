import { UseQueryResult } from "@tanstack/react-query";

import { IBaseApiResponse } from "../../../../Api/types";
import { FieldTypes } from "../Enums/Field";
import { CSSProperties, ReactNode } from "react";
// import { VariantType } from "react-tooltip";
export interface IUploaderSettings {
  style: "gallery" | "files";
  dropZoneText?: string;
  dropZoneIcon?: ReactNode;
  uploadAreaContainerClassName?: string;
  dropZoneDescription?: string;
  /** Upload endpoint, relative to VITE_BASE_URL (default: VITE_UPLOAD_URL or "media"). */
  uploadUrl?: string;
  /** Multipart field name expected by the API (default "file"). */
  uploadFieldName?: string;
  /** Max size per file in MB (default 5, per the API spec). */
  maxSizeMB?: number;
}
export interface FieldProps {
  activeLang?: string;
  optionNode?: (option: any) => React.ReactNode;
  errors?: any;
  labelClassName?: string;
  disabled?: boolean;
  setSubmitDisabled?: (val: any) => any;
  watch?: any;
  dateSettings?: {
    maxFieldName?: string;
    rangeDateStartKey?: string;
    rangeDateEndKey?: string;
    dateWithTime?: boolean;
  };
  inputListSettings?: {
    containerClassName?: string;
    addBtnClassName?: string;
    removeBtnClassName?: string;
  };
  id?: string;
  addFieldInputText?: string;
  removeFieldInputText?: string;
  rangeDateStartKey?: string;
  rangeDateEndKey?: string;
  min?: (values: any) => number | string;
  max?: (values: any) => number | string;
  uiCell?: ReactNode | ((form: any) => ReactNode);
  fields?: FieldProps[];
  style?: CSSProperties;
  className?: string;
  gridClassName?: string;
  register?: any;
  show?: boolean;
  showImagePreview?: boolean;
  controlField?: any;
  isSearchable?: boolean;
  getFieldState?: any;
  setValue?: any;
  selectChildrenKey?: string;
  keyRerender?: any;
  onChange?: any;
  getValues?: any;
  value?: any;
  uploaderSettings?: IUploaderSettings;
  name: string;
  /** Bilingual fields: the key of the Arabic value (`name` holds the English one). */
  pairName?: string;
  /** Bilingual fields: render textareas instead of inputs. */
  multiline?: boolean;
  rows?: number;
  control?: FieldTypes;
  label?: string;
  toolTipText?: string;
  toolTipVariant?: string;
  options?: any[];
  isMulti?: boolean;
  optionLimit?: number;
  searchAttribute?: string;
  helpertext?: string;
  alignComponent?: string;
  form?: any;
  field?: any;
  required?: boolean;
  placeholder?: string;
  query?: (params?: any) => UseQueryResult<IBaseApiResponse<any>>;
  queryParams?: Record<string, string | number | any | null | undefined>;
  selectLabelAttributeName?: string;
  selectValueAttributeName?: string;
  selectChildLabelAttributeName?: string;
  selectChildValueAttributeName?: string;
  parentKey?: string;
  parentValues?: any[];
  parentNotNull?: boolean;
  afterChangeFunction?: (
    values: any,
    setValue?: any,
    value?: any,
    name?: string,
  ) => void;
  children?: FieldProps[];
  containerLabelColor?: string;
  numberOfFiles?: number;
  accept?: any;
  valueAccessor?: string;
  rowAccessor?: string;
  addonBefore?: string | ReactNode;
  addonAfter?: any;
  canSelectParent?: boolean;
  step?: string | number; //for number fields
}
