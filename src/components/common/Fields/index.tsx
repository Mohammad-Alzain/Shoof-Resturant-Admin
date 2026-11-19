/* eslint-disable @typescript-eslint/no-unused-expressions */
import { FieldTypes } from "./Enums/Field";
import TextInput from "./components/TextInput";
//import SelectInput from "./components/Select";
import { FieldProps as $FieldProps } from "./interfaces/FieldProps";
import React, { lazy } from "react";
const TiptapRichEditor = lazy(
  () => import("./components/EditorNew/tiptap-rich-editor")
);
import { PasswordInput } from "./components/PasswordInput";
import DateInputPicker from "./components/DateInput";
import PhoneFieldInput from "./components/PhoneNumberInput";
import NumberInput from "./components/NumberInput";
import { FileUploader } from "./components/uploader/FileUpload";
import SelectInput from "./components/Select";
import { FormList } from "./components/FormList";
import ASyncSelect from "./components/AsyncSelect";
import CheckBox from "./components/CheckBox";
import { SwitchFormField } from "./components/Switch";
import UiField from "./components/UiField";
import FilesInput from "./components/FileInput";
import ImagesInput from "./components/imagesInput";
import TextAreaInput from "./components/TextArea";
import ColorPicker from "./components/ColorPicker";
import PureDateInput from "./components/PureDateInput";
import InputList from "./components/InputList";
import TreeAsyncSelect from "./components/AsyncTreeSelect";
import DateRangePicker from "./components/DateRangeInput";
import DateTimePicker from "./components/DateTimePicker";
import TimePicker from "./components/TimePickerInput";
import TranslatedTextInput from "./components/TranslatedTextInput";
import BilingualInput from "./components/BilingualInput";
import TranslatedTextAreaInput from "./components/TranslatedTextAreaInput";
// import TiptapRichEditor from "./components/EditorNew/tiptap-rich-editor";

function FormField(props: $FieldProps) {
  typeof props?.watch === "function" && props?.watch([props?.parentKey]);
  //typeof props?.watch === "function" && props?.watch();
  // if (
  //   typeof props?.watch === "function" &&
  //   props?.watch([props?.parentKey]) &&
  //   !props?.parentValues?.some(
  //     (item) => item === props?.getValues(props?.parentKey)
  //   )
  // )
  //   props?.setValue(null);

  return (
    <React.Fragment>
      {!props?.parentKey
        ? renderField(props)
        : (props?.parentValues?.some(
            (item) => item === props?.getValues(props?.parentKey)
          ) ||
            (props?.parentNotNull && props?.getValues(props?.parentKey))) &&
          renderField(props)}
    </React.Fragment>
  );
}

function renderField(props: $FieldProps) {
  const { control } = props;
  const fullProps = props;
  switch (control) {
    case FieldTypes.text:
      return <TextInput {...fullProps} />;
    case FieldTypes.password:
      return <PasswordInput {...fullProps} />;
    case FieldTypes.date:
      return <DateInputPicker {...fullProps} />;
    case FieldTypes.dateTime:
      return <DateTimePicker {...fullProps} />;
    case FieldTypes.time:
      return <TimePicker {...fullProps} />;
    case FieldTypes.phone:
      return <PhoneFieldInput {...fullProps} />;
    case FieldTypes.number:
      return <NumberInput {...fullProps} />;
    case FieldTypes.file:
      return <FileUploader {...fullProps} />;
    case FieldTypes.select:
      return <SelectInput {...fullProps} />;
    case FieldTypes.list:
      return <FormList {...fullProps} />;
    case FieldTypes.asyncSelect:
      return <ASyncSelect {...fullProps} />;
    case FieldTypes.AsyncSelectTree:
      return <TreeAsyncSelect {...fullProps} />;
    case FieldTypes.switch:
      return <SwitchFormField {...fullProps} />;
    case FieldTypes.bilingual:
      return <BilingualInput {...(fullProps as any)} />;
    case FieldTypes.uiField:
      return <UiField {...fullProps} />;
    case FieldTypes.fileList:
      return <FilesInput {...fullProps} />;
    case FieldTypes.imagesList:
      return <ImagesInput {...fullProps} />;
    case FieldTypes.textArea:
      return <TextAreaInput {...fullProps} />;
    case FieldTypes.color:
      return <ColorPicker {...fullProps} />;
    case FieldTypes.pureDate:
      return <PureDateInput {...fullProps} />;
    case FieldTypes.inputList:
      return <InputList {...fullProps} />;
    case FieldTypes.rangeDate:
      return <DateRangePicker {...fullProps} />;
    case FieldTypes.checkbox:
      return <CheckBox {...fullProps} />;
    case FieldTypes.richText:
      return <TiptapRichEditor {...fullProps} />;
    case FieldTypes.textTranslated:
      return <TranslatedTextInput {...fullProps} />;
    case FieldTypes.textAreaTranslated:
      return <TranslatedTextAreaInput {...fullProps} />;
    default:
      return null;
  }
}

export default FormField;
