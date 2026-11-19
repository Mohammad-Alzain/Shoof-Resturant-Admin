import { httpClient } from "@/Api/httpClient";

export type ExportFormat = "xlsx" | "csv" | "pdf";

export const EXPORT_FORMATS: ExportFormat[] = ["xlsx", "csv", "pdf"];

/**
 * Error responses of a `responseType: "blob"` request arrive as a Blob even
 * when the server answered with JSON (e.g. the 422 of the PDF row limit), so
 * the message has to be read back out of it.
 */
export const readBlobErrorMessage = async (
  error: any,
): Promise<string | undefined> => {
  const data = error?.response?.data;
  if (!(data instanceof Blob)) {
    return data?.message || data?.msg;
  }
  try {
    const json = JSON.parse(await data.text());
    const firstError = json?.errors && Object.values(json.errors)[0];
    return (
      json?.message ||
      json?.msg ||
      (Array.isArray(firstError) ? (firstError[0] as string) : undefined)
    );
  } catch {
    return undefined;
  }
};

/**
 * Downloads `url` (a dashboard `.../export` endpoint) in the requested format
 * using the given list filters.
 */
export const downloadExport = async (
  url: string,
  format: ExportFormat,
  baseName: string,
  params: Record<string, any> = {},
) => {
  const blob: Blob = await httpClient.get(url, {
    params: { ...params, format },
    responseType: "blob",
  });
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `${baseName}.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
};
