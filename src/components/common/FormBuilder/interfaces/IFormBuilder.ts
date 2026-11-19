/* eslint-disable @typescript-eslint/no-unused-vars */
import { CSSProperties, ReactNode } from "react";
import { FieldProps } from "../../Fields/interfaces/FieldProps";

export interface IFormBuilder<_T extends object> {
  ContainerStyle?: CSSProperties;
  ContainerClassName?: string;
  query?: any;
  onChange?: (values: any) => void;
  isPending?: boolean;
  hideBtns?: boolean;
  onSuccessMsg?: string;
  onSuccessFunction?: (res, values?: any) => void;
  onErrorFunction?: (err, values?: any) => void;
  OnSubmit?: (values: any) => void;
  fields?: FieldProps[];
  initialState: any;
  onFormUpdate?: (values: any) => void;
  buttonText?: string | ReactNode;
  primaryBtnClassName?: string;
  seconderyText?: string;
  seconderyButtonSubmit?: (values: any, formMethods: any) => void | string;
  seconderyButtonId?: string;
  primaryButtonId?: string;
  //Zod.Schema|
  validationSchema?: any;
  valudateFunction?: (values: any) => void;
  values?: any;
  setValues?: any;
  refreshOnSubmit?: boolean;
  valuesBody?: (values: any) => any;
}
