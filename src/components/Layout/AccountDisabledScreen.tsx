import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccountState } from "@/Api/accountState";
import { getDirection } from "@/Translation/i18n";

/** Refetches what is on screen when the HTTP client says the data is out of date. */
export function StaleDataSync() {
  const qc = useQueryClient();
  const staleTick = useAccountState((s) => s.staleTick);
  const lookupsTick = useAccountState((s) => s.lookupsTick);
  useEffect(() => {
    if (staleTick) qc.invalidateQueries({ refetchType: "active" });
  }, [staleTick, qc]);
  useEffect(() => {
    if (lookupsTick)
      qc.invalidateQueries({ predicate: (q) => q.queryKey.some((k) => typeof k === "string" && /countr|currenc|lookup/i.test(k)) });
  }, [lookupsTick, qc]);
  return null;
}

/**
 * The account or its whole tenant was switched off. An expired subscription does this too, so the wording points to
 * Shoof rather than suggesting a ban (spec README §2.1).
 */
export function AccountDisabledScreen() {
  const { t } = useTranslation();
  const message = useAccountState((s) => s.disabled);
  const setDisabled = useAccountState((s) => s.setDisabled);
  if (!message) return null;
  const tenant = /tenant/i.test(message);
  return (
    <div dir={getDirection()} role="alertdialog" aria-modal="true" aria-labelledby="disabled-title" className="fixed inset-0 z-[1000000000] grid place-items-center bg-background/95 p-6 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="max-w-md space-y-4 rounded-2xl border border-border bg-card p-8 text-center shadow-card">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-warning/15 text-warning"><LockKeyhole className="size-7" /></span>
        <h1 id="disabled-title" className="font-display text-xl font-semibold text-foreground">{t(tenant ? "tenant_disabled_title" : "user_disabled_title")}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{t(tenant ? "tenant_disabled_body" : "user_disabled_body")}</p>
        <Button type="button" variant="primary" className="w-full" onClick={() => setDisabled(null)}>{t("back_to_sign_in")}</Button>
      </motion.div>
    </div>
  );
}
