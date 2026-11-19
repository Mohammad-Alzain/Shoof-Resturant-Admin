"use client";
import React, { ReactNode } from "react";
import { DocumentUpload, GalleryExport } from "iconsax-react";
import { cn } from "@/lib/utils";
import i18next from "@/Translation/i18n";

interface UploadAreaProps {
  getRootProps: () => React.HTMLAttributes<HTMLDivElement>;
  getInputProps: () => React.InputHTMLAttributes<HTMLInputElement>;
  isDragActive: boolean;
  name: string;
  register: any;
  isMulti: boolean;
  numberOfFiles: number;
  Icon?: ReactNode;
  uploaderStyle: "files" | "gallery";
  dropText?: string;
  uploadAreaContainerClassName?: string;
  dropZoneDescription?: string;
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  getRootProps,
  getInputProps,
  isDragActive,
  name,
  register,
  isMulti,
  numberOfFiles,
  dropText,
  Icon,
  uploaderStyle,
  uploadAreaContainerClassName,
  dropZoneDescription,
}) => {
  const t = i18next.t;
  return (
    <>
    <input aria-hidden="true" name={name} {...(typeof register === 'function' ? register(name) : {})} {...getInputProps()} />
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg space-y-2 p-8 text-center cursor-pointer group transition-colors duration-200 ease-in-out",
        uploadAreaContainerClassName,
        isDragActive
          ? "border-primary bg-primary/10"
          : "border-gray-300 hover:border-primary hover:bg-primary/5"
      )}
      role="button"
    >
      {Icon ? (
        Icon
      ) : uploaderStyle === "gallery" ? (
        <GalleryExport className="mx-auto h-12 w-12 stroke-gray-400 mb-4 group-hover:stroke-primary size-4 stroke-2" />
      ) : (
        <DocumentUpload className="mx-auto h-12 w-12 stroke-gray-400 mb-4 group-hover:stroke-primary size-4 stroke-2" />
      )}
      <div className="space-y-1">
        <p className="text-xs text-gray-600 dark:text-gray-300 group-hover:text-primary duration-300 transition-colors overflow-hidden w-full">
          {dropText ?? t("uploader_title")}
        </p>
        <p className="text-[10px]  text-gray-500 dark:text-gray-400 mt-2 overflow-hidden w-full">
          {typeof dropZoneDescription === "string"
            ? dropZoneDescription
            : isMulti
              ? t("You_can_upload_up_to") + ` ${numberOfFiles} ` + t("files_ar")
              : t("You can upload 1 file")}
        </p>
      </div>
    </div>
    </>
  );
};
