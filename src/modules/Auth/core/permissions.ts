/**
 * "What may this operator do?" is answered once after sign-in and drives the menu and the routes.
 *
 * The API's exact shape is not pinned down, so every plausible carrier is read, in this order:
 *   1. a `permissions` field on the login / refresh / change-password reply,
 *   2. permission claims inside the JWT,
 *   3. a `permissions` field on `GET account/me`,
 *   4. the Owner role means everything, otherwise the permissions of the user's roles (`resolvePermissions` in the
 *      Team module). That needs `Roles.View`; there is no "my permissions" endpoint yet (docs 00 §2.2), so a user
 *      without it sees the full menu and the server's 403 decides.
 * `null` means "the API did not tell us": the menu then stays complete and 403s are handled where they happen.
 * An empty list is an answer too: the operator may do nothing.
 */

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);

/** Accepts ["Tenants.View"], [{ group, actions }], [{ resource, actions }], { Tenants: ["View"] } or { permissions: [...] }. */
export function normalizePermissions(raw: unknown): string[] | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "string") return raw.split(/[\s,;]+/).filter(Boolean);
  if (Array.isArray(raw)) {
    const out = new Set<string>();
    for (const item of raw) {
      if (typeof item === "string") out.add(item);
      else if (isObj(item)) {
        const group = String(item.group ?? item.resource ?? item.name ?? "");
        const list = item.actions ?? item.permissions;
        if (Array.isArray(list)) {
          for (const a of list) if (typeof a === "string") out.add(!group || a.startsWith(`${group}.`) ? a : `${group}.${a}`);
        }
      }
    }
    return [...out];
  }
  if (isObj(raw)) {
    if ("permissions" in raw) return normalizePermissions(raw.permissions);
    return normalizePermissions(Object.entries(raw).map(([group, actions]) => ({ group, actions })));
  }
  return null;
}

export const jwtPayload = (token?: string): Json | null => {
  try {
    const part = token?.split(".")[1];
    if (!part) return null;
    const json = decodeURIComponent(
      atob(part.replace(/-/g, "+").replace(/_/g, "/"))
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
    const parsed = JSON.parse(json);
    return isObj(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

/** Permission claims (`permission`, `permissions`, `perm`…): one claim per permission, or one array / string. */
export function permissionsFromToken(token?: string): string[] | null {
  const payload = jwtPayload(token);
  if (!payload) return null;
  const found = Object.entries(payload).filter(([k]) => /(^|[/.])(permissions?|perms?)$/i.test(k));
  if (!found.length) return null;
  return [...new Set(found.flatMap(([, v]) => normalizePermissions(v) ?? []))];
}

/** Role names from the JWT (`role` / `roles` / the long ClaimTypes.Role URI). Roles are never read back from local storage. */
export function rolesFromToken(token?: string): string[] {
  const payload = jwtPayload(token);
  if (!payload) return [];
  const found = Object.entries(payload).filter(([k]) => /(^|[/.])roles?$/i.test(k));
  return [...new Set(found.flatMap(([, v]) => (Array.isArray(v) ? v : [v]).filter((x): x is string => typeof x === "string")))];
}

/** True when `have` satisfies `need`; `need` may list alternatives (any one is enough). */
export const allows = (have: string[], need?: string | string[]): boolean => {
  if (!need || have.includes("*")) return true; // nothing required, or everything granted
  return (Array.isArray(need) ? need : [need]).some((p) => have.includes(p));
};
