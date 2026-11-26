import { isSafeUrl } from "@/helpers/url";
import { can } from "@/modules/Auth/core/can";
import { Can } from "@/components/common/Can";
import { useEffect, useMemo, useRef, useState } from "react";
import NiceModal from "@ebay/nice-modal-react";
import { Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Box, EyeOff, Image as ImageIcon, Loader2, Plus, RefreshCw, Rotate3d, Smartphone, Sparkles, Trash2, Wheat, WandSparkles } from "lucide-react";
import { LangSwitch, type Lang } from "@/components/common/LangSwitch";
import { toast } from "sonner";
import { z } from "zod";
import FormBuilder from "@/components/common/FormBuilder";
import { FieldTypes } from "@/components/common/Fields/Enums/Field";
import { confirmAction } from "@/components/common/Modal/ConfirmDialog";
import FormModal from "@/components/common/Modal/FormModal";
import { ModelViewer } from "@/components/common/ModelViewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { getDirection } from "@/Translation/i18n";
import { cn } from "@/lib/utils";
import { strOrNull } from "@/helpers/body";
import { http } from "@/Api/httpClient";
import { fetchAll, formatPrice, getBilingual, useCurrencies } from "@/modules/shared/core/lookups";
import { EmptyState, FilePickButton, JobBadge, QuotaStrip } from "@/modules/shared/ui/parts";
import { JobKind, JobStatus, ModelSource, remainingCap, useGenerate, useQuota, type IJob } from "@/modules/Generation/core/api";
import { SOURCE_LABEL, SourceSelect } from "@/modules/Generation/ui/components/SourceSelect";
import { parseApiError } from "@/Api/httpClient";
import {
  deleteItemImage,
  generateItemImage,
  ImageSource,
  ingredientsApi,
  itemIngredientsApi,
  itemsApi,
  model3dApi,
  primaryImage,
  uploadItemImage,
  uploadModel,
  useItem,
  useItemIngredients,
  useItemModels,
  variantItemImage,
  type IIngredient,
  type IItem,
} from "../../core/api";

type Tab = "details" | "photos" | "ingredients" | "model";
const TABS: { id: Tab; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { id: "details", icon: Sparkles, label: "tab_details" },
  { id: "photos", icon: ImageIcon, label: "tab_photos" },
  { id: "ingredients", icon: Wheat, label: "tab_ingredients" },
  { id: "model", icon: Box, label: "tab_model" },
];

/** Jobs of one item, polled every 6 seconds while something is still queued or running. */
const useItemJobs = (itemId: string, kind: JobKind) => {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["model-generation-jobs", "item", itemId, kind],
    queryFn: async () => (await http.get<{ data: IJob[] }>("model-generation-jobs", { params: { menuItemId: itemId, kind, page: 1, pageSize: 10 } })).data ?? [],
    refetchInterval: (query) => ((query.state.data ?? []).some((j) => j.status <= JobStatus.Processing) ? 6000 : false),
  });
  const active = (q.data ?? []).filter((j) => j.status <= JobStatus.Processing);
  const wasActive = useMemo(() => active.length > 0, [active.length]);
  useEffect(() => {
    if (!wasActive) {
      qc.invalidateQueries({ queryKey: ["menu-items", "detail", itemId] });
      qc.invalidateQueries({ queryKey: ["menu-item-3d-models"] });
    }
  }, [wasActive, itemId, qc]);
  return { all: q.data ?? [], active };
};

