import { createCrudApi } from "@/Api/crud";
import { http } from "@/Api/httpClient";

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
}
export const rolesApi = createCrudApi<IRole, { name: string; description?: string | null; permissions: string[] }, { name: string; description?: string | null; permissions: string[] }>("roles", "roles");

export interface PermissionGroup {
  group: string;
  permissions: string[];
}
export const getPermissionCatalogue = (): Promise<PermissionGroup[]> => http.get("roles/permissions");
export const getRole = (id: string): Promise<IRole> => http.get(`roles/${id}`);
