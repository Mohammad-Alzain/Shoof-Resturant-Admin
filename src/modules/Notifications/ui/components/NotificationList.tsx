import { Megaphone } from "lucide-react";
import { getDirection } from "@/Translation/i18n";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Bell, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useMarkRead, useNotificationsInfinite, type NotificationFilter } from "../../core/hooks";
import { NOTIFICATION_TYPE_KEYS, notificationTarget, type INotification } from "../../core/api";

/** A notification's time in the interface language (dates arrive already in the restaurant's local time, docs 00 §2.6). */
const when = (iso: string, lang: string) => new Date(iso).toLocaleString(lang, { dateStyle: "medium", timeStyle: "short" });

/** Announcements from Shoof (type 4) are plain text: read in full here (spec 01 §17). */
const AnnouncementDialog = NiceModal.create(({ n }: { n: INotification }) => {
  const modal = useModal();
  const { t, i18n } = useTranslation();
  return (
    <Dialog open={modal.visible} onOpenChange={(o) => !o && modal.hide()}>
      <DialogContent dir={getDirection()} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Megaphone className="size-4 text-terracotta" />{n.title}</DialogTitle>
          <DialogDescription>{t("notif_announcement")} · {when(n.creationDateTime, i18n.language)}</DialogDescription>
        </DialogHeader>
        <p className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground">{n.body}</p>
      </DialogContent>
    </Dialog>
  );
});

/** Notifications with infinite scroll: a sentinel at the end loads the next page when it scrolls into view. */
export function NotificationList({ filter, onOpen, className }: { filter: NotificationFilter; onOpen?: () => void; className?: string }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const read = useMarkRead();
  const query = useNotificationsInfinite(filter);
  const root = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { root: root.current, rootMargin: "80px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, query.data]);

  const items = query.data?.pages.flatMap((p) => p.data) ?? [];

  const open = async (n: INotification) => {
    if (!n.isRead) await read.mutateAsync(n.id).catch(() => undefined);
    if (n.type === 4) {
      onOpen?.();
      NiceModal.show(AnnouncementDialog, { n });
      return;
    }
    const target = notificationTarget(n);
    if (target) navigate({ to: target as never });
    onOpen?.();
  };

  return (
    <div ref={root} className={cn("overflow-y-auto", className)}>
      {query.isLoading ? (
        <div className="space-y-3 p-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : !items.length ? (
        <div className="flex flex-col items-center gap-2 p-10 text-muted-foreground">
          <Bell className="size-8 opacity-40" />
          <p className="text-sm">{t("no_notifications")}</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => open(n)}
                className={cn("flex w-full items-start gap-3 p-3.5 text-start transition-colors hover:bg-muted/60", !n.isRead && "bg-accent/40")}
              >
                <span aria-hidden className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.isRead ? "bg-transparent" : "bg-terracotta")} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{n.title}</span>
                  {n.body && <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{n.body}</span>}
                  <span className="mt-1 block text-[0.6875rem] text-muted-foreground">
                    {t(NOTIFICATION_TYPE_KEYS[n.type] ?? "notif_generic")} · {when(n.creationDateTime, i18n.language)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div ref={sentinel} className="flex h-10 items-center justify-center">
        {isFetchingNextPage && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      </div>
    </div>
  );
}