export default function ItemEditorPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams({ strict: false }) as { id: string };
  const item = useItem(id);
  const currencies = useCurrencies();
  const [tab, setTab] = useState<Tab>("details");
  const it = item.data;
  const cur = currencies.data?.find((c) => c.id === it?.currencyId);

  return (
    <section className="space-y-5">
      <Link to={"/dashboard/menu/items" as never} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className={getDirection() === "rtl" ? "size-4 rotate-180" : "size-4"} />
        {t("items")}
      </Link>

      {/* the dish leads its own page: its photo as the backdrop, then name, category, price and its state for guests */}
      {item.isLoading ? (
        <Skeleton className="h-40 rounded-3xl" />
      ) : it ? (
        (() => {
          const photo = [...(it.images ?? [])].sort((x, y) => x.displayOrder - y.displayOrder)[0]?.url;
          const has3d = !!it.activeModel?.glbUrl;
          return (
            <header className="relative isolate overflow-hidden rounded-3xl border border-border bg-card shadow-card">
              {photo && isSafeUrl(photo) && (
                <>
                  <img src={photo} alt="" aria-hidden className="absolute inset-0 -z-10 size-full scale-110 object-cover opacity-30 blur-2xl" />
                  <span aria-hidden className="absolute inset-0 -z-10 bg-linear-to-l from-card via-card/85 to-card/40 rtl:bg-linear-to-r" />
                </>
              )}
              <div className="flex flex-wrap items-center gap-5 p-5 sm:p-6">
                {photo && isSafeUrl(photo) ? (
                  <img src={photo} alt="" className="size-24 shrink-0 rounded-2xl object-cover shadow-[0_14px_28px_-14px_rgb(38_28_26/0.6)] ring-4 ring-card sm:size-28" />
                ) : (
                  <span className="souk-bin-fill--bare grid size-24 shrink-0 place-items-center rounded-2xl text-muted-foreground sm:size-28"><ImageIcon className="size-7" /></span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">{it.menuCategoryName}</p>
                  <h1 className="mt-0.5 truncate font-display text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">{it.name}</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#fbf5e9] px-3 py-1 text-sm font-semibold tabular-nums text-[#261c1a] shadow-sm ring-1 ring-border"><bdi>{formatPrice(it.price, cur, i18n.language)}</bdi></span>
                    <Badge variant={it.isActive ? "success" : "secondary"} appearance="light" size="md">{it.isActive ? t("visible_to_guests") : t("hidden_from_guests")}</Badge>
                    <Badge variant={has3d ? "success" : "warning"} appearance="light" size="md" className="gap-1">
                      <Box className="size-3.5" />
                      {has3d ? t("val_ready") : t("no_model")}
                    </Badge>
                    <Badge variant="secondary" appearance="light" size="md" className="gap-1 tabular-nums">
                      <ImageIcon className="size-3.5" />
                      {(it.images?.length ?? 0).toLocaleString(i18n.language)} / 5
                    </Badge>
                  </div>
                </div>
                <Link to={"/dashboard/menu/preview" as never} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/80 px-3.5 py-2 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-accent">
                  <Smartphone className="size-4" />
                  {t("menu_preview")}
                </Link>
              </div>
            </header>
          );
        })()
      ) : null}

      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((x) => {
          const on = tab === x.id;
          return (
            <button key={x.id} type="button" role="tab" aria-selected={on} onClick={() => setTab(x.id)} className={cn("relative inline-flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors", on ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
              <x.icon className="size-4" />
              {t(x.label)}
              {on && <motion.span layoutId="item-tab" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>

      {it && tab === "details" && <DetailsTab item={it} />}
      {it && tab === "photos" && <PhotosTab item={it} />}
      {it && tab === "ingredients" && <IngredientsTab item={it} />}
      {it && tab === "model" && <ModelTab item={it} />}
    </section>
  );
}

/* ------------------------------ guest preview ------------------------------ */
type LiveItem = { nameEn?: string; nameAr?: string | null; descriptionEn?: string | null; descriptionAr?: string | null; price?: number | string; currencyId?: string; isActive?: boolean };

/**
 * The dish as a guest meets it on the menu, rebuilt as the form is typed: primary photo, the 3D badge when a model is
 * live, name and description in the language the guest picked, and the price in the item's currency. A hidden dish says
 * so. It is the product's promise ("your restaurant, as your guests see it") at the size of one card.
 */
function GuestPreview({ item, live }: { item: IItem; live: LiveItem }) {
  const { t, i18n } = useTranslation();
  const currencies = useCurrencies();
  const [lang, setLang] = useState<Lang>(i18n.language.startsWith("ar") ? "ar" : "en");
  const img = primaryImage(item);
  const name = (lang === "ar" ? live.nameAr || live.nameEn : live.nameEn) || "";
  const description = lang === "ar" ? live.descriptionAr || live.descriptionEn : live.descriptionEn;
  const currency = currencies.data?.find((c) => c.id === live.currencyId);
  const missingAr = lang === "ar" && !live.nameAr;
  return (
    <aside className="lg:sticky lg:top-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{t("guest_preview")}</h3>
        <LangSwitch value={lang} onChange={setLang} label={t("guest_preview")} />
      </div>
      <article dir={lang === "ar" ? "rtl" : "ltr"} className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="relative aspect-[4/3] bg-muted">
          {img && isSafeUrl(img.url) ? (
            <img src={img.url} alt="" className="size-full object-cover" />
          ) : (
            <span className="grid size-full place-items-center text-muted-foreground"><ImageIcon className="size-8" /></span>
          )}
          {item.activeModel?.glbUrl && (
            <span className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#FBF5E9]/90 px-2.5 py-1 text-xs font-semibold text-[#541F2D] shadow-sm backdrop-blur-sm">
              <Rotate3d className="size-3.5" aria-hidden />
              3D
            </span>
          )}
          {live.isActive === false && (
            <span className="absolute inset-0 grid place-items-center bg-[#261C1A]/55 text-sm font-medium text-[#FBF5E9]">
              <span className="inline-flex items-center gap-2"><EyeOff className="size-4" aria-hidden />{t("hidden_from_guests")}</span>
            </span>
          )}
        </div>
        <div className="space-y-1.5 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className={cn("min-w-0 font-display text-lg font-semibold leading-snug text-foreground", !name && "text-muted-foreground")}>{name || t("name")}</p>
            <p dir="ltr" className="shrink-0 font-display text-base font-semibold text-foreground">
              {live.price !== undefined && live.price !== "" ? formatPrice(Number(live.price), currency, lang) : "—"}
            </p>
          </div>
          {description ? <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
        </div>
      </article>
      {missingAr && <p className="mt-2 text-xs text-muted-foreground">{t("preview_ar_fallback")}</p>}
    </aside>
  );
}

/* ------------------------------ details ------------------------------ */
function DetailsTab({ item }: { item: IItem }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const currencies = useCurrencies();
  const bi = useQuery({ queryKey: ["menu-items", "bilingual", item.id, item.name], queryFn: () => getBilingual<IItem>("menu-items", item.id, ["name", "description"]) });
  const [live, setLive] = useState<LiveItem | null>(null);
  if (bi.isLoading || !currencies.data) return <Skeleton className="h-64 max-w-2xl rounded-2xl" />;
  const b = bi.data!;
  const initial = { nameEn: b.en.name, nameAr: b.ar.name, descriptionEn: b.en.description, descriptionAr: b.ar.description, price: item.price, currencyId: item.currencyId, displayOrder: item.displayOrder, isActive: item.isActive };
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <fieldset disabled={!can("MenuItems.Edit")} className="m-0 min-w-0 border-0 p-0">
      <FormBuilder
        query={() => itemsApi.useUpdate(item.id)}
        initialState={initial}
        onChange={(v: LiveItem) => setLive(v)}
        validationSchema={z.object({
          nameEn: z.string().min(1, t("field_required")).max(200),
          nameAr: z.string().max(200).optional().nullable(),
          descriptionEn: z.string().max(2000).optional().nullable(),
          descriptionAr: z.string().max(2000).optional().nullable(),
          price: z.coerce.number().min(0),
          currencyId: z.string().min(1, t("field_required")),
          displayOrder: z.coerce.number().int(),
          isActive: z.boolean(),
        })}
        valuesBody={(v: any) => ({ nameEn: v.nameEn, nameAr: strOrNull(v.nameAr), descriptionEn: strOrNull(v.descriptionEn), descriptionAr: strOrNull(v.descriptionAr), price: Number(v.price), currencyId: String(v.currencyId), displayOrder: Number(v.displayOrder) || 0, isActive: !!v.isActive })}
        refreshOnSubmit={false}
        buttonText={t("save")}
        onSuccessFunction={() => {
          toast.success(t("success_update"));
          qc.invalidateQueries({ queryKey: ["menu-items"] });
        }}
        fields={[
          { name: "nameEn", pairName: "nameAr", control: FieldTypes.bilingual, label: t("name"), required: true },
          { name: "descriptionEn", pairName: "descriptionAr", control: FieldTypes.bilingual, multiline: true, rows: 4, label: t("description") },
          { name: "price", control: FieldTypes.number, label: t("price"), required: true },
          { name: "currencyId", control: FieldTypes.select, label: t("currency"), required: true, options: currencies.data.map((c) => ({ value: c.id, label: `${c.isoCode} (${c.symbol})` })) },
          { name: "displayOrder", control: FieldTypes.number, label: t("display_order") },
          { name: "isActive", control: FieldTypes.switch, label: t("active"), helpertext: t("inactive_hidden_hint") },
        ]}
      />
      </fieldset>
    </div>
    <GuestPreview item={item} live={live ?? initial} />
    </div>
  );
}

/* ------------------------------ photos ------------------------------ */
const SRC_KEY: Record<number, string> = { [ImageSource.Upload]: "photo_uploaded", [ImageSource.Ai]: "photo_ai", [ImageSource.Variant]: "photo_variant" };

const useVariantMutation = (itemId: string, imageId: string) => useMutation({ mutationFn: (b: { instruction: string; caption: string }) => variantItemImage(itemId, imageId, b) });

function PhotosTab({ item }: { item: IItem }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const jobs = useItemJobs(item.id, JobKind.Image);
  const quota = useQuota();
  const imgs = [...(item.images ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);
  const used = imgs.length + jobs.active.length;
  const full = used >= 5;
  const noQuota = remainingCap(quota.data) === 0;
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["menu-items"] });
    qc.invalidateQueries({ queryKey: ["model-generation-jobs"] });
  };
  const upload = useMutation({ mutationFn: (f: File) => uploadItemImage(item.id, f), onSuccess: refresh });
  const gen = useMutation({ mutationFn: () => generateItemImage(item.id), onSuccess: refresh });

  const remove = async (imageId: string) => {
    if (!(await confirmAction({ title: t("delete_confirm_title"), description: t("delete_irreversible"), confirmText: t("delete"), danger: true }))) return;
    await deleteItemImage(item.id, imageId);
    refresh();
  };
  const variant = (imageId: string) =>
    NiceModal.show(FormModal, {
      title: t("create_variant"),
      initialState: { instruction: "", caption: "" },
      validationSchema: z.object({ instruction: z.string().trim().min(1, t("field_required")).max(300), caption: z.string().trim().min(1, t("field_required")).max(100) }),
      fields: [
        { name: "instruction", control: FieldTypes.text, label: t("variant_instruction"), helpertext: t("variant_instruction_hint"), required: true },
        { name: "caption", control: FieldTypes.text, label: t("variant_caption"), required: true },
      ],
      // FormModal calls `query` as a hook inside its own component
      // eslint-disable-next-line react-hooks/rules-of-hooks
      query: () => useVariantMutation(item.id, imageId),
      onDone: refresh,
    });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium tabular-nums">{used} / 5</span>
        <Can permission="MenuItems.Edit"><FilePickButton accept=".jpg,.jpeg,.png,.webp" label={t("upload_photo")} busy={upload.isPending} disabled={full} onPick={(f) => upload.mutate(f)} /></Can>
        <Can permission="ModelGenerationJobs.Add"><Button type="button" variant="primary" disabled={full || noQuota || gen.isPending} onClick={() => gen.mutate()}>
          {gen.isPending ? <Loader2 className="animate-spin" /> : <WandSparkles />}
          {t("generate_ai_photo")}
        </Button></Can>
        {full && <span className="text-xs text-muted-foreground">{t("photos_limit")}</span>}
        <QuotaStrip compact className="ms-auto" />
      </div>

      {imgs.length === 0 && jobs.active.length === 0 ? (
        <EmptyState icon={ImageIcon} title={t("no_photos")} hint={t("no_photos_hint")} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {imgs.map((im, i) => (
            <figure key={im.id} className="group/ph relative overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <img src={im.url} alt={im.caption ?? ""} loading="lazy" className="aspect-square w-full object-cover" />
              {i === 0 && <Badge variant="primary" size="sm" className="absolute start-2 top-2">{t("primary_photo")}</Badge>}
              <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-foreground">{im.caption || t(SRC_KEY[im.source] ?? "photo_uploaded")}</span>
                  <span className="text-muted-foreground">{t(SRC_KEY[im.source] ?? "photo_uploaded")}</span>
                </span>
              </figcaption>
              <div className="absolute end-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover/ph:opacity-100 pointer-coarse:opacity-100">
                <Can permission="ModelGenerationJobs.Add"><button type="button" aria-label={t("create_variant")} title={t("create_variant")} disabled={full || noQuota} onClick={() => variant(im.id)} className="grid size-8 place-items-center rounded-lg bg-card/95 text-foreground shadow-sm hover:bg-accent disabled:opacity-40">
                  <Sparkles className="size-4" />
                </button></Can>
                <Can permission="MenuItems.Edit"><button type="button" aria-label={t("delete")} onClick={() => remove(im.id)} className="grid size-8 place-items-center rounded-lg bg-card/95 text-destructive shadow-sm hover:bg-destructive/10">
                  <Trash2 className="size-4" />
                </button></Can>
              </div>
            </figure>
          ))}
          {jobs.active.map((j) => (
            <div key={j.id} className="grid aspect-square place-items-center rounded-2xl border border-dashed border-primary/40 bg-primary/5 text-center">
              <div className="space-y-2">
                <Loader2 className="mx-auto size-6 animate-spin text-primary" />
                <p className="text-xs font-medium text-foreground">{t("job_generating")}</p>
                <JobBadge job={j} />
              </div>
            </div>
          ))}
        </div>
      )}
      {jobs.all.filter((j) => j.status === JobStatus.Failed).slice(0, 2).map((j) => (
        <p key={j.id} role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{j.errorMessage}</p>
      ))}
    </div>
  );
}

/* ------------------------------ ingredients ------------------------------ */
function IngredientsTab({ item }: { item: IItem }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const attached = useItemIngredients(item.id);
  const library = useQuery({ queryKey: ["ingredients", "all"], queryFn: () => fetchAll<IIngredient>("ingredients") });
  const [pick, setPick] = useState("");
  const [fresh, setFresh] = useState("");
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["menu-item-ingredients"] });
    qc.invalidateQueries({ queryKey: ["ingredients"] });
  };
  const taken = new Set((attached.data ?? []).map((a) => a.ingredientId));
  const free = (library.data ?? []).filter((i) => !taken.has(i.id));

  const attach = useMutation({ mutationFn: (ingredientId: string) => itemIngredientsApi.create({ menuItemId: item.id, ingredientId, note: null, isRemovable: true }), onSuccess: () => { setPick(""); refresh(); } });
  const create = useMutation({
    mutationFn: async (name: string) => {
      const ing = await ingredientsApi.create({ nameEn: name, nameAr: null, descriptionEn: null, descriptionAr: null });
      return itemIngredientsApi.create({ menuItemId: item.id, ingredientId: ing.id, note: null, isRemovable: true });
    },
    onSuccess: () => { setFresh(""); refresh(); },
  });
  const patch = useMutation({ mutationFn: (v: { id: string; note: string | null; isRemovable: boolean }) => itemIngredientsApi.update({ id: v.id, body: { note: v.note, isRemovable: v.isRemovable } }), onSuccess: refresh });
  const detach = useMutation({ mutationFn: (id: string) => itemIngredientsApi.remove(id), onSuccess: refresh });

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
        <label className="min-w-52 flex-1 flex flex-col gap-2 text-xs font-medium text-muted-foreground">
          {t("add_from_library")}
          <select value={pick} onChange={(e) => setPick(e.target.value)} className="block h-[42px] w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
            <option value="">{t("select")}</option>
            {free.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </label>
        <Can permission="MenuItemIngredients.Add"><Button type="button" variant="primary" disabled={!pick || attach.isPending} onClick={() => attach.mutate(pick)}>
          <Plus />
          {t("add")}
        </Button></Can>
        <span className="mx-1 hidden h-8 w-px bg-border sm:block" aria-hidden />
        <label className="min-w-44 flex-1 flex flex-col gap-2 text-xs font-medium text-muted-foreground">
          {t("new_ingredient")}
          <Input value={fresh} onChange={(e) => setFresh(e.target.value)} maxLength={150} placeholder={t("name_en")} className="h-[42px]" />
        </label>
        <Can permission="Ingredients.Add"><Button type="button" variant="outline" disabled={!fresh.trim() || create.isPending} onClick={() => create.mutate(fresh.trim())}>
          {create.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
          {t("create_and_add")}
        </Button></Can>
      </div>

      {(attached.data ?? []).length === 0 ? (
        <EmptyState icon={Wheat} title={t("no_ingredients")} hint={t("no_ingredients_hint")} />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {(attached.data ?? []).map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="min-w-32 flex-1 font-medium text-foreground">{a.ingredientName}</span>
              <Input defaultValue={a.note ?? ""} placeholder={t("ingredient_note")} maxLength={200} onBlur={(e) => e.target.value !== (a.note ?? "") && patch.mutate({ id: a.id, note: strOrNull(e.target.value), isRemovable: a.isRemovable })} className="h-9 w-48" />
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Switch checked={a.isRemovable} disabled={!can("MenuItemIngredients.Edit")} onCheckedChange={(on) => patch.mutate({ id: a.id, note: a.note ?? null, isRemovable: on })} aria-label={t("removable")} />
                {t("removable")}
              </label>
              <Button type="button" variant="ghost" size="icon" aria-label={t("delete")} disabled={!can("MenuItemIngredients.Delete")} onClick={() => detach.mutate(a.id)} className="hover:text-destructive">
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">{t("ingredients_regen_hint")}</p>
    </div>
  );
}

/* ------------------------------ 3D model ------------------------------ */
/** Edit a model's file URLs (spec 01 §8): the save replaces all three and keeps whether it shows on the menu. */
function ModelUrlsEditor({ model, onSaved }: { model: { id: string; glbUrl?: string | null; usdzUrl?: string | null; thumbnailUrl?: string | null; isActive: boolean }; onSaved: () => void }) {
  const { t } = useTranslation();
  const [v, setV] = useState({ glbUrl: model.glbUrl ?? "", usdzUrl: model.usdzUrl ?? "", thumbnailUrl: model.thumbnailUrl ?? "" });
  const save = useMutation({
    mutationFn: () => model3dApi.update({ id: model.id, body: { glbUrl: v.glbUrl.trim(), usdzUrl: v.usdzUrl.trim() || null, thumbnailUrl: v.thumbnailUrl.trim() || null, isActive: model.isActive } }),
    onSuccess: () => {
      onSaved();
      toast.success(t("saved"));
    },
  });
  const changed = v.glbUrl !== (model.glbUrl ?? "") || v.usdzUrl !== (model.usdzUrl ?? "") || v.thumbnailUrl !== (model.thumbnailUrl ?? "");
  return (
    <details className="mt-3 border-t border-border px-1 pt-3">
      <summary className="cursor-pointer text-xs font-medium text-primary">{t("edit_model_urls")}</summary>
      <div className="mt-3 space-y-2">
        {(["glbUrl", "usdzUrl", "thumbnailUrl"] as const).map((k) => (
          <label key={k} className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
            {t(`model_${k}`)}{k === "glbUrl" && " *"}
            <Input dir="ltr" value={v[k]} onChange={(e) => setV((x) => ({ ...x, [k]: e.target.value }))} placeholder="https://" className="h-9 font-mono text-xs" />
          </label>
        ))}
        <Button type="button" variant="outline" size="sm" disabled={!changed || !/^https:\/\//i.test(v.glbUrl.trim()) || save.isPending} onClick={() => save.mutate()}>
          {save.isPending && <Loader2 className="animate-spin" />}
          {t("save")}
        </Button>
      </div>
    </details>
  );
}

function ModelTab({ item }: { item: IItem }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const models = useItemModels(item.id);
  const jobs = useItemJobs(item.id, JobKind.Model);
  const quota = useQuota();
  const generate = useGenerate();
  const [viewId, setViewId] = useState<string | null>(null);
  const all = (models.data ?? []).filter((m) => m.glbUrl);
  const active = all.find((m) => m.id === viewId) ?? all.find((m) => m.isActive) ?? all[0];
  const lastJob = jobs.all[0];
  const busy = jobs.active.length > 0;
  const noQuota = remainingCap(quota.data) === 0;
  const refresh = () => qc.invalidateQueries({ queryKey: ["menu-item-3d-models"] });

  const [source, setSource] = useState<ModelSource>(ModelSource.Auto);
  const run = (forceNew: boolean) =>
    generate.mutate({ menuItemId: item.id, forceNew, source }, { onError: () => undefined });
  // Model links are signed and expire: when the viewer cannot load one (403), fetch the models again for fresh links.
  const lastRefetch = useRef(0);
  const refetchLinks = () => {
    if (Date.now() - lastRefetch.current < 30_000) return;
    lastRefetch.current = Date.now();
    refresh();
  };

  const [byUrl, setByUrl] = useState({ glbUrl: "", usdzUrl: "", thumbnailUrl: "" });
  const addByUrl = useMutation({
    mutationFn: () => model3dApi.create({ menuItemId: item.id, glbUrl: byUrl.glbUrl.trim(), usdzUrl: byUrl.usdzUrl.trim() || null, thumbnailUrl: byUrl.thumbnailUrl.trim() || null } as never),
    onSuccess: () => {
      setByUrl({ glbUrl: "", usdzUrl: "", thumbnailUrl: "" });
      refresh();
      toast.success(t("success_add"));
    },
  });
  const [glb, setGlb] = useState<File | null>(null);
  const [usdz, setUsdz] = useState<File | null>(null);
  const [thumb, setThumb] = useState<File | null>(null);
  const up = useMutation({
    mutationFn: () => {
      const b = new FormData();
      b.append("menuItemId", item.id);
      b.append("glbFile", glb as File);
      if (usdz) b.append("usdzFile", usdz);
      if (thumb) b.append("thumbnailFile", thumb);
      return uploadModel(b);
    },
    onSuccess: () => {
      setGlb(null);
      setUsdz(null);
      setThumb(null);
      refresh();
      toast.success(t("success_add"));
    },
  });

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-card">
        {active ? <ModelViewer glb={active.glbUrl} usdz={active.usdzUrl} poster={active.thumbnailUrl} onLoadError={refetchLinks} className="h-[22rem] w-full" /> : (
          <EmptyState icon={Box} title={t("no_model_yet")} hint={t("no_model_hint")} />
        )}
        {active && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
            <Badge variant="secondary" appearance="light" size="md">{active.sourceType === 1 ? t("model_manual") : t("model_ai")}</Badge>
            <span className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-muted-foreground">
                <Switch checked={active.isActive} disabled={!can("MenuItem3DModels.Edit")} onCheckedChange={(on) => model3dApi.update({ id: active.id, body: { glbUrl: active.glbUrl, usdzUrl: active.usdzUrl, thumbnailUrl: active.thumbnailUrl, isActive: on } }).then(refresh)} aria-label={t("active")} />
                {t("shown_on_menu")}
              </label>
              <Can permission="MenuItem3DModels.Delete"><button type="button" onClick={async () => { if (await confirmAction({ title: t("delete_confirm_title"), description: t("delete_irreversible"), confirmText: t("delete"), danger: true })) { await model3dApi.remove(active.id); refresh(); } }} className="text-destructive hover:underline">{t("delete")}</button></Can>
            </span>
          </div>
        )}
        {active && can("MenuItem3DModels.Edit") && <ModelUrlsEditor key={active.id} model={active} onSaved={refresh} />}
        {all.length > 1 && (
          <div className="mt-3 border-t border-border px-1 pt-3">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">{t("all_models", { n: all.length })}</p>
            <ul className="flex flex-wrap gap-2">
              {all.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setViewId(m.id)}
                    aria-pressed={m.id === active?.id}
                    className={cn("flex items-center gap-2 rounded-xl border p-1.5 pe-3 text-xs transition-colors", m.id === active?.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}
                  >
                    {m.thumbnailUrl && isSafeUrl(m.thumbnailUrl) ? <img src={m.thumbnailUrl} alt="" className="size-9 rounded-lg object-cover" /> : <span className="grid size-9 place-items-center rounded-lg bg-muted"><Box className="size-4 text-muted-foreground" /></span>}
                    <span className="flex flex-col items-start">
                      <span className="font-medium text-foreground">{m.sourceType === 1 ? t("model_manual") : t("model_ai")}</span>
                      <span className={m.isActive ? "text-success" : "text-muted-foreground"}>{m.isActive ? t("shown_on_menu") : t("hidden")}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="size-4 text-terracotta" />{t("generate_model")}</h3>
          <QuotaStrip compact />
          {lastJob && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <JobBadge job={lastJob} />
              {lastJob.isLibraryMatch && <Badge variant="info" appearance="light" size="sm">{t("library_reused")}</Badge>}
              <Badge variant="secondary" appearance="light" size="sm">{t("source_label", { s: t(SOURCE_LABEL[lastJob.source ?? ModelSource.Auto]) })}</Badge>
              {lastJob.status === JobStatus.Failed && lastJob.errorMessage && <span className="text-destructive">{lastJob.errorMessage}</span>}
            </div>
          )}
          <SourceSelect value={source} onChange={setSource} disabled={busy || generate.isPending} />
          {generate.isError && <p role="alert" className="text-xs text-destructive">{parseApiError(generate.error).status === 400 && source >= ModelSource.Image ? t("generate_no_photo") : t("generate_blocked")}</p>}
          <div className="flex flex-wrap gap-2">
            <Can permission="ModelGenerationJobs.Add"><Button type="button" variant="primary" disabled={busy || noQuota || generate.isPending} onClick={() => run(false)}>
              {generate.isPending || busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {active ? t("regenerate") : t("generate_model")}
            </Button></Can>
            <Can permission="ModelGenerationJobs.Add"><Button type="button" variant="outline" disabled={busy || noQuota || generate.isPending} onClick={() => run(true)} title={t("force_new_hint")}>
              <RefreshCw />
              {t("force_new")}
            </Button></Can>
          </div>
          {active && <p className="text-xs text-muted-foreground">{t("regen_locked_hint")}</p>}
        </div>

        <Can permission="MenuItem3DModels.Add">
        <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold">{t("upload_model")}</h3>
          <p className="text-xs text-muted-foreground">{t("upload_model_hint")}</p>
          <div className="flex flex-wrap gap-2">
            <FilePickButton accept=".glb" label={glb ? glb.name : "GLB *"} onPick={setGlb} size="sm" />
            <FilePickButton accept=".usdz" label={usdz ? usdz.name : "USDZ"} onPick={setUsdz} size="sm" />
            <FilePickButton accept=".jpg,.jpeg,.png,.webp" label={thumb ? thumb.name : t("thumbnail")} onPick={setThumb} size="sm" />
          </div>
          <Button type="button" variant="primary" disabled={!glb || up.isPending} onClick={() => up.mutate()}>
            {up.isPending && <Loader2 className="animate-spin" />}
            {t("upload")}
          </Button>
          <details className="group border-t border-border pt-3">
            <summary className="cursor-pointer text-xs font-medium text-primary">{t("add_model_by_url")}</summary>
            <div className="mt-3 space-y-2">
              {(["glbUrl", "usdzUrl", "thumbnailUrl"] as const).map((k) => (
                <label key={k} className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
                  {t(`model_${k}`)}{k === "glbUrl" && " *"}
                  <Input dir="ltr" value={byUrl[k]} onChange={(e) => setByUrl((v) => ({ ...v, [k]: e.target.value }))} placeholder="https://" className="h-9 font-mono text-xs" />
                </label>
              ))}
              <Button type="button" variant="outline" size="sm" disabled={!/^https:\/\//i.test(byUrl.glbUrl.trim()) || addByUrl.isPending} onClick={() => addByUrl.mutate()}>
                {addByUrl.isPending && <Loader2 className="animate-spin" />}
                {t("add")}
              </Button>
            </div>
          </details>
        </div>
        </Can>
      </div>
    </div>
  );
}
