/* eslint-disable no-unsafe-optional-chaining */
import { onKeyActivate } from "@/helpers/a11y";
import React, { useEffect, useRef, useState } from "react";
import { FieldProps } from "../interfaces/FieldProps";
import InputLabel from "./Common/InputLabel";
import { AvatarWithBlank } from "../../ui/Avatar";
import { Document, Trash } from "iconsax-react";
import { Button } from "@/components/ui/button";

import i18next from "@/Translation/i18n";
import { actionStyle } from "@/assets/tailwindClasses/buttons/index";

const FilePreview = (props: {
  index: number;
  file: any;
  remove?: (index: number) => any;
}) => {
  const [url, setUrl] = useState(
    typeof props?.file === "string" ? props?.file : ""
  );

  useEffect(() => {
    if (typeof props?.file !== "string" && props?.file) {
      const reader = new FileReader();
      reader.readAsDataURL(props?.file);
      reader.onloadend = () => {
        setUrl(reader.result as string);
      };
    }
  }, [props?.file]);

  return (
    <div className="flex justify-between w-full bg-slate-100 dark:bg-muted p-0 rounded-lg h-[42px] items-center text-gray-600 dark:text-gray-300">
      <div className=" flex gap-4 items-center">
        <AvatarWithBlank icon={<Document size={30} />} src={url} />
        <span className=" overflow-hidden max-h-6">{props?.file?.name}</span>
      </div>
      <Button
        variant="ghost"
        className={actionStyle + " hover:text-destructive"}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          props?.remove(props?.index);
        }}
      >
        <Trash size={15} />
      </Button>
    </div>
  );
};
const FilesInput = (props: FieldProps) => {
  const [files, setFiles] = useState(
    typeof props?.value !== "object" && props?.value
      ? [props?.value]
      : props?.value
        ? [...props?.value]
        : []
  );
  const fileInputRef = useRef(null);
  const t = i18next.t;
  const disabled = props?.numberOfFiles === files?.length;

  const handleRemoveFile = (index: number) => {
    const copiedFiles = [...files];
    copiedFiles.splice(index, 1);

    setFiles(copiedFiles);
    props?.onChange(copiedFiles);
    if (typeof props?.afterChangeFunction === "function")
      props?.afterChangeFunction(props?.getValues());
  };
  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const filesNew = event.dataTransfer.files;

    if (filesNew) {
      //  onFileChange(file);
      setFiles((prev) => [...prev, ...filesNew]);
      props?.onChange([...filesNew, ...files]);
      if (typeof props?.afterChangeFunction === "function")
        props?.afterChangeFunction(props?.getValues());
    }
  };

  const handleFileChange = (event) => {
    const filesNew = event.target.files;
    if (filesNew) {
      //  onFileChange(file);
      setFiles((prev) => [...prev, ...filesNew]);
      props?.onChange([...filesNew, ...files]);
      if (typeof props?.afterChangeFunction === "function")
        props?.afterChangeFunction(props?.getValues());
    }
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };
  useEffect(() => {}, [files]);

  return (
    <div>
      <InputLabel
        className={props?.labelClassName}
        toolTipText={props.toolTipText}
        required={props.required}
        label={props.label}
        variant={props?.toolTipVariant}
      />
      <div role="button" tabIndex={0} onKeyDown={onKeyActivate}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={props?.style}
        className={
          props?.className +
          " gap-2 flex flex-col border-2 p-2 border-dashed text-gray-500 dark:text-muted  duration-500  " +
          (!disabled
            ? " hover:border-primary hover:text-primary hover:dark:text-primary cursor-pointer "
            : " ")
        }
      >
        {files?.map((file, key) => {
          return (
            <FilePreview
              key={key}
              index={key}
              file={file}
              remove={handleRemoveFile}
            />
          );
        })}

        <input
          accept={props?.accept}
          multiple={props?.isMulti ? true : false}
          disabled={disabled}
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        <span className=" text-sm self-center font-bold  ">
          {!disabled ? t("upload_file_label") : t("upload_file_label_disabled")}
        </span>
      </div>
    </div>
  );
};

export default FilesInput;
