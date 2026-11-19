import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LockKeyhole, X } from "lucide-react";
import { useAccessStore } from "@/Api/access";
import useAuthStore from "@/modules/Auth/core/store/AuthStore";

/** Shown once the API refuses calls with 403, and says which of the known causes applies. */
export default function AccessBanner() {
  const { t } = useTranslation();
  const { code, text, count, dismissed, dismiss } = useAccessStore();
  const roles = useAuthStore((s) => s.auth?.roles) ?? [];
  if (!count || dismissed) return null;

  const known = ["SubscriptionExpired", "IpNotAllowed"].includes(code);
  const title = known ? t(`access_${code}`) : text || t("access_denied_title");
  return (
    <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm">
      <LockKeyhole className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="font-medium text-foreground">{title}</p>
        {!known && (
          <>
            <p className="text-muted-foreground">
              {t("access_denied_body")} {roles.length > 0 && <span className="font-medium text-foreground">({roles.join("، ")})</span>}
            </p>
            <ul className="list-disc space-y-0.5 ps-5 text-muted-foreground">
              <li>{t("access_hint_role")} <Link to="/dashboard/team/roles" className="font-medium text-primary underline-offset-2 hover:underline">{t("team_roles")}</Link></li>
              <li>{t("access_hint_key")}</li>
            </ul>
          </>
        )}
      </div>
      <button type="button" onClick={dismiss} aria-label={t("close")} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
        <X className="size-4" />
      </button>
    </div>
  );
}
