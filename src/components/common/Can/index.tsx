import type { ReactNode } from "react";
import { useHasPermission } from "@/hooks/useHasPermission";

/** Renders its children only when the user holds the permission (any one of a list). Hiding is cosmetic: the API still refuses. */
export function Can({ permission, children, fallback = null }: { permission: string | string[]; children: ReactNode; fallback?: ReactNode }) {
  const { hasAnyPermission } = useHasPermission();
  return <>{hasAnyPermission(Array.isArray(permission) ? permission : [permission]) ? children : fallback}</>;
}
