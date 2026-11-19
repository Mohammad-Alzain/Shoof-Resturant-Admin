import { useState } from "react";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Check, Loader2, Moon, Palette, Pencil, Plus, Sun, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { confirmAction } from "@/components/common/Modal/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { getDirection } from "@/Translation/i18n";
import { cn } from "@/lib/utils";
import { fetchAll } from "@/modules/shared/core/lookups";
import { useRestaurantId } from "@/modules/shared/core/restaurant";
import { EmptyState, FilePickButton } from "@/modules/shared/ui/parts";
import { activateTheme, LOGO_POSITIONS, themesApi, THEME_MODES, TRANSITIONS, uploadThemeImage, type ITheme } from "../../core/api";
import { CardShell } from "@/components/common/ResourceCards";

const FONTS = ["Inter", "IBM Plex Sans", "IBM Plex Sans Arabic", "Cairo", "Tajawal", "Poppins", "Playfair Display", "Montserrat", "Lora", "Roboto"];

const DEFAULT: Partial<ITheme> = {
  name: "",
  themeMode: 0,
  menuBackgroundColor: "#FBF5E9",
  headerBackgroundColor: "#541F2D",
  headerTextColor: "#FBF5E9",
  headerLogoPosition: 1,
  footerBackgroundColor: "#261C1A",
  footerTextColor: "#FBF5E9",
  categoryBackgroundColor: "#E9DDCF",
  categoryTextColor: "#261C1A",
  subCategoryBackgroundColor: "#F3E7D6",
  subCategoryTextColor: "#261C1A",
  itemBackgroundColor: "#FFFFFF",
  itemTextColor: "#261C1A",
  headerFooterFontFamily: "IBM Plex Sans",
  categoryFontFamily: "IBM Plex Sans",
  subCategoryFontFamily: "IBM Plex Sans",
  itemFontFamily: "IBM Plex Sans",
  pageTransitionEffect: 3,
};

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function ColorField({ label, value, onChange }: { label: string; value?: string | null; onChange: (v: string) => void }) {
  const ok = !value || HEX.test(value);
  return (
    <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
      {label}
      <span className="flex items-center gap-2">
        <input type="color" value={value && HEX.test(value) && value.length === 7 ? value : "#000000"} onChange={(e) => onChange(e.target.value.toUpperCase())} aria-label={label} className="size-10 shrink-0 cursor-pointer rounded-lg border border-input bg-background p-0.5" />
        <Input dir="ltr" value={value ?? ""} maxLength={20} onChange={(e) => onChange(e.target.value)} aria-invalid={!ok} className="h-10 font-mono text-xs" />
      </span>
    </label>
  );
}

function FontField({ label, value, onChange }: { label: string; value?: string | null; onChange: (v: string) => void }) {
  return (
    <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
      {label}
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="block h-10 w-full rounded-md border border-input bg-background px-2.5 text-sm text-foreground">
        {FONTS.map((f) => (
          <option key={f}>{f}</option>
        ))}
      </select>
    </label>
  );
}

