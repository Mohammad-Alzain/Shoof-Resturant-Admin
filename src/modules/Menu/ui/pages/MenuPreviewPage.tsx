import { useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ArrowUpRight, Box, Check, Copy, ExternalLink, EyeOff, ImageOff, Languages, Moon, Palette, Rotate3d, Sun, X } from "lucide-react";
import { toast } from "sonner";
import { http } from "@/Api/httpClient";
import { ModelViewer } from "@/components/common/ModelViewer";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { isSafeUrl } from "@/helpers/url";
import { apiBaseUrl } from "@/modules/Auth/core/tenant";
import { formatPrice, useCurrencies } from "@/modules/shared/core/lookups";
import { useCurrentRestaurant } from "@/modules/shared/core/restaurant";
import { DEFAULT_THEME, PLATFORMS, type IQr, type ISocialLink, type ITheme } from "@/modules/Restaurant/core/api";
import { primaryImage, useItemIngredients, type ICategory, type IItem } from "../../core/api";

type Lang = "ar" | "en";
type IPaged<T> = { data: T[]; totalPages: number };

/** Every page of a list, read in the guest's language (the API answers names in `X-Language`). */
const readAll = async <T,>(path: string, params: Record<string, unknown>, lang?: Lang): Promise<T[]> => {
  const out: T[] = [];
  for (let page = 1; page <= 20; page++) {
    const r = await http.get<IPaged<T>>(path, { params: { ...params, page, pageSize: 100 }, ...(lang ? { headers: { "X-Language": lang } } : {}), silent: true });
    out.push(...(r.data ?? []));
    if (page >= (r.totalPages ?? 1)) break;
  }
  return out;
};

interface Section {
  cat: ICategory;
  items: IItem[];
  subs: { cat: ICategory; items: IItem[] }[];
}

/** The menu's tree as a guest walks it: categories by display order, their own dishes, then each sub-category's. */
const buildTree = (cats: ICategory[], items: IItem[], showHidden: boolean): Section[] => {
  const live = (c: { isActive: boolean }) => showHidden || c.isActive;
  const order = <T extends { displayOrder: number }>(a: T, b: T) => a.displayOrder - b.displayOrder;
  const dishes = (id: string) => items.filter((i) => i.menuCategoryId === id && live(i)).sort(order);
  return cats
    .filter((c) => !c.parentCategoryId && live(c))
    .sort(order)
    .map((cat) => ({
      cat,
      items: dishes(cat.id),
      subs: cats.filter((s) => s.parentCategoryId === cat.id && live(s)).sort(order).map((s) => ({ cat: s, items: dishes(s.id) })),
    }))
    .filter((s) => s.items.length || s.subs.some((x) => x.items.length));
};

/** The public menu's address for this restaurant: the general QR's target when it exists, else the same pattern. */
const liveUrl = (qr: IQr | undefined, restaurantId?: string) => {
  if (qr?.targetUrl) return qr.targetUrl;
  if (!restaurantId) return "";
  const api = apiBaseUrl();
  const origin = /^https?:\/\//i.test(api) ? new URL(api).origin : window.location.origin;
  return `${origin}/menu/${restaurantId}`;
};

