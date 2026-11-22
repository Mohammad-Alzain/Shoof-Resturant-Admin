import { createCrudApi } from "@/Api/crud";
import { http } from "@/Api/httpClient";
import type { IPagedResponse } from "@/Api/types";

export interface IAdminUser {
  id: string;
  tenantId: string;
  fullName: string;
  email?: string | null;
  phoneNumber?: string | null;
  isActive: boolean;
  roles: string[];
  /** The admin created with the restaurant (Release 2): can't be deleted, deactivated or lose the Owner role. */
  isPrimary?: boolean;
}
export const usersApi = createCrudApi<
  IAdminUser,
  { fullName: string; email: string; phoneNumber?: string | null; password: string; roles: string[] },
  { fullName: string; phoneNumber?: string | null; isActive: boolean; roles: string[] }
>("admin-users", "admin-users");

export interface IRole {
  id: string;
  name: string;
  description?: string | null;
  permissions?: string[];
  /** The auto-created Owner role: name, description and existing permissions are locked; it can only gain permissions. */
  isOwner?: boolean;
}
export const rolesApi = createCrudApi<IRole, { name: string; description?: string | null; permissions: string[] }, { name: string; description?: string | null; permissions: string[] }>("roles", "roles");

export interface PermissionGroup {
  group: string;
  permissions: string[];
}
export const getPermissionCatalogue = (): Promise<PermissionGroup[]> => http.get("roles/permissions");
export const getRole = (id: string): Promise<IRole> => http.get(`roles/${id}`);

/** Means "everything": the Owner role, or a session whose permissions could not be read (the server still decides). */
export const ALL_PERMISSIONS = "*";

/**
 * The API has no "my permissions" endpoint (docs/README.md §2.2), so they are derived from the role names the login
 * returns (spec 01 §15): `GET roles` finds the user's roles, `GET roles/{id}` gives each one's permission list, and the
 * union is what the user may do. This runs for the Owner too, so the menu always matches what the server actually
 * grants. Only when the roles can't be read (no `Roles.View`, or an error) does the Owner role still mean everything;
 * any other user then falls to the caller, which shows everything and lets the server's 403 decide.
 * `silent` keeps a refused lookup quiet.
 */
export const resolvePermissions = async (roleNames: string[]): Promise<string[]> => {
  if (!roleNames.length) return [];
  const isOwner = roleNames.some((n) => n.toLowerCase() === "owner");
  try {
    const wanted = new Set(roleNames.map((n) => n.toLowerCase()));
    const list = await http.get<IPagedResponse<IRole>>("roles", { params: { page: 1, pageSize: 100 }, silent: true });
    const mine = (list.data ?? []).filter((r) => wanted.has(r.name.toLowerCase()));
    // the roles named in the session are not in the list (renamed or deleted since sign-in): nothing reliable to filter by
    if (!mine.length) return isOwner ? [ALL_PERMISSIONS] : [];
    const full = await Promise.all(mine.map((r) => (r.permissions?.length ? r : http.get<IRole>(`roles/${r.id}`, { silent: true }))));
    return [...new Set(full.flatMap((r) => r.permissions ?? []))];
  } catch (error) {
    if (isOwner) return [ALL_PERMISSIONS];
    throw error;
  }
};
