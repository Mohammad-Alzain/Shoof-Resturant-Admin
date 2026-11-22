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
 * returns: read each role's permission list. Owner has every permission. `silent` keeps a refused lookup quiet
 * (a user without `Roles.View` cannot read roles; the caller then falls back to showing everything).
 */
export const resolvePermissions = async (roleNames: string[]): Promise<string[]> => {
  if (!roleNames.length) return [];
  if (roleNames.some((n) => n.toLowerCase() === "owner")) return [ALL_PERMISSIONS];
  const wanted = new Set(roleNames.map((n) => n.toLowerCase()));
  const list = await http.get<IPagedResponse<IRole>>("roles", { params: { page: 1, pageSize: 100 }, silent: true });
  const mine = (list.data ?? []).filter((r) => wanted.has(r.name.toLowerCase()));
  if (mine.some((r) => r.isOwner)) return [ALL_PERMISSIONS];
  const full = await Promise.all(mine.map((r) => (r.permissions ? r : http.get<IRole>(`roles/${r.id}`, { silent: true }))));
  return [...new Set(full.flatMap((r) => r.permissions ?? []))];
};
