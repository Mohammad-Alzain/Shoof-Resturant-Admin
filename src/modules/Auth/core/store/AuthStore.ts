import { create } from "zustand";
import { getAuth, removeAuth, setAuth } from "@/modules/Auth/core/utils/AuthHelpers";
import { GetMeApi, LogoutApi, normalizeSession } from "@/modules/Auth/core/api/api-auth";
import type { IProfile, ITokenReply } from "@/modules/Auth/core/types";

export interface AuthState {
  auth: IProfile | undefined;
  /**
   * The API has no "my permissions" endpoint yet (docs/00-common-spec.md §2.2), so this stays empty and the
   * UI shows everything, relying on 403 handling. Kept so permission-gated routes can be switched on later.
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

  logout: () => get().saveAuth(undefined),

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
    try {
      const me = await GetMeApi();
      const latest = get().auth;
      if (latest) get().saveAuth({ ...latest, user: { ...latest.user, ...me } });
    } catch {
      /* 401 is handled by the client (refresh or logout); other errors keep the stored profile */
    } finally {
      set({ permissionsIsFetching: false });
    }
  },
}));

export default useAuthStore;
