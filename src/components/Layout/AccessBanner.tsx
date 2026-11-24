import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LockKeyhole, X } from "lucide-react";
import { accessBlocked, useAccessStore } from "@/Api/access";
import useAuthStore from "@/modules/Auth/core/store/AuthStore";
import { myRoles } from "@/modules/Auth/core/permissions";

/** Shown when the account is refused across the board (or the plan / IP blocks it), and says which cause applies. */
export default function AccessBanner() {
  const { t } = useTranslation();
  const { code, text, count, ok, dismissed, dismiss } = useAccessStore();
  const auth = useAuthStore((s) => s.auth);
  // From the login reply or the signed token (the server checks the token's role claims).
  const roles = myRoles(auth);
  if (dismissed || !accessBlocked({ code, count, ok })) return null;

  const known = ["SubscriptionExpired", "IpNotAllowed", "InvalidApiKey"].includes(code);
  const title = known ? t(`access_${code}`) : text || t("access_denied_title");
  return (
    <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm">
      <LockKeyhole className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="font-medium text-foreground">{title}</p>
        {!known && (
          <>
            {roles.length === 0 ? (
              // No role at all: the server can only refuse. The account isn't linked to a role (a backend matter).
              <p className="text-muted-foreground">{t("access_no_roles")}</p>
            ) : (
              <p className="text-muted-foreground">
                {t("access_denied_body")} <span className="font-medium text-foreground">({roles.join("، ")})</span>
              </p>
            )}
            <ul className="list-disc space-y-0.5 ps-5 text-muted-foreground">
              {/* The Owner holds every permission, so a blanket refusal points at the app key, not at a role. */}
              {roles.some((r) => r.toLowerCase() === "owner") ? (
                <li>{t("access_hint_key")}</li>
              ) : (
                <li>{t("access_hint_role")} <Link to="/dashboard/team/roles" className="font-medium text-primary underline-offset-2 hover:underline">{t("team_roles")}</Link></li>
              )}
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
