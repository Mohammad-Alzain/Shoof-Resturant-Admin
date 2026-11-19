/* eslint-disable @typescript-eslint/no-explicit-any */

import { IProfile } from "../types";

const AUTH_LOCAL_STORAGE_KEY = "auth-shoof-restaurant";

const getAuth = (): IProfile | undefined => {
  if (!localStorage) {
    return;
  }

  const lsValue: string | null = localStorage.getItem(AUTH_LOCAL_STORAGE_KEY);
  if (!lsValue) {
    return;
  }

  try {
    const auth: IProfile = JSON.parse(lsValue) as IProfile;
    if (auth) {
      // What the user may do is never read back from here: anyone can edit local storage. It is re-resolved from the
      // signed token and the API on every load (see AuthStore.fetchProfile).
      return { ...auth, permissions: null, roles: [] };
    }
  } catch (error) {
    console.error("AUTH LOCAL STORAGE PARSE ERROR", error);
  }
};

const setAuth = (auth: IProfile | undefined) => {
  if (!localStorage) {
    return;
  }

  try {
    // Permissions and roles stay in memory only (see getAuth).
    const persisted: Partial<IProfile> = { ...auth };
    delete persisted.permissions;
    delete persisted.roles;
    const lsValue = JSON.stringify(persisted);
    localStorage.setItem(AUTH_LOCAL_STORAGE_KEY, lsValue);
  } catch (error) {
    console.error("AUTH LOCAL STORAGE SAVE ERROR", error);
  }
};

const removeAuth = () => {
  if (!localStorage) {
    return;
  }

  try {
    localStorage.removeItem(AUTH_LOCAL_STORAGE_KEY);
  } catch (error) {
    console.error("AUTH LOCAL STORAGE REMOVE ERROR", error);
  }
};

export { getAuth, setAuth, removeAuth, AUTH_LOCAL_STORAGE_KEY };
