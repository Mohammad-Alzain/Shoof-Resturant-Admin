import useAuthStore from "@/modules/Auth/core/store/AuthStore";

/** Non-hook check for places that only need a boolean (a `disabled` flag). Permissions are resolved before the app renders. */
export const can = (permission: string): boolean => {
  const have = useAuthStore.getState().permissions;
  return have.includes("*") || have.includes(permission);
};
