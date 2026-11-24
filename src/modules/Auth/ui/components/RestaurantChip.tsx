import { Store } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Which restaurant this sign-in is for, when the link or the host already said so: the code is not asked for. Someone who
 * opened the wrong link can still change it (`onChange` is given only when the code came from a link, never from the host).
 */
export function RestaurantChip({ code, onChange }: { code: string; onChange?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Store className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-muted-foreground">{t("signin_for_restaurant")}</span>
        <bdi dir="ltr" className="block truncate font-semibold text-foreground">{code}</bdi>
      </span>
      {onChange && (
        <button type="button" onClick={onChange} className="shrink-0 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {t("change_restaurant")}
        </button>
      )}
    </div>
  );
}
