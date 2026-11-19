export function extractFormDataValues(
  formData: FormData
): Record<string, string | Blob> {
  const values: Record<string, string | Blob> = {};

  for (const [key, value] of formData.entries()) {
    values[key] = value;
  }

  return values;
}
