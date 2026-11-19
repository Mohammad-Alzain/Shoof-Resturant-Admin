import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Ban, ExternalLink, Zap } from "lucide-react";
import { FieldTypes } from "@/components/common/Fields/Enums/Field";
import { ResourcePage, RowAction } from "@/components/common/ResourcePage";
import { Badge } from "@/components/ui/badge";
import { createdFilters } from "@/modules/shared/core/filters";
import { relativeTime, shortDate } from "@/modules/shared/core/format";
import { itemPicker } from "@/modules/shared/core/pickers";
import { JobBadge, KindLabel, QuotaStrip } from "@/modules/shared/ui/parts";
import { JobStatus, jobsApi, useCancelJob, type IJob } from "../../core/api";

/** Every 3D / AI photo job: queued, running, finished, with the place in the queue and the reason a job failed. */
export default function JobsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const cancel = useCancelJob();
  const batch = new URLSearchParams(window.location.search).get("batchId") ?? undefined;

  return (
    <ResourcePage<IJob>
      title="generation_jobs"
      api={jobsApi}
      defaultParams={batch ? { batchId: batch } : undefined}
      canCreate={false}
      canEdit={() => false}
      canDelete={() => false}
      belowTitle={<QuotaStrip />}
      columns={[
        {
          header: "item",
          access: "menuItemName",
          Cell: (_c, _v, j: IJob) => (
            <span className="flex min-w-0 items-center gap-3">
              {j.resultThumbnailUrl ? <img src={j.resultThumbnailUrl} alt="" className="size-10 shrink-0 rounded-lg border border-border object-cover" /> : <span className="size-10 shrink-0 rounded-lg border border-dashed border-border" />}
              <span className="min-w-0">
                <span className="block truncate font-medium text-foreground">{j.menuItemName ?? "—"}</span>
                <KindLabel kind={j.kind} />
              </span>
            </span>
          ),
        },
        {
          header: "status",
          access: "status",
          Cell: (_c, _v, j: IJob) => (
            <span className="flex flex-col items-start gap-1">
              <JobBadge job={j} />
              {j.isLibraryMatch && (
                <Badge variant="info" appearance="light" size="sm" className="gap-1">
                  <Zap className="size-3" />
                  {t("library_reused")}
                </Badge>
              )}
            </span>
          ),
        },
        {
          header: "time",
          access: "creationDateTime",
          Cell: (_c, _v, j: IJob) => (
            <span className="flex flex-col whitespace-nowrap text-xs">
              <span className="text-sm">{shortDate(j.submittedAt ?? j.creationDateTime, i18n.language)}</span>
              <span className="text-muted-foreground">{j.finishedAt ? `${t("finished")} ${relativeTime(j.finishedAt, i18n.language)}` : relativeTime(j.submittedAt ?? j.creationDateTime, i18n.language)}</span>
            </span>
          ),
        },
        {
          header: "error",
          access: "errorMessage",
          Cell: (_c, _v, j: IJob) =>
            j.errorMessage ? (
              <span className="block max-w-[18rem] truncate text-xs text-destructive" title={j.errorMessage}>
                {j.errorMessage}
                {j.retryCount > 0 && <span className="ms-1 text-muted-foreground">({j.retryCount}×)</span>}
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            ),
        },
      ]}
      filters={[
        { ...itemPicker({ name: "menuItemId", label: t("item") }) },
        {
          name: "status",
          control: FieldTypes.select,
          label: t("status"),
          options: [
            { value: 0, label: t("job_queued") },
            { value: 1, label: t("job_generating") },
            { value: 2, label: t("val_ready") },
            { value: 3, label: t("val_failed") },
            { value: 4, label: t("val_cancelled") },
          ],
        },
        { name: "kind", control: FieldTypes.select, label: t("job_kind"), options: [{ value: 0, label: t("job_kind_model") }, { value: 1, label: t("job_kind_image") }] },
        { name: "batchId", control: FieldTypes.text, label: t("batch") },
        { name: "fromDate", control: FieldTypes.date, label: t("from_date") },
        { name: "toDate", control: FieldTypes.date, label: t("to_date") },
        ...createdFilters(t).slice(0, 0),
      ]}
      schema={() => undefined}
      initialState={() => ({})}
      fields={() => []}
      onView={(j) => navigate({ to: `/dashboard/menu/items/${j.menuItemId}` as never })}
      rowActions={(j) =>
        j.status === JobStatus.Pending ? (
          <RowAction label={t("cancel_job")} tone="danger" onClick={() => cancel.mutate(j.id)}>
            <Ban className="size-[17px]" />
          </RowAction>
        ) : (
          <RowAction label={t("open_item")} onClick={() => navigate({ to: `/dashboard/menu/items/${j.menuItemId}` as never })}>
            <ExternalLink className="size-[17px]" />
          </RowAction>
        )
      }
    />
  );
}
