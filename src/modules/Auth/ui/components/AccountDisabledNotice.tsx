import { useTranslation } from "react-i18next";
import { LockKeyhole, X } from "lucide-react";
import { useAccountState } from "@/Api/accountState";

/**
 * Shown on the sign-in page after the account or its whole tenant was switched off mid-session ("User/Tenant is
 * inactive."). An expired subscription does this too, so the wording points to Shoof rather than suggesting a ban.
 * Signing in again clears it.
 */
export function AccountDisabledNotice() {
  const { t } = useTranslation();
  const message = useAccountState((s) => s.disabled);
  const setDisabled = useAccountState((s) => s.setDisabled);
  if (!message) return null;
  const tenant = /tenant/i.test(message);
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-warning/20 text-warning"><LockKeyhole className="size-4" /></span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-semibold text-foreground">{t(tenant ? "tenant_disabled_title" : "user_disabled_title")}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{t(tenant ? "tenant_disabled_body" : "user_disabled_body")}</p>
      </div>
      <button type="button" onClick={() => setDisabled(null)} aria-label={t("close")} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
        <X className="size-4" />
      </button>
    </div>
  );
}