/** A miniature of the public menu, redrawn on every change of the theme. */
function Preview({ th }: { th: Partial<ITheme> }) {
  const f = (x?: string | null) => (x ? { fontFamily: `"${x}", sans-serif` } : undefined);
  const logo = (
    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white/25 text-[0.625rem] font-bold">{th.headerLogoUrl ? <img src={th.headerLogoUrl} alt="" className="size-7 rounded-lg object-cover" /> : "LOGO"}</span>
  );
  const pos = th.headerLogoPosition ?? 1;
  return (
    <div dir="ltr" className="mx-auto w-full max-w-[19rem] overflow-hidden rounded-[1.75rem] border-[6px] border-[#261c1a] shadow-2xl" style={{ background: th.menuBackgroundColor ?? "#fff", backgroundImage: th.menuBackgroundImageUrl ? `url(${th.menuBackgroundImageUrl})` : undefined, backgroundSize: "cover" }}>
      <div className={cn("flex items-center gap-2 px-3 py-3", pos === 1 ? "justify-center" : pos === 2 ? "flex-row-reverse justify-between" : "justify-between")} style={{ background: th.headerBackgroundColor ?? undefined, color: th.headerTextColor ?? undefined, ...f(th.headerFooterFontFamily) }}>
        {logo}
        <span className="text-sm font-semibold">Restaurant</span>
        {pos === 1 ? null : <span className="size-7" />}
      </div>
      <div className="space-y-3 p-3">
        <div className="rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: th.categoryBackgroundColor ?? undefined, color: th.categoryTextColor ?? undefined, ...f(th.categoryFontFamily) }}>Main dishes</div>
        <div className="rounded-md px-3 py-1.5 text-xs font-medium" style={{ background: th.subCategoryBackgroundColor ?? undefined, color: th.subCategoryTextColor ?? undefined, ...f(th.subCategoryFontFamily) }}>Burgers</div>
        {[["Classic burger", "$9.50"], ["Cheese burger", "$10.50"]].map(([n, p]) => (
          <div key={n} className="flex items-center gap-3 rounded-xl p-2.5 shadow-sm" style={{ background: th.itemBackgroundColor ?? undefined, color: th.itemTextColor ?? undefined, ...f(th.itemFontFamily) }}>
            <span className="size-12 rounded-lg bg-black/10" />
            <span className="flex-1 text-sm font-medium">{n}</span>
            <span className="text-sm font-semibold">{p}</span>
          </div>
        ))}
      </div>
      <div className="px-3 py-2.5 text-center text-[0.6875rem]" style={{ background: th.footerBackgroundColor ?? undefined, color: th.footerTextColor ?? undefined, ...f(th.headerFooterFontFamily) }}>© Restaurant</div>
    </div>
  );
}

