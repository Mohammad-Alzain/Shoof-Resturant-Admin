/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAccountState } from "./accountState";
import { apiBaseUrl, tokenTimes } from "@/modules/Auth/core/tenant";
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

/** The Restaurant API for the signed-in restaurant: same origin when deployed, else the host of the code typed at login. */
export const getBaseUrl = () => apiBaseUrl();
const appKey = () => (import.meta.env.VITE_APP_API_KEY as string | undefined) ?? "";
export const getBaseUrlNoAdmin = () => import.meta.env.VITE_BASE_URL_PUBLIC || "http://localhost:3000";
export const getBaseUrlDomain = () => import.meta.env.VITE_BASE_URL_DOMAIN_PUBLIC || "http://localhost:3000";

export const httpClient = axios.create({
  // no fixed baseURL: it is resolved per request (below), because the restaurant code chosen at login decides it
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
  /** `X-Error-Code` header (e.g. InvalidApiKey, SubscriptionExpired), empty when the server sent none. */
  code?: string;
}

export const parseApiError = (error: unknown): ApiError => {
  const err = error as AxiosError<any>;
  const status = err?.response?.status;
  const data = err?.response?.data;
  const fieldErrors: Record<string, string[]> = {};
  const code = String(err?.response?.headers?.["x-error-code"] ?? "") || undefined;

  if (typeof data === "string") {
    return { status, message: data || undefined, fieldErrors, code };
  }
  if (data && typeof data === "object") {
    for (const [key, value] of Object.entries<any>(data.errors ?? {})) {
      const field = key.charAt(0).toLowerCase() + key.slice(1);
      fieldErrors[field] = Array.isArray(value) ? value : [String(value)];
    }
    const first = Object.values(fieldErrors)[0]?.[0];
    return { status, message: first ?? data.detail ?? data.title ?? data.message, fieldErrors, code };
  }
  return { status, fieldErrors, code };
};

/** Calls made before there is a session (or to end it): they never wait for, or trigger, a refresh. */
const SESSIONLESS = /^\/?(auth\/|account\/(forgot|reset)-password)/i;
/** A token this close to its expiry is renewed before the call, so the server never sees an expired one. */
const RENEW_BEFORE_MS = 15_000;
/** A 403 right after a token was issued is a real refusal, not an expired token: no refresh for it. */
const FRESH_MS = 30_000;

httpClient.interceptors.request.use(async (config) => {
  // The bearer token must only ever reach our API: refuse absolute URLs and path-traversal in request paths.
  if (config.url && isUnsafeApiPath(config.url)) throw new axios.CanceledError("Blocked unsafe request path");
  // Login / forgot / reset pass the base of the restaurant being signed in to; everything else follows the saved code.
  if (!config.baseURL) config.baseURL = getBaseUrl();

  // An expired access token can be answered with 403 (not 401), so waiting for a 401 never renews it. Renew it first;
  // concurrent calls share one refresh. If the server rejects the refresh token the session is over: sign out.
  if (!config.skipAuthRefresh && !SESSIONLESS.test(config.url ?? "")) {
    const auth = useAuthStore.getState().auth;
    const { exp } = tokenTimes(auth?.token);
    if (auth?.token && auth.refreshToken && exp && exp * 1000 - Date.now() < RENEW_BEFORE_MS) {
      const fresh = await refreshSession();
      if (!fresh && refreshRejected) {
        endSession();
        throw new axios.CanceledError("Session expired");
      }
    }
  }
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
/** When the last refresh succeeded, and whether the last one was refused by the server (as opposed to the network failing). */
let lastRefreshAt = 0;
let refreshRejected = false;

/** The refresh token is no longer good (revoked, expired, reused): the session is over, back to the sign-in page. */
const endSession = () => {
  if (!useAuthStore.getState().auth) return;
  toast.info(i18n.t("session_expired"));
  useAuthStore.getState().logout();
};

const refreshSession = (): Promise<string | null> => {
  refreshing ??= (async () => {
    const { auth, applySession } = useAuthStore.getState();
    refreshRejected = false;
    if (!auth?.refreshToken) {
      refreshRejected = true;
      return null;
    }
    try {
      // Tokens rotate: always store the new pair.
      const reply: any = await axios.post(
        `${getBaseUrl().replace(/\/?$/, "/")}auth/refresh`,
        { refreshToken: auth.refreshToken },
        { headers: { "X-Language": getLanguage(), "X-Api-Key": appKey(), ...(auth.tenantId ? { "X-Tenant-Id": auth.tenantId } : {}) } },
      );
      applySession(reply.data);
      lastRefreshAt = Date.now();
      return useAuthStore.getState().auth?.token ?? null;
    } catch (e) {
      // A 4xx answer means the refresh token is dead; a network failure or a 5xx says nothing about the session.
      const status = (e as AxiosError)?.response?.status;
      refreshRejected = !!status && status >= 400 && status < 500;
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
};

let lastDenied = 0;
const text = (value: unknown) => (typeof value === "string" ? value : "");

/** Sign-in and the profile answer even with a wrong app key, so they never prove that the account works. */
const PROVES_NOTHING = /^\/?(auth|account)\//i;

httpClient.interceptors.response.use(
  (response) => {
    const access = useAccessStore.getState();
    if (access.ok === 0 && !PROVES_NOTHING.test(response.config?.url ?? "")) access.succeed();
    return response.data;
  },
  async (error: AxiosError<any>) => {
    const config = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;
    const body = text(error.response?.data);

    // A wrong app key (VITE_APP_API_KEY) is refused before anyone is authenticated, sign-in included. It is not an expired
    // session: refreshing or signing out would not help, so say what is wrong and let the sign-in page show it.
    if ((status === 401 || status === 403) && String(error.response?.headers?.["x-error-code"] ?? "") === "InvalidApiKey") {
      useAccessStore.getState().record("InvalidApiKey", body);
      return Promise.reject(error);
    }

    // A call that went out with a token the session has since replaced (it was in flight while another call renewed it)
    // just goes again with the current one: no second refresh.
    const sentWith = String(config?.headers?.get?.("Authorization") ?? "");
    const current = useAuthStore.getState().auth?.token;
    if ((status === 401 || (status === 403 && !String(error.response?.headers?.["x-error-code"] ?? ""))) && config && !config.skipAuthRefresh && !config._retried && !SESSIONLESS.test(config.url ?? "") && sentWith && current && sentWith !== `Bearer ${current}`) {
      config._retried = true;
      config.headers.set("Authorization", `Bearer ${current}`);
      return httpClient(config);
    }

    if (status === 401 && config && !config.skipAuthRefresh && !config._retried) {
      config._retried = true;
      const token = await refreshSession();
      if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
        return httpClient(config);
      }
      endSession();
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

    // A plain 403 (no error code) can also mean the access token went stale without the server saying 401. Try one refresh
    // when the token is not brand new; if the refresh token is refused, the session is over. A genuine refusal (a missing
    // permission) comes back again after the refresh and is handled below as usual.
    if (status === 403 && config && !config.skipAuthRefresh && !config._retried && !String(error.response?.headers?.["x-error-code"] ?? "") && !SESSIONLESS.test(config.url ?? "")) {
      const auth = useAuthStore.getState().auth;
      const issued = Math.max((tokenTimes(auth?.token).iat ?? 0) * 1000, lastRefreshAt);
      if (auth?.refreshToken && Date.now() - issued > FRESH_MS) {
        config._retried = true;
        const token = await refreshSession();
        if (token) {
          config.headers.set("Authorization", `Bearer ${token}`);
          return httpClient(config);
        }
        if (refreshRejected) {
          endSession();
          return Promise.reject(error);
        }
      }
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
