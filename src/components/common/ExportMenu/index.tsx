import { useContext, useState } from "react";
import { Export } from "iconsax-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableFilterContext } from "@/components/common/DataTable/Context/TableFilterProvider";
import {
  downloadExport,
  EXPORT_FORMATS,
  ExportFormat,
  readBlobErrorMessage,
} from "@/helpers/exportFile";

interface ExportMenuProps {
  /** Dashboard export endpoint, e.g. `dashboard/coupons/export`. */
  url: string;
  /** File name without extension. */
  filename: string;
  /** Hide the button for users without the export permission. */
  allowed?: boolean;
  /** Formats offered in the menu (default: all). */
  formats?: ExportFormat[];
  /** Overrides the button styling so it can match its neighbours. */
  className?: string;
  /**
   * "Export selected": the ids of the rows the admin ticked. When given, only those rows are exported
   * (the list filters are not sent); when omitted, everything matching the list filters is exported.
   */
  selectedIds?: Array<number | string>;
  /** Called after a successful download, e.g. to clear the ticked rows. */
  onExported?: () => void;
}

const FORMAT_LABELS: Record<ExportFormat, [string, string]> = {
  xlsx: ["export_as_excel", "Excel (.xlsx)"],
  csv: ["export_as_csv", "CSV (.csv)"],
  pdf: ["export_as_pdf", "PDF (.pdf)"],
};

/**
 * Export dropdown (Excel / CSV / PDF) for DataTable pages (RBC-014 / RBC-016).
 * Must be rendered inside a DataTable (e.g. via `primaryTopActions`) so the
 * export applies the same filters as the list.
 */
const ExportMenu = ({
  url,
  filename,
  allowed = true,
  formats = EXPORT_FORMATS,
  className,
  selectedIds,
  onExported,
}: ExportMenuProps) => {
  const { t } = useTranslation();
  const { filters } = useContext(TableFilterContext);
  const [pending, setPending] = useState(false);
  const isSelection = selectedIds !== undefined;

  if (!allowed) return null;

  const handleExport = async (format: ExportFormat) => {
    let params: Record<string, any>;
    if (isSelection) {
      // Only the ticked rows; the server ignores filters in this case.
      params = { ids: selectedIds };
    } else {
      // The export returns everything that matches the filters, not one page.
      params = { ...(filters ?? {}) } as Record<string, any>;
      delete params.page;
      delete params.per_page;
    }
    setPending(true);
    try {
      await downloadExport(url, format, isSelection ? `${filename}-selected` : filename, params);
      toast.success(t("exported_successfully", "Exported successfully"));
      onExported?.();
    } catch (error: any) {
      const message = await readBlobErrorMessage(error);
      toast.error(message || t("failed_to_export", "Failed to export"));
    } finally {
      setPending(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || (isSelection && selectedIds.length === 0)}
          aria-label={isSelection ? t("export_selected", "Export selected") : t("export_all", "Export all")}
          className={
            className ??
            "gap-2 text-xs font-medium border-gray-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
          }
        >
          {pending ? (
            <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Export
              size={18}
              variant="Linear"
              color="currentColor"
              className="shrink-0"
            />
          )}
          <span>
            {isSelection
              ? `${t("export_selected", "Export selected")} (${selectedIds.length})`
              : t("export_all", "Export all")}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {formats.map((format) => (
          <DropdownMenuItem key={format} onSelect={() => handleExport(format)}>
            {t(FORMAT_LABELS[format][0], FORMAT_LABELS[format][1])}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportMenu;
