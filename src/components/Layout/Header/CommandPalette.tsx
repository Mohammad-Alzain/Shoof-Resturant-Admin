import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { CornerDownLeft, Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { filterByPermission, flatRoutes } from "@/routes/routes";
import useAuthStore from "@/modules/Auth/core/store/AuthStore";
import { cn } from "@/lib/utils";

const fullHref = (href: string) => `/dashboard${href.startsWith("/") ? href : `/${href}`}`.replace(/\/$/, "");

/** Jump to any page by typing its name. Opens with Ctrl/Cmd + K or from the header search button. */
export function CommandPalette() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const permissions = useAuthStore((s) => s.permissions);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const pages = useMemo(
    () =>
      filterByPermission(flatRoutes, permissions)
        .filter((r) => r.isRootRoute && !r.hideInSide)
        .map((r) => ({ route: r, label: t(r.title || ""), group: r.titleOfGroup ? t(r.titleOfGroup) : "" })),
    [permissions, t],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? pages.filter((p) => p.label.toLowerCase().includes(q) || p.group.toLowerCase().includes(q)) : pages;
  }, [pages, query]);

  useEffect(() => setActive(0), [query, open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (i: number) => {
    const target = results[i];
    if (!target) return;
    setOpen(false);
    setQuery("");
    navigate({ to: fullHref(target.route.href) as never });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group hidden h-9 min-w-56 items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground md:flex"
        aria-label={t("search_pages")}
      >
        <Search className="size-4 transition-transform duration-200 group-hover:scale-110" />
        <span className="flex-1 text-start">{t("search_pages")}</span>
        <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-sans text-[10px] font-medium">Ctrl K</kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:hidden"
        aria-label={t("search_pages")}
      >
        <Search className="size-[18px]" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent close={false} className="top-[18%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl">
          <DialogTitle className="sr-only">{t("search_pages")}</DialogTitle>
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="size-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((a) => Math.min(a + 1, results.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((a) => Math.max(a - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  go(active);
                }
              }}
              placeholder={t("search_pages_placeholder")}
              className="h-12 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              aria-label={t("search_pages")}
            />
          </div>
          <ul ref={listRef} role="listbox" className="max-h-[52vh] overflow-y-auto p-2">
            {results.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted-foreground">{t("no_results")}</li>}
            {results.map((p, i) => {
              const Icon = p.route.icon;
              return (
                <li key={p.route.href} role="option" aria-selected={i === active} data-index={i}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm transition-colors",
                      i === active ? "bg-accent text-accent-foreground" : "text-foreground",
                    )}
                  >
                    {Icon && <Icon className="size-[18px] shrink-0 text-muted-foreground" />}
                    <span className="flex-1 truncate">{p.label}</span>
                    {p.group && <span className="text-xs text-muted-foreground">{p.group}</span>}
                    {i === active && <CornerDownLeft className="size-3.5 text-muted-foreground" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
