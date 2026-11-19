/* eslint-disable no-unsafe-optional-chaining */
import { onKeyActivate } from "@/helpers/a11y";
import React, { useEffect, useRef, useState } from "react";
import { FieldProps } from "../interfaces/FieldProps";
import InputLabel from "./Common/InputLabel";
import { AvatarWithBlank } from "../../ui/Avatar";
import { Document, GalleryAdd, Trash } from "iconsax-react";
import { Button } from "@/components/ui/button";
import { actionStyle } from "@/assets/tailwindClasses/buttons";
import i18next from "@/Translation/i18n";

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
    <div className=" relative flex flex-col">
      <div className=" flex gap-4 items-center">
        <AvatarWithBlank width={100} icon={<Document size={30} />} src={url} />
      </div>
      <Button
        variant="ghost"
        className={
          actionStyle +
          " hover:bg-transparent hover:text-destructive absolute bottom-0 left-[50%] translate-x-[-50%]"
        }
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          props?.remove(props?.index);
        }}
      >
        <Trash size={12} />
      </Button>
    </div>
  );
};
const ImagesInput = (props: FieldProps) => {
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
      <div className="flex flex-wrap gap-4">
        <input
          accept={props?.accept}
          multiple={props?.isMulti ? true : false}
          disabled={disabled}
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
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
        {!disabled && (
          <div role="button" tabIndex={0} onKeyDown={onKeyActivate}
            className={
              " gap-2 flex flex-col justify-center items-center border-2 p-4 border-dashed text-gray-200 dark:text-muted  duration-500 w-[106px] h-[100px] " +
              props?.className +
              (!disabled
                ? " hover:border-primary hover:text-primary hover:dark:text-primary cursor-pointer "
                : " ")
            }
            onClick={handleClick}
          >
            <GalleryAdd />
            <span className=" text-[8pt] ">{t("add_image")}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagesInput;
