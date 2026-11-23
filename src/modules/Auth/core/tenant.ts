/**
 * The restaurant code (slug) is the first label of the host name (`pizzahut.shoof.lambdor.com` -> `pizzahut`, a leading
 * `www` skipped). On localhost, an IP or a preview host there is none: the login screen asks for it, and the code typed
 * there decides which restaurant's API the whole dashboard talks to (`apiBaseUrl`).
 */
export const hostSlug = (): string => {
  const host = window.location.hostname;
  if (/^(\d+\.){3}\d+$/.test(host) || host === "localhost") return "";
  const labels = host.split(".");
  if (labels.length < 3) return "";
  // Deploy previews (netlify.app, vercel.app ...) have no restaurant code in the host name.
  if (/(netlify|vercel|github)\.(app|io)$|pages\.dev$/.test(host)) return "";
  return labels[0] === "www" ? labels[1] : labels[0];
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

/** What the login and forgot-password forms start with: the host's code, the last one used here, or the dev default. */
export const defaultSlug = (): string =>
  hostSlug() || savedSlug() || ((import.meta.env.VITE_DEV_SLUG as string | undefined) ?? "").trim();

/** A restaurant code as the backend issues them: lowercase letters, digits and dashes. Anything else never builds a URL. */
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/**
 * Where the Restaurant API is for a restaurant code:
 * - an absolute `VITE_BASE_URL` always wins (a fixed server, e.g. a local backend);
 * - on a restaurant's own subdomain (deployed), the API is on the same origin: `/backend/api/`;
 * - elsewhere (localhost, previews) with `VITE_API_BASE_DOMAIN` set: `https://{code}.{domain}/backend/api/`, so the code
 *   typed at login picks the server. The domain is fixed by config and the code is validated, so the token can only
 *   ever go to one of the platform's own restaurant hosts;
 * - otherwise the relative path, which the dev server proxies (`VITE_DEV_API_ORIGIN`).
 */
export const apiBaseUrl = (slug?: string): string => {
  const configured = (import.meta.env.VITE_BASE_URL as string | undefined) || "/backend/api/";
  if (/^https?:\/\//i.test(configured) || hostSlug()) return configured;
  const domain = ((import.meta.env.VITE_API_BASE_DOMAIN as string | undefined) ?? "").trim().replace(/^\.+|\/+$/g, "");
  const code = (slug ?? savedSlug()).trim().toLowerCase();
  if (domain && SLUG_RE.test(code)) return `https://${code}.${domain}/backend/api/`;
  return configured;
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
