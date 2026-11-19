import { useMutation } from "@tanstack/react-query";
import { uploadFile } from "./api-uploader";

export const useUploadFile = () =>
  useMutation({
    mutationKey: ["uploader"],
    mutationFn: uploadFile,
  });
