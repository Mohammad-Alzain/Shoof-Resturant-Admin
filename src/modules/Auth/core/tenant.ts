/**
 * The restaurant code (slug) is the first label of the host name (`pizzahut.shoof.lambdor.com` -> `pizzahut`, a leading
 * `www` skipped). On localhost, an IP or a preview host there is none, so the login screen asks for it.
 */
export const hostSlug = (): string => {
  const dev = (import.meta.env.VITE_DEV_SLUG as string | undefined)?.trim();
  const host = window.location.hostname;
  if (/^(\d+\.){3}\d+$/.test(host) || host === "localhost") return dev ?? "";
  const labels = host.split(".");
  if (labels.length < 3) return dev ?? "";
  const slug = labels[0] === "www" ? labels[1] : labels[0];
  // Deploy previews (netlify.app, vercel.app ...) have no restaurant code in the host name.
  return /(netlify|vercel|github)\.(app|io)$|pages\.dev$/.test(host) ? (dev ?? "") : slug;
};

const SLUG_KEY = "shoof-restaurant-slug";
export const savedSlug = (): string => {
  try {
    return localStorage.getItem(SLUG_KEY) ?? "";
  } catch {
    return "";
  }
};
export const saveSlug = (slug: string) => {
  try {
    localStorage.setItem(SLUG_KEY, slug);
  } catch {
    /* private mode */
  }
};

/** `tenant_id` claim of an access token: sent back as X-Tenant-Id on every call. */
export const tenantIdFromToken = (token?: string): string | undefined => {
  if (!token) return undefined;
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(decodeURIComponent(atob(part).split("").map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")));
    return json.tenant_id ?? json.tenantId;
  } catch {
    return undefined;
  }
};
