/** Form value → API value helpers: empty inputs are sent as `null`, never "" or NaN. */
export const numOrNull = (v: unknown): number | null => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const strOrNull = (v: unknown): string | null => {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
};

/** A local `Date`/date-string from a picker → ISO UTC string (request-body dates are UTC, see spec §2.6). */
export const toUtcIso = (v: unknown): string | null => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

/** Ids are GUID strings: empty → `null`, anything else is passed through untouched (never `Number()`). */
export const idOrNull = (v: unknown): string | null => {
  const s = typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "";
  return s === "" ? null : s;
};
