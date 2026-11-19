"use client";

import React from "react";
import clsx from "clsx";
import { isSafeUrl } from "@/helpers/url";
import { CloseCircle, DocumentText } from "iconsax-react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getDirection } from "@/Translation/i18n";
import { getPhotoUrl } from "@/helpers/photos";
import { IUploaderSettings } from "../../../interfaces/FieldProps";
import { FilePreview } from "./FilePreview";

type ListFile = {
  id: string;
  name: string;
  preview: string;
  fileData?: { mime_type?: string; extension?: string };
};

interface FileListProps {
  files: ListFile[];
  uploadProgress: Record<string, number>;
  removeFile: (index: number) => void;
  UploaderSettings?: IUploaderSettings;
  numberOfFiles: number;
}

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?|$)/i;
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|svg|avif)(\?|$)/i;

const kindOf = (file: ListFile): "image" | "video" | "document" => {
  const mime = file.fileData?.mime_type || "";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  const hint = `${file.name} ${file.preview}`;
  if (VIDEO_EXT.test(hint)) return "video";
  if (IMAGE_EXT.test(hint) || file.preview.startsWith("data:image/")) return "image";
  return "document";
};

const openFile = (file: ListFile) => {
  const url = file.preview || getPhotoUrl(file.fileData);
  if (isSafeUrl(url)) window.open(url, "_blank", "noopener,noreferrer");
};

const ProgressBar = ({ value, className }: { value?: number; className?: string }) => {
  if (value === undefined) return null;
  const rtl = getDirection() === "rtl";
  return (
    <Progress
      value={value}
      className={className}
      style={{ direction: rtl ? "rtl" : "ltr", transformOrigin: rtl ? "right center" : "left center" }}
    />
  );
};

export const FileList: React.FC<FileListProps> = ({
  files,
  uploadProgress,
  removeFile,
  UploaderSettings,
  numberOfFiles,
}) => {
  const isGallery = UploaderSettings?.style === "gallery";

  return (
    <div
      className={clsx(
        isGallery ? `flex flex-wrap items-center gap-2 ${numberOfFiles === 1 ? "w-full" : "w-fit"}` : "space-y-3",
      )}
    >
      {files.map((file, index) => {
        const progress = uploadProgress[file.id];

        if (!isGallery) {
          return (
            <div key={file.id} className="flex items-center gap-4 rounded-lg border border-border bg-muted/40 p-3">
              <FilePreview file={file} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                {progress !== undefined && (
                  <div className="mt-1 flex items-center gap-3">
                    <ProgressBar value={progress} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground">{progress}%</span>
                  </div>
                )}
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => openFile(file)} aria-label="open">
                <Eye className="size-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(index)} aria-label="remove">
                <CloseCircle className="size-4" />
              </Button>
            </div>
          );
        }

        const kind = kindOf(file);
        return (
          <div
            key={file.id}
            className={cn(
              "relative flex h-fit w-fit items-center rounded-lg border border-border",
              UploaderSettings?.uploadAreaContainerClassName,
            )}
          >
            {kind === "video" ? (
              <video src={file.preview} className="size-full rounded-lg bg-black object-cover" muted preload="metadata" />
            ) : kind === "image" ? (
              <img src={file.preview} alt={file.name} className="size-full rounded-lg object-cover" />
            ) : (
              <DocumentText className="size-10 text-muted-foreground" />
            )}

            {progress !== undefined && (
              <div className="absolute inset-x-0 -bottom-3 z-30">
                <ProgressBar value={progress} className="h-1.5" />
              </div>
            )}

            <div
              className={cn(
                "absolute -top-3 z-40 flex items-center gap-1 rounded-full border border-border bg-card p-0.5 shadow",
                getDirection() === "rtl" ? "-left-3" : "-right-3",
              )}
            >
              <Button type="button" variant="ghost" size="icon" onClick={() => openFile(file)} className="size-6 rounded-full p-0" aria-label="open">
                <Eye className="size-3.5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(index)} className="size-6 rounded-full p-0" aria-label="remove">
                <CloseCircle variant="Bold" className="size-5 text-destructive" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
