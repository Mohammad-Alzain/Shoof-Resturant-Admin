import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import RecordView from "@/components/common/RecordView";
import { http } from "@/Api/httpClient";
import { getDirection } from "@/Translation/i18n";

/** Kept for the pages that import it: the generic renderer now lives in `RecordView`. */
export const JsonView = ({ value }: { value: unknown }) => <RecordView value={value} />;

interface Props {
  title: string;
  /** GET path of the record, relative to the API base (e.g. `tenants/5`). Ignored when `data` is given. */
  path?: string;
  data?: unknown;
  /** A short notice under the title (e.g. "Your access is logged"). */
  notice?: string;
  /** Width class of the panel (default `sm:max-w-2xl`). */
  width?: string;
  /** A hook returning a function that adds names to the record (e.g. plan / tenant names for ids). */
  useEnrich?: () => (data: any) => any;
}

/** Read-only detail panel: a side sheet that renders whatever the API returns. */
const DetailModal = NiceModal.create(({ title, path, data, notice, width, useEnrich }: Props) => {
  const enrich = useEnrich?.();
  const modal = useModal();
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: ["detail", path],
    queryFn: () => http.get<unknown>(path as string),
    enabled: !!path && data === undefined,
  });
  const raw = data ?? query.data;
  const value = enrich && raw && typeof raw === "object" ? enrich(raw) : raw;

  return (
    <Sheet open={modal.visible} onOpenChange={(o) => !o && modal.hide()}>
      <SheetContent dir={getDirection()} side="right" className={`w-full gap-0 p-0 sm:max-w-2xl ${width ?? ""}`}>
        <SheetHeader className="border-b border-border px-6 py-4 pe-14 text-start">
          <SheetTitle className="flex items-center gap-2.5 text-base">
            <span aria-hidden className="h-5 w-1 rounded-full bg-terracotta" />
            {title}
          </SheetTitle>
          <SheetDescription className="sr-only">{t("details")}</SheetDescription>
        </SheetHeader>
        <div className="sheet-form min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {notice && (
            <p role="note" className="rounded-lg border border-terracotta/30 bg-terracotta/10 px-3 py-2 text-xs text-foreground">{notice}</p>
          )}
          {query.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-1/2" />
              <div className="grid gap-2.5 sm:grid-cols-2">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            </div>
          ) : query.isError ? (
            <p className="text-sm text-destructive">{t("unexpected_error")}</p>
          ) : (
            <RecordView value={value} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
});

export default DetailModal;
