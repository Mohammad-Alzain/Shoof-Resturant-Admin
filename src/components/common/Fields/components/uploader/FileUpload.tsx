"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone, type Accept, type FileRejection } from "react-dropzone";
import { InfoCircle } from "iconsax-react";
import clsx from "clsx";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import i18next from "@/Translation/i18n";
import { getPhotoUrl } from "@/helpers/photos";
import { FieldProps } from "../../interfaces/FieldProps";
import InputContainer from "../Common/InputContainer";
import InputLabel from "../Common/InputLabel";
import { useUploadFile } from "./core";
import type { IUploader } from "./core/interfaces";
import { UploadArea } from "./ui/UploadArea";
import { FileList } from "./ui/FileList";

interface FileWithPreview {
  id: string;
  name: string;
  preview: string;
  fileData?: IUploader;
}

const DEFAULT_MAX_SIZE_MB = 5;

const DEFAULT_ACCEPT: Accept = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

let fileCounter = 0;
const nextId = (name: string) => `${name}-${Date.now()}-${fileCounter++}`;

/** Turns whatever the form holds (path, id, url or object) into an item the list can render. */
const toListItem = (item: unknown, index: number): FileWithPreview => {
  if (item && typeof item === "object") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = item as Record<string, any>;
    const data: IUploader = obj.fileData ?? obj;
    return {
      id: `${data.id ?? index}-${index}`,
      name: obj.name || data.name || `File ${index + 1}`,
      preview: obj.preview || getPhotoUrl(data),
      fileData: data,
    };
  }
  if (typeof item === "string") {
    const preview = getPhotoUrl(item);
    return {
      id: `${item}-${index}`,
      name: item.split("/").pop() || `File ${index + 1}`,
      preview,
      fileData: { url: preview, path: item },
    };
  }
  return {
    id: `${item}-${index}`,
    name: `File ${index + 1}`,
    preview: "",
    fileData: { id: item as number },
  };
};

