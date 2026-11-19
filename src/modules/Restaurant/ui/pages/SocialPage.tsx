import NiceModal from "@ebay/nice-modal-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ExternalLink, Pencil, Plus, Share2, Trash2 } from "lucide-react";
import { z } from "zod";
import { FieldTypes } from "@/components/common/Fields/Enums/Field";
import { confirmAction } from "@/components/common/Modal/ConfirmDialog";
import FormModal from "@/components/common/Modal/FormModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { isSafeUrl } from "@/helpers/url";
import { fetchAll } from "@/modules/shared/core/lookups";
import { useRestaurantId } from "@/modules/shared/core/restaurant";
import { EmptyState } from "@/modules/shared/ui/parts";
import { PLATFORMS, socialApi, type ISocialLink } from "../../core/api";

const TONE: Record<string, string> = {
  Facebook: "#1877F2", Instagram: "#C13584", Twitter: "#111111", TikTok: "#111111", WhatsApp: "#25D366", YouTube: "#FF0000", Snapchat: "#E6B800",
};

/** One link per platform per restaurant: only the platforms not used yet can be added, and a platform cannot be changed (delete and re-add). */
export default function SocialPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const restaurantId = useRestaurantId();
  const q = useQuery({ queryKey: ["restaurant-social-links", restaurantId], queryFn: () => fetchAll<ISocialLink>("restaurant-social-links", restaurantId ? { restaurantId } : {}) });
  const refresh = () => qc.invalidateQueries({ queryKey: ["restaurant-social-links"] });
  const used = new Set((q.data ?? []).map((l) => l.platform));
  const free = PLATFORMS.map((p, i) => ({ value: i, label: p })).filter((o) => !used.has(o.value));
  const urlRule = z.string().trim().url(t("invalid_url")).max(500).refine((v) => /^https?:\/\//i.test(v), t("invalid_url"));

  const add = () =>
    NiceModal.show(FormModal, {
      title: t("add_social"),
      initialState: { platform: free[0]?.value ?? 0, url: "" },
      validationSchema: z.object({ platform: z.coerce.number(), url: urlRule }),
      fields: [
        { name: "platform", control: FieldTypes.select, label: t("platform"), required: true, options: free },
        { name: "url", control: FieldTypes.text, label: t("url"), required: true, placeholder: "https://" },
      ],
      query: () => socialApi.useCreate(),
      valuesBody: (v: any) => ({ restaurantId, platform: Number(v.platform), url: v.url.trim() }),
      onDone: refresh,
    });
  const edit = (l: ISocialLink) =>
    NiceModal.show(FormModal, {
      title: PLATFORMS[l.platform],
      initialState: { url: l.url },
      validationSchema: z.object({ url: urlRule }),
      fields: [{ name: "url", control: FieldTypes.text, label: t("url"), required: true }],
      query: () => socialApi.useUpdate(l.id),
      valuesBody: (v: any) => ({ url: v.url.trim() }),
      onDone: refresh,
    });
  const remove = async (l: ISocialLink) => {
    if (!(await confirmAction({ title: t("delete_confirm_title"), subject: PLATFORMS[l.platform], description: t("delete_irreversible"), confirmText: t("delete"), danger: true }))) return;
    await socialApi.remove(l.id);
    refresh();
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">{t("social_links")}</h1>
          <p className="text-sm text-muted-foreground">{t("social_desc")}</p>
        </div>
        <Button type="button" variant="primary" disabled={free.length === 0 || !restaurantId} onClick={add}>
          <Plus />
          {t("add_social")}
        </Button>
      </header>
      {q.isLoading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : (q.data ?? []).length === 0 ? (
        <EmptyState icon={Share2} title={t("no_social")} hint={t("no_social_hint")} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(q.data ?? []).map((l) => {
            const name = PLATFORMS[l.platform] ?? "—";
            return (
              <li key={l.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
                <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-xl text-sm font-bold text-white" style={{ background: TONE[name] ?? "#555" }}>{name.charAt(0)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-foreground">{name}</span>
                  {isSafeUrl(l.url) ? (
                    <a href={l.url} target="_blank" rel="noreferrer noopener" dir="ltr" className="flex items-center gap-1 truncate text-start text-xs text-primary hover:underline"><span className="truncate">{l.url}</span><ExternalLink className="size-3 shrink-0" /></a>
                  ) : (
                    <span dir="ltr" className="block truncate text-start text-xs text-muted-foreground">{l.url}</span>
                  )}
                </span>
                <Button type="button" variant="ghost" size="icon" aria-label={t("edit")} onClick={() => edit(l)}><Pencil className="size-4" /></Button>
                <Button type="button" variant="ghost" size="icon" aria-label={t("delete")} onClick={() => remove(l)} className="hover:text-destructive"><Trash2 className="size-4" /></Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
