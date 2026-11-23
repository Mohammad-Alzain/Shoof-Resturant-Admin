import { normalizePermissions, permissionsFromToken } from "../permissions";
import { httpClient } from "@/Api/httpClient";
import { apiBaseUrl, tenantIdFromToken } from "../tenant";
import type {
  ChangePasswordPayload,
  ForgotPasswordPayload,
  IProfile,
  ITokenReply,
  IUser,
  LoginPayload,
  ResetPasswordPayload,
} from "../types";

const URLs = {
  login: "auth/login",
  refresh: "auth/refresh",
  revoke: "auth/revoke",
  me: "account/me",
  changePassword: "account/change-password",
  forgotPassword: "account/forgot-password",
  resetPassword: "account/reset-password",
};

/**
 * Turns a token reply into the session we store. Accepts `accessToken` or `token`
 * and an optional embedded user, so a small naming difference in the API does not break login.
 */
export const normalizeSession = (reply: ITokenReply, previous?: IProfile): IProfile => {
  const token = reply.accessToken ?? reply.token ?? previous?.token;
  return {
    user: reply.user ?? { ...(previous?.user ?? { email: "" }), ...(reply.fullName ? { fullName: reply.fullName, name: reply.fullName, id: reply.userId } : {}) },
    roles: reply.roles ?? previous?.roles ?? [],
    // The reply or the JWT may carry them; otherwise fetchProfile asks the API. Never stored: a reload resolves them again.
    permissions: normalizePermissions(reply.permissions) ?? permissionsFromToken(token) ?? previous?.permissions ?? null,
    token,
    refreshToken: reply.refreshToken ?? previous?.refreshToken,
    mustChangePassword: Boolean(reply.mustChangePassword),
    tenantId: tenantIdFromToken(token) ?? previous?.tenantId,
  };
};

/** Signing in talks to the restaurant whose code was typed (not yet saved): its host is the API from then on. */
export const SignInApi = (body: LoginPayload): Promise<ITokenReply> =>
  httpClient.post(URLs.login, body, { baseURL: apiBaseUrl(body.tenantSlug) });

export const RefreshApi = (refreshToken: string): Promise<ITokenReply> =>
  httpClient.post(URLs.refresh, { refreshToken }, { skipAuthRefresh: true });

export const LogoutApi = (refreshToken?: string): Promise<void> =>
  httpClient.post(URLs.revoke, { refreshToken }, { skipAuthRefresh: true });

export const GetMeApi = (): Promise<IUser> => httpClient.get(URLs.me);

export const UpdateMeApi = (body: Partial<IUser>): Promise<IUser> => httpClient.put(URLs.me, body);

export const ChangePasswordApi = (body: ChangePasswordPayload): Promise<ITokenReply> =>
  httpClient.post(URLs.changePassword, body);

/** Always answers 204: never reveal whether the account exists. */
export const ForgotPasswordApi = (body: ForgotPasswordPayload): Promise<void> =>
  httpClient.post(URLs.forgotPassword, body, { baseURL: apiBaseUrl(body.tenantSlug) });

export const ResetPasswordApi = (body: ResetPasswordPayload): Promise<void> =>
  httpClient.post(URLs.resetPassword, body, { baseURL: apiBaseUrl(body.tenantSlug) });
