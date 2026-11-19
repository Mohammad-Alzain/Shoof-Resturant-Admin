import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { FieldTypes } from "@/components/common/Fields/Enums/Field";
import { ResourcePage } from "@/components/common/ResourcePage";
import { Badge } from "@/components/ui/badge";
import { strOrNull } from "@/helpers/body";
import { activeFilter } from "@/modules/shared/core/filters";
import { fetchAll } from "@/modules/shared/core/lookups";
import { usersApi, type IAdminUser, type IRole } from "../../core/api";

const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase();

/** The restaurant's team. The password set here is temporary: the person changes it at the first sign-in. */
export default function UsersPage() {
  const { t } = useTranslation();
  const roles = useQuery({ queryKey: ["roles", "all"], queryFn: () => fetchAll<IRole>("roles") });
  const roleOptions = (roles.data ?? []).map((r) => ({ value: r.name, label: r.name }));

  return (
    <ResourcePage<IAdminUser>
      title="team_users"
      api={usersApi}
      deleteLabel="fullName"
      columns={[
        {
          header: "name",
          access: "fullName",
          Cell: (_c, _v, u: IAdminUser) => (
            <span className="flex items-center gap-3">
              <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{initials(u.fullName)}</span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium text-foreground">{u.fullName}</span>
                <span dir="ltr" className="truncate text-start text-xs text-muted-foreground">{u.email}</span>
              </span>
            </span>
          ),
        },
        { header: "phone", access: "phoneNumber", Cell: (_c, _v, u: IAdminUser) => <span dir="ltr" className="tabular-nums">{u.phoneNumber || "—"}</span> },
        {
          header: "roles",
          access: "roles",
          Cell: (_c, _v, u: IAdminUser) => (
            <span className="flex flex-wrap gap-1">
              {(u.roles ?? []).length ? u.roles.map((r) => <Badge key={r} variant={r === "Owner" ? "primary" : "secondary"} appearance="light" size="sm">{r}</Badge>) : <span className="text-muted-foreground">—</span>}
            </span>
          ),
        },
        { header: "status", access: "isActive", Cell: (_c, _v, u: IAdminUser) => <Badge variant={u.isActive ? "success" : "secondary"} appearance="light" size="md">{u.isActive ? t("active") : t("inactive")}</Badge> },
      ]}
      filters={[activeFilter(t)]}
      schema={(row) =>
        z.object({
          fullName: z.string().trim().min(1, t("field_required")).max(200),
          ...(row ? {} : { email: z.string().min(1, t("field_required")).email(t("invalid_email")), password: z.string().min(8, t("password_min_length", { count: 8 })) }),
          phoneNumber: z.string().max(30).optional().nullable(),
          roles: z.array(z.string()).optional().nullable(),
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
        { name: "roles", control: FieldTypes.select, label: t("roles"), isMulti: true, options: roleOptions },
        ...(row ? [{ name: "isActive", control: FieldTypes.switch, label: t("active") }] : []),
      ]}
    />
  );
}
