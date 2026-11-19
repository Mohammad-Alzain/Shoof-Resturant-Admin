import useAuthStore from "@/modules/Auth/core/store/AuthStore";

/**
 * A global hook to check if the current user has specific permissions.
 * Supports checking for a single permission, any of a set, or all of a set.
 */
export const useHasPermission = () => {
  const { permissions } = useAuthStore();

  const all = permissions.includes("*");
  const hasPermission = (permission: string) => all || permissions.includes(permission);
  
  const hasAnyPermission = (requiredPermissions: string[]) =>
    all || requiredPermissions.some((perm) => permissions.includes(perm));

  const hasAllPermissions = (requiredPermissions: string[]) =>
    all || requiredPermissions.every((perm) => permissions.includes(perm));

  return { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    permissions 
  };
};
