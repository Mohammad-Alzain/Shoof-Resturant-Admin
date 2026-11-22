/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAccountState } from "./accountState";
import { useAccessStore } from "./access";
import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import i18n, { getLanguage } from "@/Translation/i18n";
import useAuthStore from "@/modules/Auth/core/store/AuthStore";
import { isUnsafeApiPath } from "@/helpers/url";

declare module "axios" {
  interface AxiosRequestConfig {
    /** Do not try a token refresh when this request answers 401 (login, refresh, revoke). */
    skipAuthRefresh?: boolean;
    /** Do not show the automatic error toast (the caller renders the error itself). */
    silent?: boolean;
  }
}

export const getBaseUrl = () => import.meta.env.VITE_BASE_URL || "/backend/api/";
const appKey = () => (import.meta.env.VITE_APP_API_KEY as string | undefined) ?? "";
export const getBaseUrlNoAdmin = () => import.meta.env.VITE_BASE_URL_PUBLIC || "http://localhost:3000";
export const getBaseUrlDomain = () => import.meta.env.VITE_BASE_URL_DOMAIN_PUBLIC || "http://localhost:3000";

export const httpClient = axios.create({
  baseURL: getBaseUrl(),
  headers: { Accept: "application/json" },
  // Arrays go out as repeated keys (countryIds=1&countryIds=2), which is what ASP.NET model binding reads.
  paramsSerializer: { indexes: null },
});

/** Normalised view of the API's two kinds of 400 (docs/functional-specs/README.md §2.3). */
export interface ApiError {
  status?: number;
  /** Text to show for a business-rule error (already localised by the server). */
  message?: string;
  /** `errors.{Field}[]` from a validation problem, keys lower-cased first letter. */
  fieldErrors: Record<string, string[]>;
}

export const parseApiError = (error: unknown): ApiError => {
  const err = error as AxiosError<any>;
  const status = err?.response?.status;
  const data = err?.response?.data;
  const fieldErrors: Record<string, string[]> = {};

  if (typeof data === "string") {
    return { status, message: data || undefined, fieldErrors };
  }
  if (data && typeof data === "object") {
    for (const [key, value] of Object.entries<any>(data.errors ?? {})) {
      const field = key.charAt(0).toLowerCase() + key.slice(1);
      fieldErrors[field] = Array.isArray(value) ? value : [String(value)];
    }
    const first = Object.values(fieldErrors)[0]?.[0];
    return { status, message: first ?? data.detail ?? data.title ?? data.message, fieldErrors };
  }
  return { status, fieldErrors };
};

httpClient.interceptors.request.use((config) => {
  // The bearer token must only ever reach our API: refuse absolute URLs and path-traversal in request paths.
  if (config.url && isUnsafeApiPath(config.url)) throw new axios.CanceledError("Blocked unsafe request path");
  const token = useAuthStore.getState().auth?.token;
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  // Read per request so a language switch applies without rebuilding the client.
  if (!config.headers.has("X-Language")) config.headers.set("X-Language", getLanguage());
  // The Restaurant API needs its client key and the account id from the JWT on every call.
  if (appKey()) config.headers.set("X-Api-Key", appKey());
  const tenantId = useAuthStore.getState().auth?.tenantId;
  if (tenantId) config.headers.set("X-Tenant-Id", tenantId);
  return config;
});

/* ---------- silent refresh: one refresh at a time, requests wait for it ---------- */

let refreshing: Promise<string | null> | null = null;

const refreshSession = (): Promise<string | null> => {
  refreshing ??= (async () => {
    const { auth, applySession } = useAuthStore.getState();
    if (!auth?.refreshToken) return null;
    try {
      // Tokens rotate: always store the new pair.
      const reply: any = await axios.post(
        `${getBaseUrl().replace(/\/?$/, "/")}auth/refresh`,
        { refreshToken: auth.refreshToken },
        { headers: { "X-Language": getLanguage(), "X-Api-Key": appKey(), ...(auth.tenantId ? { "X-Tenant-Id": auth.tenantId } : {}) } },
      );
      applySession(reply.data);
      return useAuthStore.getState().auth?.token ?? null;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
};

let lastDenied = 0;
const text = (value: unknown) => (typeof value === "string" ? value : "");

httpClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError<any>) => {
    const config = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;
    const body = text(error.response?.data);

    if (status === 401 && config && !config.skipAuthRefresh && !config._retried) {
      config._retried = true;
      const token = await refreshSession();
      if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
        return httpClient(config);
      }
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    if (status === 403 && /password change required/i.test(body)) {
      useAuthStore.getState().markMustChangePassword();
      return Promise.reject(error);
    }
    if (status === 403 && /(tenant|user) is inactive/i.test(body)) {
      // A blocking screen, not a toast: nothing works until someone switches the account back on.
      useAccountState.getState().setDisabled(body);
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    if (!config?.silent && !axios.isCancel(error)) {
      const { message } = parseApiError(error);
      if (status === 429) toast.error(i18n.t("too_many_requests"));
      else if (status === 403) {
        const code = String(error.response?.headers?.["x-error-code"] ?? "");
        useAccessStore.getState().record(code, body);
        // Everything is refused at once when the role is empty: one toast, not one per request.
        if (Date.now() - lastDenied > 5000) toast.error(code ? i18n.t(`access_${code}`, { defaultValue: body || i18n.t("no_permission") }) : i18n.t("no_permission"));
        lastDenied = Date.now();
      }
      else if (status === 404) {
        // 404 bodies may be text, JSON or empty (guide §3.2): branch on the status only.
        toast.error(i18n.t("item_not_found"));
      }
      else if (status && status >= 500) {
        toast.error(i18n.t("unexpected_error"));
        // Some by-id endpoints answer 500 for a row someone else deleted (guide §3.5). After a failed change to such a
        // row, refresh the lists on screen. (Never after a GET: the refetch would fail again and loop.)
        const method = (config?.method ?? "get").toLowerCase();
        if (method !== "get" && /\/[0-9a-f]{8}-[0-9a-f]{4}-/i.test(config?.url ?? "")) useAccountState.getState().markStale();
      }
      else if (status === 400) {
        // Validation errors are recognised by their `errors` object, whatever the Content-Type (application/json or
        // problem+json): the form shows them per field. Anything else is a business rule: show its text as-is.
        const validation = !!error.response?.data && typeof error.response.data === "object" && "errors" in error.response.data;
        if (!validation && message) toast.error(message);
        // A deleted or unknown country/currency: reload the pickers (spec README, Release 2).
        if (/(country|currency|البلد|الدولة|العملة)/i.test(message ?? "") && /(deleted|doesn.t exist|محذوف|غير موجود)/i.test(message ?? "")) useAccountState.getState().markLookupsStale();
      }
    }
    return Promise.reject(error);
  },
);

/**
 * Typed wrapper: the response interceptor already unwraps `response.data`, so these resolve to the body
 * (axios' own typings still describe a full AxiosResponse).
 */
export const http = {
  get: <T>(url: string, config?: AxiosRequestConfig) => httpClient.get(url, config) as unknown as Promise<T>,
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    httpClient.post(url, body, config) as unknown as Promise<T>,
  put: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    httpClient.put(url, body, config) as unknown as Promise<T>,
  delete: <T = void>(url: string, config?: AxiosRequestConfig) =>
    httpClient.delete(url, config) as unknown as Promise<T>,
};
