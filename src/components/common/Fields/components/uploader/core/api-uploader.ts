import { httpClient } from "@/Api/httpClient";
import type { IUploader } from "./interfaces";

/** Default upload endpoint (relative to VITE_BASE_URL). Override per field with `uploaderSettings.uploadUrl`. */
export const DEFAULT_UPLOAD_URL = import.meta.env.VITE_UPLOAD_URL || "media";

export interface UploadFileParams {
  file: File;
  id: string;
  /** Endpoint to post to. Defaults to DEFAULT_UPLOAD_URL. */
  url?: string;
  /** Multipart field name expected by the API. Defaults to "file". */
  fieldName?: string;
  onProgress?: (percent: number, id: string) => void;
  signal?: AbortSignal;
}

/**
 * Plain `multipart/form-data` upload. The response interceptor already unwraps `response.data`,
 * so the result is the body returned by the API (an object or a one-item list).
 */
export const uploadFile = async ({
  file,
  id,
  url = DEFAULT_UPLOAD_URL,
  fieldName = "file",
  onProgress,
  signal,
}: UploadFileParams): Promise<IUploader> => {
  const body = new FormData();
  body.append(fieldName, file);

  const res: unknown = await httpClient.post(url, body, {
    signal,
    onUploadProgress: (event) => {
      if (!onProgress || !event.total) return;
      onProgress(Math.round((event.loaded * 100) / event.total), id);
    },
  });

  const payload = (res as { data?: unknown })?.data ?? res;
  return (Array.isArray(payload) ? payload[0] : payload) as IUploader;
};
