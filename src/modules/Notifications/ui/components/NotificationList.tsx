import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Bell, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useMarkRead, useNotificationsInfinite, type NotificationFilter } from "../../core/hooks";
import { NOTIFICATION_TYPE_KEYS, notificationTarget, type INotification } from "../../core/api";

/** Notifications with infinite scroll: a sentinel at the end loads the next page when it scrolls into view. */
export function NotificationList({ filter, onOpen, className }: { filter: NotificationFilter; onOpen?: () => void; className?: string }) {
  const { t } = useTranslation();
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
    const target = notificationTarget(n);
    if (target) navigate({ to: target });
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
                    {t(NOTIFICATION_TYPE_KEYS[n.type] ?? "notif_generic")} · {new Date(n.creationDateTime).toLocaleString()}
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
