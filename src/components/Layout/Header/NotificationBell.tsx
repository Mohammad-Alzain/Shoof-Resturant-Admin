import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useMarkAllRead, useUnreadCount, type NotificationFilter } from "@/modules/Notifications/core/hooks";
import { useNotificationsRealtime } from "@/modules/Notifications/core/realtime";
import { NotificationList } from "@/modules/Notifications/ui/components/NotificationList";

/** Header bell: unread badge (kept fresh by SignalR) and a dropdown with an infinitely scrolling list. */
export function NotificationBell() {
  const { t } = useTranslation();
  useNotificationsRealtime();
  const { data: unread = 0 } = useUnreadCount();
  const readAll = useMarkAllRead();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>("all");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={unread ? `${t("notifications")} (${unread})` : t("notifications")}>
          <Bell />
          {unread > 0 && (
            <span className="absolute -end-0.5 -top-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-terracotta px-1 text-[10px] font-semibold leading-4.5 text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-1.5rem))] p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border p-3">
          <div role="tablist" className="flex rounded-lg border border-border p-0.5">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={cn("rounded-md px-3 py-1 text-xs", filter === f ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground")}
              >
                {t(`filter_${f}`)}
              </button>
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" disabled={!unread || readAll.isPending} onClick={() => readAll.mutate()}>
            <CheckCheck className="size-4" />
            {t("mark_all_read")}
          </Button>
        </div>
        <NotificationList filter={filter} onOpen={() => setOpen(false)} className="max-h-[22rem]" />
        <div className="border-t border-border p-2 text-center">
          <Link to="/dashboard/notifications" onClick={() => setOpen(false)} className="text-xs font-medium text-primary hover:underline">
            {t("view_all")}
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
