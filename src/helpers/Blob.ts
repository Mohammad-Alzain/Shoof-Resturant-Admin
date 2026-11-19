// utils/download.ts
export const downloadFile = (
  data: ArrayBuffer,
  filename: string,
  mimeType = "application/pdf"
) => {
  const blob = new Blob([data], { type: mimeType });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.URL.revokeObjectURL(url);
};
