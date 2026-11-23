import { create } from "zustand";
import { useAccessStore } from "@/Api/access";
import { getAuth, removeAuth, setAuth } from "@/modules/Auth/core/utils/AuthHelpers";
import { GetMeApi, LogoutApi, normalizeSession } from "@/modules/Auth/core/api/api-auth";
import type { IProfile, ITokenReply } from "@/modules/Auth/core/types";
import { normalizePermissions, permissionsFromToken, rolesFromToken } from "@/modules/Auth/core/permissions";
import { ALL_PERMISSIONS, resolvePermissions } from "@/modules/Team/core/api";

export interface AuthState {
  auth: IProfile | undefined;
  /**
   * Permission strings ("MenuItems.View") derived from the user's roles after login (see `resolvePermissions`).
   * `["*"]` = everything (Owner, or roles unreadable). Empty = nothing granted / not loaded yet.
   */
  permissions: string[];
  permissionsIsFetching: boolean;
  /** Store the tokens of a login / refresh / change-password reply. */
  applySession: (reply: ITokenReply) => void;
  saveAuth: (auth: IProfile | undefined) => void;
  markMustChangePassword: () => void;
  logout: () => void;
  logOutAction: () => Promise<void>;
  /** Load the operator profile (GET account/me). Safe to call when signed out. */
  fetchProfile: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set, get) => ({
  auth: getAuth(),
  permissions: [],
  // With a stored session the menu is withheld until permissions are resolved again: they are never stored.
  permissionsIsFetching: Boolean(getAuth()?.token),

  saveAuth: (auth) => {
    if (auth) setAuth(auth);
    else removeAuth();
    set({ auth });
  },

  applySession: (reply) => get().saveAuth(normalizeSession(reply, get().auth)),

  markMustChangePassword: () => {
    const current = get().auth;
    if (current && !current.mustChangePassword) get().saveAuth({ ...current, mustChangePassword: true });
  },

  logout: () => {
    useAccessStore.getState().reset();
    set({ permissions: [] });
    get().saveAuth(undefined);
  },

  logOutAction: async () => {
    const refreshToken = get().auth?.refreshToken;
    try {
      // Logout = revoke the refresh token. Failing (offline, already expired) must not trap the user.
      if (refreshToken) await LogoutApi(refreshToken);
    } catch {
      /* local sign-out below is what matters */
    } finally {
      get().logout();
    }
  },

  fetchProfile: async () => {
    const current = get().auth;
    if (!current?.token) return;
    set({ permissionsIsFetching: true });
    let profileExtra: { permissions?: unknown; id?: string | number } | undefined;
    try {
      const me = await GetMeApi();
      profileExtra = me as { permissions?: unknown; id?: string | number };
      const latest = get().auth;
      if (latest) get().saveAuth({ ...latest, user: { ...latest.user, ...me } });
    } catch {
      /* 401 is handled by the client (refresh or logout); other errors keep the stored profile */
    }
    try {
      // The reply, the JWT or the profile may carry the permissions outright; otherwise they come from the user's roles.
      // There is no "my permissions" endpoint (docs 00 §2.2): a user without `Roles.View` falls to the catch below.
      const token = get().auth?.token;
      const carried = normalizePermissions(get().auth?.permissions) ?? permissionsFromToken(token) ?? normalizePermissions(profileExtra?.permissions);
      // Roles come from this session's login reply, or from the signed token after a reload (never from storage).
      const roles = get().auth?.roles?.length ? get().auth!.roles : rolesFromToken(token);
      const resolved = carried ?? (await resolvePermissions(roles));
      set({ permissions: Object.freeze([...resolved]) as string[] });
    } catch {
      // Roles could not be read (e.g. no `Roles.View`): show everything and let the server's 403 decide.
      set({ permissions: Object.freeze([ALL_PERMISSIONS]) as string[] });
    } finally {
      set({ permissionsIsFetching: false });
    }
  },
}));

export default useAuthStore;
