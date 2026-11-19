import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ParsedImportResult,
  ParsedRowError,
} from "./parseImportResult";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Danger, Copy, Warning2 } from "iconsax-react";
import { Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ImportErrorsViewerProps {
  result: ParsedImportResult;
  className?: string;
}

export const ImportErrorsViewer: React.FC<ImportErrorsViewerProps> = ({
  result,
  className = "",
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const isPartialSuccess = (result.imported ?? 0) > 0 && result.hasErrors;
  const isCompleteFailure = (result.imported ?? 0) === 0 && result.hasErrors;

  const handleCopyReport = async () => {
    let reportText = `=== ${t("import_errors_report", "Import Errors Report")} ===\n`;

    if (result.imported !== undefined || result.failed !== undefined) {
      reportText += `${t("imported_count", "Imported")}: ${result.imported ?? 0} | ${t(
        "failed_count",
        "Failed"
      )}: ${result.failed ?? 0}`;
      if (result.skipped !== undefined) {
        reportText += ` | ${t("skipped_count", "Skipped")}: ${result.skipped}`;
      }
      reportText += "\n\n";
    }

    if (result.rowErrors.length > 0) {
      reportText += `--- ${t("row_errors", "Row / Line Errors")} ---\n`;
      result.rowErrors.forEach((row) => {
        const lineLabel = row.line
          ? `${t("line", "Line")} #${row.line}`
          : t("unknown_line", "Unknown Line");
        reportText += `\n[${lineLabel}]:\n`;

        row.fieldErrors.forEach((fe) => {
          const fieldName = fe.fieldLabel || fe.field || t("field", "Field");
          fe.messages.forEach((msg) => {
            reportText += `  - ${fieldName}: ${msg}\n`;
          });
        });

        row.generalMessages.forEach((msg) => {
          reportText += `  - ${msg}\n`;
        });
      });
    }

    if (result.generalErrors.length > 0) {
      reportText += `\n--- ${t("general_errors", "General Errors")} ---\n`;
      result.generalErrors.forEach((err) => {
        reportText += `  - ${err}\n`;
      });
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(reportText);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = reportText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      setCopied(true);
      toast.success(
        t("errors_copied_to_clipboard", "Error report copied to clipboard")
      );
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("copy_failed", "Failed to copy to clipboard"));
    }
  };

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* 1. Status Banner */}
      {isPartialSuccess && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
          <Warning2
            size={20}
            variant="Bold"
            className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400"
          />
          <div className="space-y-0.5 flex-1">
            <p className="text-xs font-bold">
              {t("import_partial_success_title", "Import completed with errors")}
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              {t("import_partial_desc", {
                imported: result.imported,
                failed: result.failed,
                defaultValue: `Successfully imported ${result.imported} items, but ${result.failed} items failed to import.`,
              })}
            </p>
          </div>
        </div>
      )}

      {isCompleteFailure && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200">
          <Danger
            size={20}
            variant="Bold"
            className="shrink-0 mt-0.5 text-red-600 dark:text-red-400"
          />
          <div className="space-y-0.5 flex-1">
            <p className="text-xs font-bold">
              {t("import_failed_title", "Import failed with errors")}
            </p>
            <p className="text-xs text-red-800 dark:text-red-300">
              {result.message ||
                t(
                  "import_failure_desc",
                  "Errors were encountered in the file that prevented importing. Please review the errors below."
                )}
            </p>
          </div>
        </div>
      )}

      {/* 2. Stats Bar and Copy Button */}
      {result.hasErrors && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {result.imported !== undefined && (
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-semibold px-2.5 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 me-1.5 inline-block" />
                {t("imported_count", "Imported")}: {result.imported}
              </Badge>
            )}
            {result.failed !== undefined && (
              <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800 font-semibold px-2.5 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 me-1.5 inline-block" />
                {t("failed_count", "Failed")}: {result.failed}
              </Badge>
            )}
            {result.skipped !== undefined && result.skipped > 0 && (
              <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-300 font-semibold px-2.5 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 me-1.5 inline-block" />
                {t("skipped_count", "Skipped")}: {result.skipped}
              </Badge>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyReport}
            className="h-8 gap-1.5 text-xs font-medium border-gray-300 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-colors"
          >
            {copied ? (
              <Check size={14} className="text-emerald-700 dark:text-emerald-400" />
            ) : (
              <Copy size={14} className="text-gray-500 dark:text-gray-400" />
            )}
            <span>
              {copied
                ? t("copied", "Copied!")
                : t("copy_errors_report", "Copy Error Report")}
            </span>
          </Button>
        </div>
      )}

      {/* 3. Detailed Row / Question Errors List */}
      {result.rowErrors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300 px-1">
            <span className="flex items-center gap-1.5">
              <AlertCircle size={15} className="text-red-500" />
              {t("import_errors_list_title", "Questions with errors in Excel")}
            </span>
            <span className="text-[11px] font-normal text-muted-foreground">
              {result.rowErrors.length} {t("items_with_issues", "row(s)")}
            </span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {result.rowErrors.map((row: ParsedRowError, rIdx: number) => {
              const issuesCount =
                row.fieldErrors.reduce(
                  (acc, fe) => acc + fe.messages.length,
                  0
                ) + row.generalMessages.length;

              return (
                <div
                  key={`row-err-${rIdx}`}
                  className="p-3.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 text-xs space-y-2.5 transition-all hover:border-red-300"
                >
                  {/* Row Header */}
                  <div className="flex items-center justify-between border-b border-red-100 dark:border-red-900/40 pb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-600 text-white font-mono font-bold text-xs px-2 py-0.5 rounded-md">
                        {row.line !== undefined
                          ? `${t("line", "Line")} #${row.line}`
                          : `${t("question", "Question")} #${rIdx + 1}`}
                      </Badge>
                      <span className="text-gray-500 dark:text-gray-400 text-[11px]">
                        {issuesCount} {t("error_items", "issue(s)")}
                      </span>
                    </div>
                  </div>

                  {/* Field-specific errors */}
                  {row.fieldErrors.map((fe, fIdx) => (
                    <div key={`fe-${fIdx}`} className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-[11px]">
                          {fe.fieldLabel || fe.field}
                        </span>
                        {fe.field && fe.fieldLabel && fe.field !== fe.fieldLabel && (
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                            ({fe.field})
                          </span>
                        )}
                      </div>

                      <ul className="space-y-1 ps-2 mt-1">
                        {fe.messages.map((msg, mIdx) => (
                          <li
                            key={`msg-${mIdx}`}
                            className="flex items-start gap-1.5 text-red-700 dark:text-red-300 leading-relaxed"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                            <span>{msg}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {/* General messages on this row */}
                  {row.generalMessages.length > 0 && (
                    <ul className="space-y-1 ps-2">
                      {row.generalMessages.map((msg, gIdx) => (
                        <li
                          key={`gen-${gIdx}`}
                          className="flex items-start gap-1.5 text-red-700 dark:text-red-300 leading-relaxed"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                          <span>{msg}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Top-level / File General Errors */}
      {result.generalErrors.length > 0 && (
        <div className="p-3.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold text-red-800 dark:text-red-200">
            <Danger size={16} variant="Linear" className="text-red-600 shrink-0" />
            <span>{t("general_file_errors", "File / General Errors:")}</span>
          </div>
          <ul className="space-y-1 ps-3">
            {result.generalErrors.map((err, idx) => (
              <li
                key={`general-err-${idx}`}
                className="flex items-start gap-1.5 text-red-700 dark:text-red-300 leading-relaxed"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <span>{err}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ImportErrorsViewer;
