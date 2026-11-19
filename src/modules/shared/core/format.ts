import { formatMoney } from "@/components/common/RecordView";

/** "$49.00" in the record's currency; null / undefined = no price. */
export const money = (n: number | null | undefined, currency: string | null | undefined, lang: string): string =>
  n === null || n === undefined ? "—" : formatMoney(n, currency ?? undefined, lang);

/** 29 Oct 2027 / ٢٩ أكتوبر ٢٠٢٧ in the interface language. */
export const shortDate = (iso: string | null | undefined, lang: string): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(lang, { day: "numeric", month: "short", year: "numeric" });
};

/** "in 3 days" / "منذ ساعتين": the distance between an ISO date and now, in the interface language. */
export const relativeTime = (iso: string | null | undefined, lang: string): string => {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "—";
  const diff = (d - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [u, s] of units) if (Math.abs(diff) >= s) return rtf.format(Math.round(diff / s), u);
  return rtf.format(Math.round(diff), "second");
};

/** Whole days from now until the date (negative when it is past); null for no date. */
export const daysUntil = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const d = new Date(iso).getTime();
  return Number.isNaN(d) ? null : Math.ceil((d - Date.now()) / 86400000);
};