const ThemeEditor = NiceModal.create(({ theme, restaurantId }: { theme?: ITheme; restaurantId: string }) => {
  const modal = useModal();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [th, setTh] = useState<Partial<ITheme>>(theme ?? DEFAULT);
  const set = (k: keyof ITheme) => (v: string | number) => setTh((s) => ({ ...s, [k]: v }));
  const refresh = () => qc.invalidateQueries({ queryKey: ["menu-themes"] });
  const bad = [th.menuBackgroundColor, th.headerBackgroundColor, th.headerTextColor, th.footerBackgroundColor, th.footerTextColor, th.categoryBackgroundColor, th.categoryTextColor, th.subCategoryBackgroundColor, th.subCategoryTextColor, th.itemBackgroundColor, th.itemTextColor].some((c) => c && !HEX.test(c));

  const save = useMutation({
    mutationFn: async () => {
      const { id: _id, restaurantId: _r, themeMode, isActive: _a, ...rest } = th as ITheme;
      void _id; void _r; void _a;
      return theme ? themesApi.update({ id: theme.id, body: rest }) : themesApi.create({ ...rest, restaurantId, themeMode } as never);
    },
    onSuccess: (r) => {
      refresh();
      toast.success(t(theme ? "success_update" : "success_add"));
      if (!theme) setTh(r);
      else modal.hide();
      if (!theme) modal.hide();
    },
  });
  const img = (kind: "background-image" | "header-logo") => (f: File) => {
    if (!theme) return void toast.info(t("save_first"));
    uploadThemeImage(theme.id, kind, f).then((r) => { setTh((s) => ({ ...s, ...(kind === "header-logo" ? { headerLogoUrl: r.headerLogoUrl } : { menuBackgroundImageUrl: r.menuBackgroundImageUrl }) })); refresh(); });
  };

  const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <fieldset className="space-y-3 rounded-xl border border-border p-4">
      <legend className="px-1 text-xs font-semibold text-foreground">{title}</legend>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );

  return (
    <Sheet open={modal.visible} onOpenChange={(o) => !o && modal.hide()}>
      <SheetContent dir={getDirection()} side="right" className="w-full gap-0 p-0 sm:max-w-5xl">
        <SheetHeader className="border-b border-border px-6 py-4 pe-14 text-start">
          <SheetTitle className="flex items-center gap-2.5 text-base"><span aria-hidden className="h-5 w-1 rounded-full bg-terracotta" />{theme ? t("edit_theme") : t("add_theme")}</SheetTitle>
          <SheetDescription className="sr-only">{t("themes")}</SheetDescription>
        </SheetHeader>
        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="min-h-0 space-y-4 overflow-y-auto px-6 py-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
                {t("name")} *
                <Input value={th.name ?? ""} maxLength={200} onChange={(e) => set("name")(e.target.value)} className="h-10" />
              </label>
              <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
                {t("theme_mode")}
                <select disabled={!!theme} value={th.themeMode} onChange={(e) => set("themeMode")(Number(e.target.value))} className="block h-10 w-full rounded-md border border-input bg-background px-2.5 text-sm text-foreground disabled:opacity-60">
                  {THEME_MODES.map((m, i) => <option key={m} value={i}>{t(`mode_${m.toLowerCase()}`)}</option>)}
                </select>
              </label>
            </div>
            <Group title={t("theme_menu")}>
              <ColorField label={t("bg_color")} value={th.menuBackgroundColor} onChange={set("menuBackgroundColor")} />
              <div className="space-y-1.5 text-xs font-medium text-muted-foreground">{t("bg_image")}<div><FilePickButton accept=".jpg,.jpeg,.png,.webp" label={t("upload")} onPick={img("background-image")} size="sm" /></div></div>
            </Group>
            <Group title={t("theme_header")}>
              <ColorField label={t("bg_color")} value={th.headerBackgroundColor} onChange={set("headerBackgroundColor")} />
              <ColorField label={t("text_color")} value={th.headerTextColor} onChange={set("headerTextColor")} />
              <label className="space-y-1.5 text-xs font-medium text-muted-foreground">{t("logo_position")}
                <select value={th.headerLogoPosition} onChange={(e) => set("headerLogoPosition")(Number(e.target.value))} className="block h-10 w-full rounded-md border border-input bg-background px-2.5 text-sm text-foreground">
                  {LOGO_POSITIONS.map((p, i) => <option key={p} value={i}>{t(`pos_${p.toLowerCase()}`)}</option>)}
                </select>
              </label>
              <div className="space-y-1.5 text-xs font-medium text-muted-foreground">{t("header_logo")}<div><FilePickButton accept=".jpg,.jpeg,.png,.webp" label={t("upload")} onPick={img("header-logo")} size="sm" /></div></div>
            </Group>
            <Group title={t("theme_footer")}>
              <ColorField label={t("bg_color")} value={th.footerBackgroundColor} onChange={set("footerBackgroundColor")} />
              <ColorField label={t("text_color")} value={th.footerTextColor} onChange={set("footerTextColor")} />
            </Group>
            <Group title={t("category")}>
              <ColorField label={t("bg_color")} value={th.categoryBackgroundColor} onChange={set("categoryBackgroundColor")} />
              <ColorField label={t("text_color")} value={th.categoryTextColor} onChange={set("categoryTextColor")} />
            </Group>
            <Group title={t("subcategory")}>
              <ColorField label={t("bg_color")} value={th.subCategoryBackgroundColor} onChange={set("subCategoryBackgroundColor")} />
              <ColorField label={t("text_color")} value={th.subCategoryTextColor} onChange={set("subCategoryTextColor")} />
            </Group>
            <Group title={t("item")}>
              <ColorField label={t("bg_color")} value={th.itemBackgroundColor} onChange={set("itemBackgroundColor")} />
              <ColorField label={t("text_color")} value={th.itemTextColor} onChange={set("itemTextColor")} />
            </Group>
            <Group title={t("theme_fonts")}>
              <FontField label={t("font_header")} value={th.headerFooterFontFamily} onChange={set("headerFooterFontFamily")} />
              <FontField label={t("category")} value={th.categoryFontFamily} onChange={set("categoryFontFamily")} />
              <FontField label={t("subcategory")} value={th.subCategoryFontFamily} onChange={set("subCategoryFontFamily")} />
              <FontField label={t("item")} value={th.itemFontFamily} onChange={set("itemFontFamily")} />
              <label className="space-y-1.5 text-xs font-medium text-muted-foreground sm:col-span-2">{t("page_transition")}
                <select value={th.pageTransitionEffect} onChange={(e) => set("pageTransitionEffect")(Number(e.target.value))} className="block h-10 w-full rounded-md border border-input bg-background px-2.5 text-sm text-foreground">
                  {TRANSITIONS.map((p, i) => <option key={p} value={i}>{t(`trans_${p.toLowerCase()}`)}</option>)}
                </select>
              </label>
            </Group>
          </div>
          <aside className="hidden border-s border-border bg-muted/40 p-5 lg:block">
            <p className="mb-3 text-center text-xs font-semibold text-muted-foreground">{t("live_preview")}</p>
            <div className="sticky top-5"><Preview th={th} /></div>
          </aside>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-3">
          <Button type="button" variant="outline" onClick={() => modal.hide()}>{t("cancel")}</Button>
          <Button type="button" variant="primary" disabled={!th.name?.trim() || bad || save.isPending} onClick={() => save.mutate()}>
            {save.isPending && <Loader2 className="animate-spin" />}
            {t("save")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
});

/** Each restaurant can own many themes, but only one Light and one Dark theme is active (published to the menu) at a time. */
export default function ThemesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const restaurantId = useRestaurantId();
  const q = useQuery({ queryKey: ["menu-themes", "all", restaurantId], queryFn: () => fetchAll<ITheme>("menu-themes", restaurantId ? { restaurantId } : {}) });
  const refresh = () => qc.invalidateQueries({ queryKey: ["menu-themes"] });
  const act = useMutation({ mutationFn: (id: string) => activateTheme(id), onSuccess: () => { refresh(); toast.success(t("theme_activated")); } });

  const activate = async (th: ITheme) => {
    if (await confirmAction({ title: t("activate_theme_q"), description: t("activate_theme_hint"), confirmText: t("activate"), neutral: true } as never)) act.mutate(th.id);
  };
  const remove = async (th: ITheme) => {
    if (!(await confirmAction({ title: t("delete_confirm_title"), description: t("delete_irreversible"), confirmText: t("delete"), danger: true }))) return;
    await themesApi.remove(th.id);
    refresh();
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">{t("themes")}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{t("themes_desc")}</p>
        </div>
        <Button type="button" variant="primary" disabled={!restaurantId} onClick={() => NiceModal.show(ThemeEditor, { restaurantId })}>
          <Plus />
          {t("add_theme")}
        </Button>
      </header>
      {q.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}</div>
      ) : (q.data ?? []).length === 0 ? (
        <EmptyState icon={Palette} title={t("no_themes")} hint={t("no_themes_hint")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(q.data ?? []).map((th, i) => (
            <CardShell key={th.id} index={i} className={th.isActive ? "ring-2 ring-primary" : ""}
              actions={<><Button type="button" variant="ghost" size="icon" aria-label={t("edit")} onClick={() => NiceModal.show(ThemeEditor, { theme: th, restaurantId })}><Pencil className="size-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label={t("delete")} onClick={() => remove(th)} className="hover:text-destructive"><Trash2 className="size-4" /></Button></>}>
              <div className="p-4"><div className="origin-top scale-[0.8] sm:scale-100"><MiniSwatches th={th} /></div></div>
              <div className="mt-auto flex items-center justify-between gap-2 border-t border-border bg-muted/30 px-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-foreground">{th.name}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">{th.themeMode === 1 ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}{t(th.themeMode === 1 ? "mode_dark" : "mode_light")}</span>
                </span>
                {th.isActive ? <Badge variant="success" appearance="light" size="md" className="gap-1"><Check className="size-3.5" />{t("active")}</Badge> : <Button type="button" variant="outline" size="sm" onClick={() => activate(th)}>{t("activate")}</Button>}
              </div>
            </CardShell>
          ))}
        </div>
      )}
    </section>
  );
}

function MiniSwatches({ th }: { th: ITheme }) {
  const bars = [th.headerBackgroundColor, th.categoryBackgroundColor, th.subCategoryBackgroundColor, th.itemBackgroundColor, th.footerBackgroundColor];
  return (
    <div dir="ltr" className="overflow-hidden rounded-xl border border-border" style={{ background: th.menuBackgroundColor ?? "#fff" }}>
      {bars.map((c, i) => (
        <div key={i} className={cn("flex items-center px-3", i === 0 || i === 4 ? "h-8" : "h-7")} style={{ background: c ?? "transparent" }}>
          <span className="h-1.5 w-1/3 rounded-full opacity-60" style={{ background: [th.headerTextColor, th.categoryTextColor, th.subCategoryTextColor, th.itemTextColor, th.footerTextColor][i] ?? "#000" }} />
        </div>
      ))}
    </div>
  );
}
