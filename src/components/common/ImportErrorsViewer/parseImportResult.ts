export interface ParsedRowFieldError {
  field?: string;
  fieldLabel?: string;
  messages: string[];
}

export interface ParsedRowError {
  line?: number | string;
  fieldErrors: ParsedRowFieldError[];
  generalMessages: string[];
}

export interface ParsedImportResult {
  hasErrors: boolean;
  imported?: number;
  failed?: number;
  skipped?: number;
  message?: string;
  rowErrors: ParsedRowError[];
  generalErrors: string[];
}

export const KNOWN_FIELD_LABELS: Record<string, { ar: string; en: string }> = {
  correct_option: { ar: "رقم الإجابة الصحيحة", en: "Correct Option Number" },
  correct_answer: { ar: "الإجابة الصحيحة", en: "Correct Answer" },
  question_text: { ar: "نص السؤال", en: "Question Text" },
  question: { ar: "السؤال", en: "Question" },
  options: { ar: "خيارات الإجابة", en: "Options" },
  option_1: { ar: "الخيار الأول", en: "Option 1" },
  option_2: { ar: "الخيار الثاني", en: "Option 2" },
  option_3: { ar: "الخيار الثالث", en: "Option 3" },
  option_4: { ar: "الخيار الرابع", en: "Option 4" },
  option_5: { ar: "الخيار الخامس", en: "Option 5" },
  explanation: { ar: "الشرح / التفسير", en: "Explanation" },
  subject_id: { ar: "المادة", en: "Subject" },
  lecture_id: { ar: "المحاضرة", en: "Lecture" },
  course_id: { ar: "الدورة", en: "Course" },
  subject_component_id: { ar: "قسم المادة", en: "Subject Component" },
  file: { ar: "ملف الإكسل", en: "Excel File" },
  exam_id: { ar: "الاختبار", en: "Exam" },
  name: { ar: "الاسم", en: "Name" },
  start_academic_year: { ar: "بداية السنة الدراسية", en: "Start Year" },
  end_academic_year: { ar: "نهاية السنة الدراسية", en: "End Year" },
};

export const getFieldFriendlyLabel = (
  field: string,
  lng: string = "ar"
): string => {
  const normalizedKey = field.toLowerCase().trim();
  const known = KNOWN_FIELD_LABELS[normalizedKey];
  if (known) {
    return lng.startsWith("ar") ? known.ar : known.en;
  }
  // Convert snake_case or camelCase to words
  return normalizedKey
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export function parseImportResponse(
  rawResponse: any,
  lng: string = "ar"
): ParsedImportResult {
  if (!rawResponse) {
    return {
      hasErrors: false,
      rowErrors: [],
      generalErrors: [],
    };
  }

  const rawData = rawResponse?.data || rawResponse;
  const message = rawResponse?.message || rawData?.message;

  const imported =
    typeof rawData?.imported === "number"
      ? rawData.imported
      : typeof rawResponse?.imported === "number"
      ? rawResponse.imported
      : undefined;

  const failed =
    typeof rawData?.failed === "number"
      ? rawData.failed
      : typeof rawResponse?.failed === "number"
      ? rawResponse.failed
      : undefined;

  const skipped =
    typeof rawData?.skipped === "number"
      ? rawData.skipped
      : typeof rawResponse?.skipped === "number"
      ? rawResponse.skipped
      : undefined;

  const rowErrors: ParsedRowError[] = [];
  const generalErrors: string[] = [];

  // Look for errors array in various standard backend response structures
  const rawErrorsList =
    (Array.isArray(rawData?.errors) && rawData.errors) ||
    (Array.isArray(rawResponse?.errors) && rawResponse.errors) ||
    (Array.isArray(rawData) && rawData) ||
    [];

  if (Array.isArray(rawErrorsList) && rawErrorsList.length > 0) {
    for (const item of rawErrorsList) {
      if (!item) continue;

      if (typeof item === "string") {
        generalErrors.push(item);
        continue;
      }

      if (typeof item === "object") {
        const line =
          item.line ?? item.row ?? item.row_number ?? item.index ?? undefined;
        const fieldErrors: ParsedRowFieldError[] = [];
        const generalMessages: string[] = [];

        // 1. Process item.messages (object or array)
        if (item.messages && typeof item.messages === "object") {
          if (Array.isArray(item.messages)) {
            generalMessages.push(...item.messages.map(String));
          } else {
            for (const [fieldKey, msgs] of Object.entries(item.messages)) {
              const msgsList = Array.isArray(msgs)
                ? msgs.map(String)
                : [String(msgs)];
              fieldErrors.push({
                field: fieldKey,
                fieldLabel: getFieldFriendlyLabel(fieldKey, lng),
                messages: msgsList,
              });
            }
          }
        }

        // 2. Process item.errors (object or array)
        if (item.errors && typeof item.errors === "object") {
          if (Array.isArray(item.errors)) {
            generalMessages.push(...item.errors.map(String));
          } else {
            for (const [fieldKey, msgs] of Object.entries(item.errors)) {
              const msgsList = Array.isArray(msgs)
                ? msgs.map(String)
                : [String(msgs)];
              fieldErrors.push({
                field: fieldKey,
                fieldLabel: getFieldFriendlyLabel(fieldKey, lng),
                messages: msgsList,
              });
            }
          }
        }

        // 3. Process direct item.message or item.error
        if (item.message && typeof item.message === "string") {
          generalMessages.push(item.message);
        }
        if (item.error && typeof item.error === "string") {
          generalMessages.push(item.error);
        }

        if (fieldErrors.length > 0 || generalMessages.length > 0) {
          rowErrors.push({
            line,
            fieldErrors,
            generalMessages,
          });
        }
      }
    }
  }

  // Check top-level validation errors (e.g. 422 fields_errors or data object with field arrays)
  if (
    rowErrors.length === 0 &&
    rawData &&
    typeof rawData === "object" &&
    !Array.isArray(rawData) &&
    imported === undefined &&
    failed === undefined
  ) {
    for (const [fieldKey, val] of Object.entries(rawData)) {
      if (
        ["errors", "message", "status", "code", "meta", "success"].includes(
          fieldKey
        )
      ) {
        continue;
      }
      const label = getFieldFriendlyLabel(fieldKey, lng);
      if (Array.isArray(val)) {
        val.forEach((msg) => generalErrors.push(`${label}: ${msg}`));
      } else if (typeof val === "string") {
        generalErrors.push(`${label}: ${val}`);
      }
    }
  }

  // Check fields_errors if present
  if (
    rawResponse?.fields_errors &&
    typeof rawResponse.fields_errors === "object"
  ) {
    for (const [fieldKey, val] of Object.entries(rawResponse.fields_errors)) {
      const label = getFieldFriendlyLabel(fieldKey, lng);
      if (Array.isArray(val)) {
        val.forEach((msg) => generalErrors.push(`${label}: ${msg}`));
      } else if (typeof val === "string") {
        generalErrors.push(`${label}: ${val}`);
      }
    }
  }

  const hasErrors =
    Boolean(failed && failed > 0) ||
    rowErrors.length > 0 ||
    generalErrors.length > 0 ||
    rawResponse?.status === false;

  return {
    hasErrors,
    imported,
    failed: failed ?? (rowErrors.length > 0 ? rowErrors.length : undefined),
    skipped,
    message,
    rowErrors,
    generalErrors,
  };
}