export const FileUploader: React.FC<FieldProps> = ({
  isMulti = false,
  style,
  label,
  labelClassName,
  toolTipText,
  toolTipVariant,
  required,
  numberOfFiles = 1,
  onChange,
  accept,
  className = "",
  setSubmitDisabled,
  name,
  value,
  register,
  uploaderSettings = { style: "files" },
  valueAccessor,
}) => {
  const t = i18next.t;
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const mutation = useUploadFile();
  const controllers = useRef<Record<string, AbortController>>({});
  const blobUrls = useRef<Set<string>>(new Set());
  const maxFiles = isMulti ? numberOfFiles : 1;
  const maxSize = (uploaderSettings.maxSizeMB ?? DEFAULT_MAX_SIZE_MB) * 1024 * 1024;

  // Keep the list in sync with the form value (edit forms, reset...).
  useEffect(() => {
    if (value === undefined || value === null || value === "") {
      setFiles((prev) => (prev.some((f) => controllers.current[f.id]) ? prev : []));
      return;
    }
    const items = Array.isArray(value) ? value : [value];
    setFiles((prev) =>
      items.map((item, i) => {
        const next = toListItem(item, i);
        // Keep the local preview of a file we just uploaded instead of flashing a remote URL.
        const same = prev.find((p) => p.fileData?.path && p.fileData.path === next.fileData?.path);
        return same ? { ...next, preview: same.preview || next.preview } : next;
      }),
    );
  }, [value]);

  // Abort in-flight uploads and free object URLs when the field goes away.
  useEffect(() => {
    const active = controllers.current;
    const urls = blobUrls.current;
    return () => {
      Object.values(active).forEach((c) => c.abort());
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const pickValue = useCallback(
    (data: IUploader) => (valueAccessor ? data[valueAccessor] : (data.path ?? data.url)),
    [valueAccessor],
  );

  const uploadOne = useCallback(
    async (item: FileWithPreview, file: File): Promise<IUploader> => {
      const controller = new AbortController();
      controllers.current[item.id] = controller;
      setUploadProgress((p) => ({ ...p, [item.id]: 0 }));
      try {
        return await mutation.mutateAsync({
          file,
          id: item.id,
          url: uploaderSettings.uploadUrl,
          fieldName: uploaderSettings.uploadFieldName,
          signal: controller.signal,
          onProgress: (percent, id) => setUploadProgress((p) => ({ ...p, [id]: percent })),
        });
      } finally {
        delete controllers.current[item.id];
        setUploadProgress((p) => {
          const rest = { ...p };
          delete rest[item.id];
          return rest;
        });
      }
    },
    [mutation, uploaderSettings.uploadUrl, uploaderSettings.uploadFieldName],
  );

  const onDrop = useCallback(
    async (dropped: File[]) => {
      if (!dropped.length) return;
      if (files.length + dropped.length > maxFiles) {
        toast.error(t("max_files_allowed", { count: maxFiles }));
        return;
      }

      const pending = dropped.map((file) => {
        const preview = URL.createObjectURL(file);
        blobUrls.current.add(preview);
        return { file, item: { id: nextId(file.name), name: file.name, preview } as FileWithPreview };
      });
      setFiles((prev) => [...prev, ...pending.map((p) => p.item)]);
      setSubmitDisabled?.(true);

      const results = await Promise.allSettled(pending.map((p) => uploadOne(p.item, p.file)));

      const uploaded: { item: FileWithPreview; data: IUploader }[] = [];
      const failed: FileWithPreview[] = [];
      results.forEach((r, i) => {
        if (r.status === "fulfilled") {
          uploaded.push({ item: pending[i].item, data: r.value });
        } else {
          failed.push(pending[i].item);
          // A file the user removed mid-upload is cancelled silently; real failures are reported.
          if ((r.reason as { code?: string })?.code !== "ERR_CANCELED") {
            toast.error(t("upload_failed", { name: pending[i].item.name }));
          }
        }
      });

      if (failed.length) {
        setFiles((prev) => prev.filter((f) => !failed.some((x) => x.id === f.id)));
      }

      if (uploaded.length) {
        toast.success(t("File uploaded successfully"));
        setFiles((prev) =>
          prev.map((f) => {
            const hit = uploaded.find((u) => u.item.id === f.id);
            return hit ? { ...f, fileData: hit.data } : f;
          }),
        );
        const values = uploaded.map((u) => pickValue(u.data));
        if (isMulti) {
          const current = Array.isArray(value) ? value : value ? [value] : [];
          onChange([...current, ...values]);
        } else {
          onChange(values[0]);
        }
      }
      setSubmitDisabled?.(false);
    },
    [files.length, maxFiles, isMulti, value, onChange, uploadOne, setSubmitDisabled, pickValue, t],
  );

  const onDropRejected = useCallback(
    (rejections: FileRejection[]) =>
      rejections.forEach(({ file, errors }) => {
        const tooLarge = errors.some((e) => e.code === "file-too-large");
        toast.error(
          tooLarge
            ? t("file_too_large", { name: file.name, size: maxSize / 1024 / 1024 })
            : t("file_type_not_accepted", { name: file.name }),
        );
      }),
    [t, maxSize],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: accept || DEFAULT_ACCEPT,
    maxSize,
    multiple: isMulti,
    maxFiles: isMulti ? numberOfFiles : 1,
  });

  const removeFile = useCallback(
    (index: number) => {
      const target = files[index];
      if (!target) return;
      controllers.current[target.id]?.abort();
      setFiles((prev) => prev.filter((_, i) => i !== index));
      if (isMulti) {
        onChange(Array.isArray(value) ? value.filter((_, i) => i !== index) : []);
      } else {
        onChange(null);
      }
    },
    [files, isMulti, onChange, value],
  );

  const clearAll = () => {
    Object.values(controllers.current).forEach((c) => c.abort());
    setFiles([]);
    onChange(isMulti ? [] : null);
  };

  return (
    <InputContainer style={style}>
      <InputLabel
        className={labelClassName}
        toolTipText={toolTipText}
        required={required}
        label={label}
        variant={toolTipVariant}
      />

      <div
        className={clsx(
          uploaderSettings.style === "gallery" ? "flex w-full flex-wrap items-center gap-2" : "space-y-4",
          className,
        )}
      >
        {files.length < maxFiles && (
          <UploadArea
            uploadAreaContainerClassName={uploaderSettings.uploadAreaContainerClassName}
            dropZoneDescription={uploaderSettings.dropZoneDescription}
            uploaderStyle={uploaderSettings.style}
            Icon={uploaderSettings.dropZoneIcon}
            dropText={uploaderSettings.dropZoneText}
            getRootProps={getRootProps}
            getInputProps={getInputProps}
            isDragActive={isDragActive}
            name={name}
            register={register}
            isMulti={isMulti}
            numberOfFiles={numberOfFiles}
          />
        )}

        <FileList
          files={files}
          uploadProgress={uploadProgress}
          removeFile={removeFile}
          numberOfFiles={numberOfFiles}
          UploaderSettings={uploaderSettings}
        />

        {uploaderSettings.style === "files" && files.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>{t("files_selected", { count: files.length })}</p>
            <Button type="button" variant="outline" size="sm" onClick={clearAll}>
              {t("Clear_all")}
            </Button>
          </div>
        )}

        {mutation.isError && !mutation.isPending && (
          <div role="alert" className="flex items-center gap-2 text-sm text-destructive">
            <InfoCircle className="size-4" />
            <span>{t("upload_failed_retry")}</span>
          </div>
        )}
      </div>
    </InputContainer>
  );
};