function Segmented<V extends string | number>({ value, onChange, options, label }: { value: V; onChange: (v: V) => void; options: { value: V; label: string; icon?: React.ComponentType<{ className?: string }> }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-border bg-muted/60 p-0.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === o.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.icon && <o.icon className="size-3.5" />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** A dish opened on the phone: photos, the 3D model when there is one, description, price and ingredients. */
function DishSheet({ item, th, lang, price, onClose }: { item: IItem; th: Partial<ITheme>; lang: Lang; price: string; onClose: () => void }) {
  const { t } = useTranslation();
  const ings = useItemIngredients(item.id);
  const photos = [...(item.images ?? [])].sort((a, b) => a.displayOrder - b.displayOrder).filter((p) => isSafeUrl(p.url));
  const [show3d, setShow3d] = useState(false);
  const [shot, setShot] = useState(0);
  const tr = (ar: string, en: string) => (lang === "ar" ? ar : en);
  return (
    <motion.div
      className="absolute inset-0 z-30 flex flex-col overflow-y-auto"
      style={{ background: th.itemBackgroundColor ?? "#fff", color: th.itemTextColor ?? "#261c1a", fontFamily: th.itemFontFamily ? `"${th.itemFontFamily}", sans-serif` : undefined }}
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      role="dialog"
      aria-label={item.name}
    >
      <div className="relative aspect-square w-full shrink-0 bg-black/5">
        {show3d && item.activeModel?.glbUrl ? (
          <ModelViewer glb={item.activeModel.glbUrl} usdz={item.activeModel.usdzUrl} poster={item.activeModel.thumbnailUrl} className="h-full w-full" />
        ) : photos[shot] ? (
          <img src={photos[shot].url} alt="" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center opacity-50"><ImageOff className="size-8" /></span>
        )}
        <button type="button" onClick={onClose} aria-label={t("close")} className="absolute start-3 top-9 grid size-9 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm">
          <X className="size-4" />
        </button>
        {item.activeModel?.glbUrl && (
          <button type="button" onClick={() => setShow3d((v) => !v)} className="absolute end-3 top-9 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-[#541f2d] shadow">
            <Rotate3d className="size-4" aria-hidden />
            {show3d ? tr("الصور", "Photos") : tr("شاهده ثلاثي الأبعاد", "View in 3D")}
          </button>
        )}
        {!show3d && photos.length > 1 && (
          <span className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {photos.map((p, i) => (
              <button key={p.id} type="button" onClick={() => setShot(i)} aria-label={`${i + 1}`} className={cn("size-2 rounded-full transition-all", i === shot ? "w-5 bg-white" : "bg-white/55")} />
            ))}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold leading-snug">{item.name}</h3>
          <bdi className="shrink-0 text-base font-bold tabular-nums">{price}</bdi>
        </div>
        {item.description && <p className="text-sm leading-relaxed opacity-80">{item.description}</p>}
        {photos[shot]?.caption && !show3d && <p className="text-xs italic opacity-70">{photos[shot].caption}</p>}
        <div className="mt-1">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-60">{tr("المكوّنات", "Ingredients")}</h4>
          {ings.isLoading ? (
            <div className="flex gap-2"><Skeleton className="h-7 w-20 rounded-full" /><Skeleton className="h-7 w-16 rounded-full" /></div>
          ) : (ings.data ?? []).length ? (
            <ul className="flex flex-wrap gap-1.5">
              {ings.data!.map((g) => (
                <li key={g.id} className="inline-flex items-center gap-1 rounded-full border border-current/20 px-2.5 py-1 text-xs">
                  {g.ingredientName}
                  {g.note && <span className="opacity-60">· {g.note}</span>}
                  {g.isRemovable && <span className="opacity-60" title={tr("يمكن طلبه بدونه", "Can be left out")}>· {tr("اختياري", "optional")}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs opacity-60">—</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * The phone: the restaurant's menu drawn with its active theme (header, category / sub-category / dish colours and fonts,
 * logo position, background), in the guest's language, from the live data. Tapping a dish opens it as the guest would.
 */
function Phone({ sections, th, lang, name, logo, social, priceOf, loading }: { sections: Section[]; th: Partial<ITheme>; lang: Lang; name: string; logo?: string | null; social: ISocialLink[]; priceOf: (i: IItem) => string; loading: boolean }) {
  const { t } = useTranslation();
  const scroller = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<IItem | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const still = useReducedMotion();
  const font = (f?: string | null) => (f ? { fontFamily: `"${f}", "IBM Plex Sans Arabic", sans-serif` } : undefined);
  const pos = th.headerLogoPosition ?? 1;
  const go = (id: string) => {
    const box = scroller.current;
    const el = box?.querySelector<HTMLElement>(`[data-cat="${id}"]`);
    if (!box || !el) return;
    setActive(id);
    box.scrollTo({ top: el.offsetTop - 52, behavior: still ? "auto" : "smooth" });
  };
  const logoEl = logo && isSafeUrl(logo) ? <img src={logo} alt="" className="size-9 shrink-0 rounded-xl object-cover" /> : null;

  const dish = (i: IItem) => {
    const img = primaryImage(i);
    return (
      <button
        key={i.id}
        type="button"
        onClick={() => setOpen(i)}
        className={cn("flex w-full items-center gap-3 rounded-2xl p-2.5 text-start shadow-[0_6px_14px_-10px_rgb(0_0_0/0.4)] transition-transform active:scale-[0.98]", !i.isActive && "opacity-55")}
        style={{ background: th.itemBackgroundColor ?? "#fff", color: th.itemTextColor ?? "#261c1a", ...font(th.itemFontFamily) }}
      >
        <span className="relative size-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-black/5">
          {img && isSafeUrl(img.url) ? <img src={img.url} alt="" loading="lazy" className="size-full object-cover" /> : <span className="grid size-full place-items-center opacity-40"><ImageOff className="size-5" /></span>}
          {i.activeModel?.glbUrl && <span className="absolute bottom-1 start-1 rounded-full bg-white/90 px-1.5 text-[0.5625rem] font-bold text-[#541f2d]">3D</span>}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold">{i.name}</span>
            {!i.isActive && <EyeOff className="size-3 shrink-0 opacity-70" aria-label={t("hidden_from_guests")} />}
          </span>
          {i.description && <span className="mt-0.5 line-clamp-2 text-[0.6875rem] leading-snug opacity-70">{i.description}</span>}
          <span className="mt-1 block text-[0.8125rem] font-bold tabular-nums"><bdi>{priceOf(i)}</bdi></span>
        </span>
      </button>
    );
  };

  return (
    <div className="relative mx-auto w-full max-w-[24rem]">
      <div className="relative overflow-hidden rounded-[2.75rem] border-[10px] border-[#261c1a] bg-[#261c1a] shadow-[0_40px_80px_-30px_rgb(38_28_26/0.6)]">
        <span aria-hidden className="absolute start-1/2 top-2 z-40 h-5 w-24 -translate-x-1/2 rounded-full bg-[#261c1a] rtl:translate-x-1/2" />
        <div
          ref={scroller}
          dir={lang === "ar" ? "rtl" : "ltr"}
          lang={lang}
          className="relative h-[46rem] max-h-[78vh] overflow-y-auto overscroll-contain rounded-[2rem] [scrollbar-width:none]"
          style={{ background: th.menuBackgroundColor ?? "#fff", backgroundImage: th.menuBackgroundImageUrl && isSafeUrl(th.menuBackgroundImageUrl) ? `url("${th.menuBackgroundImageUrl}")` : undefined, backgroundSize: "cover", backgroundAttachment: "local" }}
        >
          <header
            className={cn("flex items-center gap-3 px-4 pb-4 pt-9", pos === 1 ? "flex-col justify-center text-center" : pos === 2 ? "flex-row-reverse justify-between" : "justify-between")}
            style={{ background: th.headerBackgroundColor ?? undefined, color: th.headerTextColor ?? undefined, ...font(th.headerFooterFontFamily) }}
          >
            {logoEl}
            <span className="min-w-0 truncate text-lg font-bold">{name}</span>
            {pos !== 1 && <span className="size-9 shrink-0" />}
          </header>

          {sections.length > 0 && (
            <nav className="sticky top-0 z-20 flex gap-2 overflow-x-auto px-3 py-2.5 backdrop-blur-md [scrollbar-width:none]" style={{ background: `color-mix(in srgb, ${th.menuBackgroundColor ?? "#ffffff"} 82%, transparent)` }}>
              {sections.map((s) => (
                <button
                  key={s.cat.id}
                  type="button"
                  onClick={() => go(s.cat.id)}
                  className={cn("shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all", active === s.cat.id ? "ring-2 ring-current/40" : "opacity-85")}
                  style={{ background: th.categoryBackgroundColor ?? undefined, color: th.categoryTextColor ?? undefined, ...font(th.categoryFontFamily) }}
                >
                  {s.cat.name}
                </button>
              ))}
            </nav>
          )}

          <div className="space-y-6 px-3 pb-6 pt-2">
            {loading &&
              Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            {!loading && sections.length === 0 && <p className="px-4 py-16 text-center text-sm opacity-70">{t("preview_empty")}</p>}
            {sections.map((s) => (
              <section key={s.cat.id} data-cat={s.cat.id} className="space-y-2.5">
                <h2 className={cn("rounded-xl px-3.5 py-2.5 text-base font-bold", !s.cat.isActive && "opacity-55")} style={{ background: th.categoryBackgroundColor ?? undefined, color: th.categoryTextColor ?? undefined, ...font(th.categoryFontFamily) }}>
                  {s.cat.name}
                  {s.cat.description && <span className="mt-0.5 block text-[0.6875rem] font-normal opacity-75">{s.cat.description}</span>}
                </h2>
                {s.items.map(dish)}
                {s.subs
                  .filter((x) => x.items.length)
                  .map((x) => (
                    <div key={x.cat.id} className="space-y-2.5 pt-1">
                      <h3 className={cn("rounded-lg px-3 py-1.5 text-[0.8125rem] font-semibold", !x.cat.isActive && "opacity-55")} style={{ background: th.subCategoryBackgroundColor ?? undefined, color: th.subCategoryTextColor ?? undefined, ...font(th.subCategoryFontFamily) }}>
                        {x.cat.name}
                      </h3>
                      {x.items.map(dish)}
                    </div>
                  ))}
              </section>
            ))}
          </div>

          <footer className="px-4 py-5 text-center text-xs" style={{ background: th.footerBackgroundColor ?? undefined, color: th.footerTextColor ?? undefined, ...font(th.headerFooterFontFamily) }}>
            {social.length > 0 && (
              <span className="mb-2 flex flex-wrap justify-center gap-2">
                {social.map((l) => (
                  <span key={l.id} className="rounded-full border border-current/30 px-2.5 py-0.5 text-[0.6875rem]">{PLATFORMS[l.platform] ?? "—"}</span>
                ))}
              </span>
            )}
            © {name}
          </footer>

          <AnimatePresence>{open && <DishSheet key={open.id} item={open} th={th} lang={lang} price={priceOf(open)} onClose={() => setOpen(null)} />}</AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/**
 * Menu preview: the restaurant's menu exactly as guests will meet it (theme, language, photos, prices, ingredients, 3D),
 * built from the admin data so it shows unsaved-to-public states too (hidden dishes on demand), next to the live link,
 * its QR and the checks that still stand between the menu and its guests.
 */
export default function MenuPreviewPage() {
  const { t, i18n } = useTranslation();
  const { restaurant } = useCurrentRestaurant();
  const rid = restaurant?.id;
  const [lang, setLang] = useState<Lang>(i18n.language.startsWith("ar") ? "ar" : "en");
  const [mode, setMode] = useState<0 | 1>(0);
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState(false);
  const currencies = useCurrencies();

  const menu = useQuery({
    queryKey: ["menu-preview", rid, lang],
    enabled: !!rid,
    queryFn: async () => {
      const [cats, items] = await Promise.all([readAll<ICategory>("menu-categories", { restaurantId: rid }, lang), readAll<IItem>("menu-items", { restaurantId: rid }, lang)]);
      return { cats, items };
    },
  });
  const themes = useQuery({ queryKey: ["menu-themes", "preview", rid], enabled: !!rid, queryFn: () => readAll<ITheme>("menu-themes", { restaurantId: rid }) });
  const social = useQuery({ queryKey: ["restaurant-social-links", "preview", rid], enabled: !!rid, queryFn: () => readAll<ISocialLink>("restaurant-social-links", { restaurantId: rid }) });
  const qrs = useQuery({ queryKey: ["qr-codes", "preview", rid], enabled: !!rid, queryFn: () => readAll<IQr>("qr-codes", { restaurantId: rid }) });

  const activeTheme = themes.data?.find((th) => th.isActive && th.themeMode === mode);
  const th: Partial<ITheme> = activeTheme ?? { ...DEFAULT_THEME, ...(mode === 1 ? { menuBackgroundColor: "#1A1311", categoryBackgroundColor: "#3A2229", categoryTextColor: "#FBF5E9", subCategoryBackgroundColor: "#2B211F", subCategoryTextColor: "#F3E9DC", itemBackgroundColor: "#251B19", itemTextColor: "#F3E9DC", headerBackgroundColor: "#140D0C" } : {}) };
  const sections = useMemo(() => buildTree(menu.data?.cats ?? [], menu.data?.items ?? [], showHidden), [menu.data, showHidden]);
  const curOf = useMemo(() => new Map((currencies.data ?? []).map((c) => [c.id, c])), [currencies.data]);
  const priceOf = (i: IItem) => formatPrice(i.price, curOf.get(i.currencyId), lang);

  const general = qrs.data?.find((q) => !q.tableId);
  const url = liveUrl(general, rid);
  const items = menu.data?.items ?? [];
  const cats = menu.data?.cats ?? [];
  const hidden = items.filter((i) => !i.isActive).length;
  const noPhoto = items.filter((i) => i.isActive && !primaryImage(i)).length;
  const no3d = items.filter((i) => i.isActive && !i.activeModel?.glbUrl).length;
  const emptyCats = cats.filter((c) => c.isActive && !c.parentCategoryId && !items.some((i) => i.menuCategoryId === c.id || cats.some((s) => s.parentCategoryId === c.id && s.id === i.menuCategoryId))).length;

  const checks = [
    { ok: !!activeTheme, text: activeTheme ? t("preview_theme_on", { name: activeTheme.name }) : t("preview_theme_off"), to: "/dashboard/restaurant/themes" },
    { ok: noPhoto === 0, text: t("preview_no_photo", { n: noPhoto }), to: "/dashboard/menu/items" },
    { ok: no3d === 0, text: t("preview_no_3d", { n: no3d }), to: "/dashboard/generation/bulk" },
    { ok: emptyCats === 0, text: t("preview_empty_cats", { n: emptyCats }), to: "/dashboard/menu/categories" },
    { ok: !!general, text: general ? t("preview_qr_ready") : t("preview_qr_missing"), to: "/dashboard/restaurant/tables" },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error(t("copy_failed"));
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">{t("menu_preview")}</h1>
          <p className="mt-1 max-w-[60ch] text-sm text-muted-foreground">{t("menu_preview_desc")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented<Lang> label={t("preview_language")} value={lang} onChange={setLang} options={[{ value: "ar", label: "العربية", icon: Languages }, { value: "en", label: "English" }]} />
          <Segmented<0 | 1> label={t("preview_mode")} value={mode} onChange={setMode} options={[{ value: 0, label: t("theme_light"), icon: Sun }, { value: 1, label: t("theme_dark"), icon: Moon }]} />
        </div>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <Phone sections={sections} th={th} lang={lang} name={restaurant?.name ?? ""} logo={th.headerLogoUrl || restaurant?.logoUrl} social={social.data ?? []} priceOf={priceOf} loading={menu.isLoading} />

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">{t("preview_live_link")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t("preview_live_hint")}</p>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-1.5 ps-3">
              <bdi dir="ltr" className="min-w-0 flex-1 truncate font-mono text-xs text-foreground" title={url}>{url || "—"}</bdi>
              <button type="button" onClick={copy} disabled={!url} aria-label={t("copy")} className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40">
                {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
              </button>
              {url && isSafeUrl(url) && (
                <a href={url} target="_blank" rel="noreferrer" aria-label={t("open_page")} className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground">
                  <ExternalLink className="size-4" />
                </a>
              )}
            </div>
            {general?.imageUrl && isSafeUrl(general.imageUrl) && (
              <div className="mt-4 flex items-center gap-4">
                <img src={general.imageUrl} alt={t("general_qr")} className="size-24 rounded-xl border border-border bg-white p-1.5" />
                <p className="text-xs leading-relaxed text-muted-foreground">{t("preview_qr_hint")}</p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">{t("preview_checks")}</h2>
            <ul className="mt-2">
              {checks.map((c) => (
                <li key={c.text} className="border-t border-border first:border-t-0">
                  <Link to={c.to as never} className="group/chk -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm hover:bg-accent/50">
                    <span className={cn("grid size-6 shrink-0 place-items-center rounded-full", c.ok ? "bg-success/12 text-success" : "bg-terracotta/12 text-terracotta")}>
                      {c.ok ? <Check className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1 text-foreground">{c.text}</span>
                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/chk:opacity-100 rtl:-scale-x-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-card">
            <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-foreground">
              <span>
                {t("preview_show_hidden")}
                <span className="block text-xs text-muted-foreground">{t("preview_hidden_n", { n: hidden })}</span>
              </span>
              <Switch checked={showHidden} onCheckedChange={setShowHidden} aria-label={t("preview_show_hidden")} />
            </label>
            <Link to={"/dashboard/restaurant/themes" as never} className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline">
              <Palette className="size-3.5" />
              {t("preview_edit_theme")}
            </Link>
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Box className="mt-0.5 size-3.5 shrink-0" />
              {t("preview_tap_hint")}
            </p>
          </section>
        </aside>
      </div>
    </section>
  );
}
