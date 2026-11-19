import { useMemo, useState } from "react";
import NiceModal from "@ebay/nice-modal-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Download, Loader2, Pencil, Plus, Printer, QrCode, Table2, Trash2 } from "lucide-react";
import { z } from "zod";
import { FieldTypes } from "@/components/common/Fields/Enums/Field";
import { confirmAction } from "@/components/common/Modal/ConfirmDialog";
import FormModal from "@/components/common/Modal/FormModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { isSafeUrl } from "@/helpers/url";
import { fetchAll } from "@/modules/shared/core/lookups";
import { useCurrentRestaurant } from "@/modules/shared/core/restaurant";
import { EmptyState } from "@/modules/shared/ui/parts";
import { CardShell } from "@/components/common/ResourceCards";
import { generateQr, tablesApi, type IQr, type ITable } from "../../core/api";

const download = async (url: string, name: string) => {
  try {
    const blob = await (await fetch(url)).blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${name}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
};

/** A printable sheet of QR cards (table label + code): the browser's print dialog does the rest. */
const printSheet = (cards: { label: string; image: string }[], restaurant: string) => {
  const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!w) return;
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
  w.document.write(`<!doctype html><meta charset="utf-8"><title>${esc(restaurant)}</title><style>
    body{font-family:system-ui,sans-serif;margin:0;padding:24px}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:20px}
    .c{border:2px solid #261c1a;border-radius:16px;padding:18px;text-align:center;break-inside:avoid}.c img{width:100%;max-width:190px}
    .c b{display:block;font-size:22px;margin-top:8px}.c small{color:#6f5c55}</style><div class="g">${cards
      .filter((c) => /^https?:\/\//i.test(c.image) || c.image.startsWith("/"))
      .map((c) => `<div class="c"><img src="${esc(c.image)}" alt=""><b>${esc(c.label)}</b><small>${esc(restaurant)}</small></div>`)
      .join("")}</div><script>window.onload=()=>setTimeout(()=>window.print(),400)</scr"+"ipt>`);
  w.document.close();
};

