import { create } from "zustand";
import { getAuth, removeAuth, setAuth } from "@/modules/Auth/core/utils/AuthHelpers";
import { GetMeApi, LogoutApi, normalizeSession } from "@/modules/Auth/core/api/api-auth";
import type { IProfile, ITokenReply } from "@/modules/Auth/core/types";
import { normalizePermissions, permissionsFromToken } from "@/modules/Auth/core/permissions";
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
  permissionsIsFetching: false,

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
    let profileExtra: { permissions?: unknown } | undefined;
    try {
      const me = await GetMeApi();
      profileExtra = me as { permissions?: unknown };
      const latest = get().auth;
      if (latest) get().saveAuth({ ...latest, user: { ...latest.user, ...me } });
    } catch {
      /* 401 is handled by the client (refresh or logout); other errors keep the stored profile */
    }
    try {
      // The JWT or the profile may carry the permissions outright; otherwise they come from the user's roles.
      const carried = permissionsFromToken(get().auth?.token) ?? normalizePermissions(profileExtra?.permissions);
      set({ permissions: carried ?? (await resolvePermissions(get().auth?.roles ?? [])) });
    } catch {
      // Roles could not be read (e.g. no `Roles.View`): show everything and let the server's 403 decide.
      set({ permissions: [ALL_PERMISSIONS] });
    } finally {
      set({ permissionsIsFetching: false });
    }
  },
}));

export default useAuthStore;
