import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAccountState } from "@/Api/accountState";

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
