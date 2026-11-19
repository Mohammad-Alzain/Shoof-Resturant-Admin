import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMarkAllRead, type NotificationFilter } from "../../core/hooks";
import { NotificationList } from "../components/NotificationList";

export default function NotificationsPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const readAll = useMarkAllRead();

  return (
    <section className="max-w-3xl space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold tracking-tight">{t("notifications")}</h1>
        <div className="flex items-center gap-2">
          <div role="tablist" className="flex rounded-lg border border-border p-0.5">
            {(["all", "unread", "read"] as const).map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={cn("rounded-md px-3 py-1 text-sm", filter === f ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground")}
              >
                {t(`filter_${f}`)}
              </button>
            ))}
          </div>
          <Button type="button" variant="outline" size="md" disabled={readAll.isPending} onClick={() => readAll.mutate()}>
            <CheckCheck />
            {t("mark_all_read")}
          </Button>
        </div>
      </header>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <NotificationList filter={filter} className="max-h-[calc(100vh-14rem)]" />
      </div>
    </section>
  );
}
