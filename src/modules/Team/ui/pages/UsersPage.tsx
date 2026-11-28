import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { FieldTypes } from "@/components/common/Fields/Enums/Field";
import { ResourcePage } from "@/components/common/ResourcePage";
import { Badge } from "@/components/ui/badge";
import { strOrNull } from "@/helpers/body";
import { activeFilter } from "@/modules/shared/core/filters";
import { fetchAll } from "@/modules/shared/core/lookups";
import { Crown } from "lucide-react";
import useAuthStore from "@/modules/Auth/core/store/AuthStore";
import { myRoles } from "@/modules/Auth/core/permissions";
import { getRole, usersApi, type IAdminUser, type IRole } from "../../core/api";

const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase();

/** The restaurant's team. The password set here is temporary: the person changes it at the first sign-in. */
export default function UsersPage() {
  const { t } = useTranslation();
  const roles = useQuery({ queryKey: ["roles", "all"], queryFn: () => fetchAll<IRole>("roles") });
  const auth = useAuthStore((s) => s.auth);
  const myPermissions = useAuthStore((s) => s.permissions);
  // The caller is an Owner when the login roles contain "Owner" (guide, Release 1).
  const iAmOwner = myRoles(auth).some((r) => r.toLowerCase() === "owner");
  const isOwnerRole = (name: string) => name.toLowerCase() === "owner" || !!roles.data?.find((r) => r.name === name)?.isOwner;
  const isOwnerUser = (u: IAdminUser) => (u.roles ?? []).some(isOwnerRole);
  // A non-Owner can only give a role whose every permission they hold: read the roles' permissions to know which.
  const details = useQuery({
    queryKey: ["roles", "details-for-granting", (roles.data ?? []).map((r) => r.id).join(",")],
    enabled: !iAmOwner && !!roles.data?.length,
    queryFn: () => Promise.all((roles.data ?? []).map((r) => (r.permissions ? r : getRole(r.id)))),
  });
  const canGrant = (name: string) => {
    if (iAmOwner || myPermissions.includes("*")) return true;
    if (isOwnerRole(name)) return false; // only an Owner can give the Owner role
    const role = details.data?.find((r) => r.name === name);
    return !role || (role.permissions ?? []).every((p) => myPermissions.includes(p));
  };
  /** Role picker options for one user: what the caller may grant, plus what the user already has (kept, so it isn't dropped). */
  const roleOptions = (row?: IAdminUser) =>
    (roles.data ?? [])
      .filter((r) => !isOwnerRole(r.name) || iAmOwner || (row?.roles ?? []).includes(r.name))
      .map((r) => {
        // The primary admin can't lose the Owner role; a role the caller can't grant can't be added (or removed).
        const locked = (row?.isPrimary && isOwnerRole(r.name)) || !canGrant(r.name);
        return { value: r.name, label: r.name, isDisabled: locked };
      });

  return (
    <ResourcePage<IAdminUser>
      permissionGroup="AdminUsers"
      title="team_users"
      api={usersApi}
      deleteLabel="fullName"
      columns={[
        {
          header: "name", sortKey: "fullName",
          access: "fullName",
          Cell: (_c, _v, u: IAdminUser) => (
            <span className="flex items-center gap-3">
              <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{initials(u.fullName)}</span>
              <span className="flex min-w-0 flex-col">
                <span className="flex items-center gap-1.5 truncate font-medium text-foreground">
                  {u.fullName}
                  {u.isPrimary && <Badge variant="info" appearance="light" size="sm" className="gap-1"><Crown className="size-3" />{t("primary_admin")}</Badge>}
                </span>
                <span dir="ltr" className="truncate text-start text-xs text-muted-foreground">{u.email}</span>
              </span>
            </span>
          ),
        },
        { header: "phone", sortKey: "phoneNumber", access: "phoneNumber", Cell: (_c, _v, u: IAdminUser) => <span dir="ltr" className="tabular-nums">{u.phoneNumber || "—"}</span> },
        {
          header: "roles",
          access: "roles",
          Cell: (_c, _v, u: IAdminUser) => (
            <span className="flex flex-wrap gap-1">
              {(u.roles ?? []).length ? u.roles.map((r) => <Badge key={r} variant={r === "Owner" ? "primary" : "secondary"} appearance="light" size="sm">{r}</Badge>) : <span className="text-muted-foreground">—</span>}
            </span>
          ),
        },
        { header: "status", sortKey: "isActive", access: "isActive", Cell: (_c, _v, u: IAdminUser) => <Badge variant={u.isActive ? "success" : "secondary"} appearance="light" size="md">{u.isActive ? t("active") : t("inactive")}</Badge> },
      ]}
      filters={[
        activeFilter(t),
        { name: "roleId", control: FieldTypes.select, label: t("role"), options: (roles.data ?? []).map((r) => ({ value: r.id, label: r.name })) },
      ]}
      // The primary admin can't be deleted; only an Owner can delete, deactivate or demote an Owner (Release 2).
      canDelete={(u) => !u.isPrimary && (iAmOwner || !isOwnerUser(u))}
      canEdit={(u) => iAmOwner || !isOwnerUser(u)}
      schema={(row) =>
        z.object({
          fullName: z.string().trim().min(1, t("field_required")).max(200),
          ...(row ? {} : { email: z.string().min(1, t("field_required")).email(t("invalid_email")), password: z.string().min(8, t("password_min_length", { count: 8 })) }),
          phoneNumber: z.string().max(30).optional().nullable(),
          roles: z
            .array(z.string())
            .optional()
            .nullable()
            .refine((v) => !row?.isPrimary || (v ?? []).some(isOwnerRole), { message: t("primary_keeps_owner") }),
          ...(row ? { isActive: z.boolean() } : {}),
        })
      }
      initialState={(row) => ({ fullName: row?.fullName ?? "", email: row?.email ?? "", password: "", phoneNumber: row?.phoneNumber ?? "", roles: row?.roles ?? [], isActive: row?.isActive ?? true })}
      toBody={(v, row) =>
        row
          ? { fullName: v.fullName.trim(), phoneNumber: strOrNull(v.phoneNumber), isActive: !!v.isActive, roles: v.roles ?? [] }
          : { fullName: v.fullName.trim(), email: v.email.trim(), phoneNumber: strOrNull(v.phoneNumber), password: v.password, roles: v.roles ?? [] }
      }
      fields={(row) => [
        { name: "fullName", control: FieldTypes.text, label: t("full_name"), required: true },
        ...(row ? [] : [{ name: "email", control: FieldTypes.text, label: t("email"), required: true }, { name: "password", control: FieldTypes.password, label: t("temporary_password"), required: true, helpertext: t("user_must_change_password") }]),
        { name: "phoneNumber", control: FieldTypes.text, label: t("phone") },
        { name: "roles", control: FieldTypes.select, label: t("roles"), isMulti: true, options: roleOptions(row), helpertext: iAmOwner ? undefined : t("roles_you_can_grant") },
        ...(row ? [{ name: "isActive", control: FieldTypes.switch, label: t("active"), disabled: !!row.isPrimary, helpertext: row.isPrimary ? t("primary_admin_locked") : undefined }] : []),
      ]}
    />
  );
}
