"use client";
import React from "react";
import { DocumentText } from "iconsax-react";
import { AvatarWithBlank } from "@/components/common/ui/Avatar";

interface FilePreviewProps {
  file: {
    name: string;
    preview: string;
    fileData?: {
      mime_type?: string;
      extension?: string;
    };
  };
}

const isImage = (file: any): boolean => {
  if (!file) return false;
  const mime = file.fileData?.mime_type || "";
  if (mime.startsWith("image/")) return true;

  const ext = file.fileData?.extension || "";
  if (
    ext &&
    ["jpg", "jpeg", "png", "gif", "bmp", "webp", "tiff", "svg"].includes(
      ext.toLowerCase().replace(".", "")
    )
  )
    return true;

  const imageExtensions = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "bmp",
    "webp",
    "tiff",
    "svg",
  ];
  const lowName = (file.name || "").toLowerCase();
  const lowPreview = (file.preview || "").toLowerCase();

  return (
    imageExtensions.some((ext) => lowName.includes(ext)) ||
    imageExtensions.some((ext) => lowPreview.includes(ext)) ||
    lowPreview.startsWith("data:image/")
  );
};

const isVideo = (file: any): boolean => {
  if (!file) return false;
  const mime = file.fileData?.mime_type || "";
  if (mime.startsWith("video/")) return true;

  const ext = file.fileData?.extension || "";
  if (
    ext &&
    ["mp4", "webm", "mov", "avi", "quicktime"].includes(
      ext.toLowerCase().replace(".", "")
    )
  )
    return true;

  const videoExtensions = ["mp4", "webm", "mov", "avi", "quicktime"];
  const lowName = (file.name || "").toLowerCase();
  const lowPreview = (file.preview || "").toLowerCase();

  return (
    videoExtensions.some((ext) => lowName.includes(ext)) ||
    videoExtensions.some((ext) => lowPreview.includes(ext)) ||
    lowPreview.startsWith("data:video/")
  );
};

export const FilePreview: React.FC<FilePreviewProps> = ({ file }) => {
  if (isImage(file)) {
    return (
      <div className="flex-shrink-0">
        <AvatarWithBlank
          src={file.preview}
          alt={file.name}
          width={48}
        />
      </div>
    );
  }

  if (isVideo(file)) {
    return (
      <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden border border-gray-200 dark:border-gray-700 bg-black flex items-center justify-center">
        <video
          src={file.preview}
          className="w-full h-full object-cover"
          muted
          preload="metadata"
        />
      </div>
    );
  }

  return (
    <div className="flex-shrink-0">
      <DocumentText className="h-12 w-12 stroke-gray-400 size-3 " />
    </div>
  );
};
