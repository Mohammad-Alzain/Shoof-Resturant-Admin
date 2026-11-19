/**
 * SuperAdmin auth contract (docs/00-common-spec.md §2.1, docs/03-superadmin-console.md §1).
 * Field names follow the ASP.NET API (camelCase). The login/refresh reply is read tolerantly
 * (see `normalizeSession`) because the exact property names are not in the local docs.
 */
export interface IUser {
  id?: number | string;
  name?: string;
  fullName?: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  isActive?: boolean;
}

export interface IPermission {
  resource: string;
  actions: string[];
}

/** What the app keeps in memory + localStorage for the signed-in operator. */
export interface IProfile {
  user: IUser;
  roles: string[];
  permissions: IPermission[];
  token?: string;
  refreshToken?: string;
  /** Set by the server for temporary passwords: only the change-password screen may be used. */
  mustChangePassword?: boolean;
  /** From the JWT: the restaurant account the session belongs to. */
  tenantId?: string;
}

export interface LoginPayload {
  tenantSlug: string;
  email: string;
  password: string;
}
export type AuthPayload = LoginPayload;

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordPayload {
  tenantSlug: string;
  email: string;
}

export interface ResetPasswordPayload {
  tenantSlug: string;
  email: string;
  token: string;
  newPassword: string;
}

/** Raw token reply of login / refresh / change-password. */
export interface ITokenReply {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  mustChangePassword?: boolean;
  user?: IUser;
  roles?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