/** Tables, each with its QR code; the general QR (no table) opens the whole menu. QR codes cannot be edited or deleted. */
export default function TablesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { restaurant } = useCurrentRestaurant();
  const rid = restaurant?.id ?? "";
  const tables = useQuery({ queryKey: ["tables", "all", rid], queryFn: () => fetchAll<ITable>("tables", rid ? { restaurantId: rid } : {}) });
  const qrs = useQuery({ queryKey: ["qr-codes", "all", rid], queryFn: () => fetchAll<IQr>("qr-codes", rid ? { restaurantId: rid } : {}) });
  const [busy, setBusy] = useState<string>("");
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["tables"] });
    qc.invalidateQueries({ queryKey: ["qr-codes"] });
  };
  const qrOf = useMemo(() => new Map((qrs.data ?? []).filter((q) => q.tableId).map((q) => [q.tableId as string, q])), [qrs.data]);
  const general = (qrs.data ?? []).find((q) => !q.tableId);

  const make = useMutation({
    mutationFn: (tableId: string | null) => {
      setBusy(tableId ?? "general");
      return generateQr(rid, tableId);
    },
    onSuccess: refresh,
    onSettled: () => setBusy(""),
  });

  const add = () =>
    NiceModal.show(FormModal, {
      title: t("add_table"),
      initialState: { label: "" },
      validationSchema: z.object({ label: z.string().trim().min(1, t("field_required")).max(50) }),
      fields: [{ name: "label", control: FieldTypes.text, label: t("table_label"), required: true }],
      query: () => tablesApi.useCreate(),
      valuesBody: (v: any) => ({ restaurantId: rid, label: v.label.trim() }),
      onDone: refresh,
    });
  const rename = (tb: ITable) =>
    NiceModal.show(FormModal, {
      title: t("edit"),
      initialState: { label: tb.label, isActive: tb.isActive },
      validationSchema: z.object({ label: z.string().trim().min(1, t("field_required")).max(50), isActive: z.boolean() }),
      fields: [
        { name: "label", control: FieldTypes.text, label: t("table_label"), required: true },
        { name: "isActive", control: FieldTypes.switch, label: t("active") },
      ],
      query: () => tablesApi.useUpdate(tb.id),
      valuesBody: (v: any) => ({ label: v.label.trim(), isActive: !!v.isActive }),
      onDone: refresh,
    });
  const remove = async (tb: ITable) => {
    if (!(await confirmAction({ title: t("delete_confirm_title"), subject: tb.label, description: t("delete_irreversible"), confirmText: t("delete"), danger: true }))) return;
    await tablesApi.remove(tb.id);
    refresh();
  };
  const toggle = (tb: ITable, on: boolean) => tablesApi.update({ id: tb.id, body: { label: tb.label, isActive: on } }).then(refresh);

  const allQr = [...(general?.imageUrl ? [{ label: t("general_qr"), image: general.imageUrl }] : []), ...(tables.data ?? []).flatMap((tb) => (qrOf.get(tb.id)?.imageUrl ? [{ label: tb.label, image: qrOf.get(tb.id)!.imageUrl as string }] : []))];

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">{t("tables_qr")}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{t("tables_desc")}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={allQr.length === 0} onClick={() => printSheet(allQr, restaurant?.name ?? "")}>
            <Printer />
            {t("print_all")}
          </Button>
          <Button type="button" variant="primary" disabled={!rid} onClick={add}>
            <Plus />
            {t("add_table")}
          </Button>
        </div>
      </header>

      <div className="flex flex-col items-start gap-5 rounded-2xl border border-border bg-card p-5 shadow-card sm:flex-row sm:items-center">
        {general?.imageUrl && isSafeUrl(general.imageUrl) ? <img src={general.imageUrl} alt="" className="size-28 rounded-xl border border-border bg-white p-1" /> : <span className="grid size-28 place-items-center rounded-xl border border-dashed border-border text-muted-foreground"><QrCode className="size-8" /></span>}
        <div className="min-w-0 flex-1 space-y-1.5 self-stretch">
          <h2 className="font-semibold text-foreground">{t("general_qr")}</h2>
          <p className="text-sm text-muted-foreground">{t("general_qr_desc")}</p>
          {general?.targetUrl && <p dir="ltr" className="truncate text-start font-mono text-xs text-muted-foreground">{general.targetUrl}</p>}
        </div>
        {general?.imageUrl ? (
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => download(general.imageUrl!, "menu-qr")}><Download />{t("download")}</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => printSheet([{ label: t("general_qr"), image: general.imageUrl! }], restaurant?.name ?? "")}><Printer />{t("print")}</Button>
          </div>
        ) : (
          <Button type="button" variant="primary" disabled={make.isPending || !rid} onClick={() => make.mutate(null)}>
            {busy === "general" ? <Loader2 className="animate-spin" /> : <QrCode />}
            {t("generate_qr")}
          </Button>
        )}
      </div>

      {tables.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-60 rounded-2xl" />)}</div>
      ) : (tables.data ?? []).length === 0 ? (
        <EmptyState icon={Table2} title={t("no_tables")} hint={t("no_tables_hint")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {(tables.data ?? []).map((tb, i) => {
            const qr = qrOf.get(tb.id);
            return (
              <CardShell key={tb.id} index={i} active={tb.isActive}
                actions={<><Button type="button" variant="ghost" size="icon" aria-label={t("edit")} onClick={() => rename(tb)}><Pencil className="size-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label={t("delete")} onClick={() => remove(tb)} className="hover:text-destructive"><Trash2 className="size-4" /></Button></>}>
                <div className="flex flex-1 flex-col items-center gap-3 p-5">
                  {qr?.imageUrl && isSafeUrl(qr.imageUrl) ? <img src={qr.imageUrl} alt={tb.label} className="size-36 rounded-xl border border-border bg-white p-1.5" /> : <span className="grid size-36 place-items-center rounded-xl border border-dashed border-border text-muted-foreground"><QrCode className="size-9" /></span>}
                  <p className="font-display text-lg font-semibold text-foreground">{tb.label}</p>
                  {qr ? <Badge variant="success" appearance="light" size="sm">{t("has_qr")}</Badge> : <Badge variant="warning" appearance="light" size="sm">{t("no_qr")}</Badge>}
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/30 px-4 py-2.5">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground"><Switch checked={tb.isActive} onCheckedChange={(on) => toggle(tb, on)} aria-label={t("active")} />{t("active")}</label>
                  {qr?.imageUrl ? (
                    <span className="flex gap-1">
                      <Button type="button" variant="ghost" size="icon" aria-label={t("download")} onClick={() => download(qr.imageUrl!, tb.label)}><Download className="size-4" /></Button>
                      <Button type="button" variant="ghost" size="icon" aria-label={t("print")} onClick={() => printSheet([{ label: tb.label, image: qr.imageUrl! }], restaurant?.name ?? "")}><Printer className="size-4" /></Button>
                    </span>
                  ) : (
                    <Button type="button" variant="outline" size="sm" disabled={make.isPending} onClick={() => make.mutate(tb.id)}>
                      {busy === tb.id ? <Loader2 className="animate-spin" /> : <QrCode />}
                      {t("generate_qr")}
                    </Button>
                  )}
                </div>
              </CardShell>
            );
          })}
        </div>
      )}
      <p className="text-xs text-muted-foreground">{t("qr_note")}</p>
    </section>
  );
}
