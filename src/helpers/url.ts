/**
 * Only these schemes may be opened or rendered from data we did not write (API fields, file previews).
 * Blocks `javascript:`, `vbscript:` and `data:text/html` URLs, which would run script in this origin.
 */
export const isSafeUrl = (url: string | null | undefined): url is string => {
  if (!url) return false;
  const u = url.trim();
  if (u.startsWith("/") && !u.startsWith("//")) return true; // same-origin path
  return /^(https?:\/\/|blob:|data:(image|video|audio)\/)/i.test(u);
};

export const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Ids from the address bar are only used in API paths when they are real GUIDs (no path tricks, no injected segments). */
export const isGuid = (v: unknown): v is string => typeof v === "string" && GUID_RE.test(v);

/**
 * True when a request path could leave the API: an absolute or protocol-relative URL (the bearer token would follow it),
 * a backslash, a control character, or a `..` segment (also when percent-encoded, even twice).
 */
export const isUnsafeApiPath = (path: string): boolean => {
  let p = path;
  for (let i = 0; i < 3; i++) {
    try {
      const d = decodeURIComponent(p);
      if (d === p) break;
      p = d;
    } catch {
      return true; // malformed escape
    }
  }
  const t = p.trim();
  const absolute = /^([a-z][a-z0-9+.-]*:)?\/\//i.test(t) || /^[a-z][a-z0-9+.-]*:/i.test(t);
  const traversal = /(^|\/)\.\.?(\/|$|\?)/.test(p) || p.includes("\\");
  const control = [...p].some((c) => c.charCodeAt(0) < 32);
  return absolute || traversal || control;
};

export const safeUrl = (url: string | null | undefined): string => (isSafeUrl(url) ? url.trim() : "");
