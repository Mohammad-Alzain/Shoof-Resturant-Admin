import { useMemo, useState } from "react";
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Loader2, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { confirmAction } from "@/components/common/Modal/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { getDirection } from "@/Translation/i18n";
import { cn } from "@/lib/utils";
import { fetchAll } from "@/modules/shared/core/lookups";
import { EmptyState } from "@/modules/shared/ui/parts";
import { CardShell } from "@/components/common/ResourceCards";
import { getPermissionCatalogue, getRole, rolesApi, type IRole } from "../../core/api";

/** `Group.Action` strings -> { group, actions[] }: the editor is built from the server's catalogue, never hard-coded. */
const split = (p: string) => {
  const i = p.indexOf(".");
  return { group: i < 0 ? p : p.slice(0, i), action: i < 0 ? "" : p.slice(i + 1) };
};

const RoleEditor = NiceModal.create(({ role }: { role?: IRole }) => {
  const modal = useModal();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const catalogue = useQuery({ queryKey: ["roles", "catalogue"], queryFn: getPermissionCatalogue, staleTime: 10 * 60_000 });
  const full = useQuery({ queryKey: ["roles", "detail", role?.id], queryFn: () => getRole(role!.id), enabled: !!role });
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [chosen, setChosen] = useState<Set<string> | null>(role ? null : new Set());
  const perms = chosen ?? new Set(full.data?.permissions ?? []);
  const isOwner = role?.name === "Owner";

  const groups = useMemo(() => {
    const out = new Map<string, string[]>();
    for (const g of catalogue.data ?? []) for (const p of g.permissions) {
      const { group, action } = split(p);
      out.set(group, [...(out.get(group) ?? []), action]);
    }
    return [...out.entries()];
  }, [catalogue.data]);
  const columns = useMemo(() => [...new Set(groups.flatMap(([, a]) => a))].sort((a, b) => (["View", "Add", "Edit", "Delete"].indexOf(a) + 1 || 9) - (["View", "Add", "Edit", "Delete"].indexOf(b) + 1 || 9)), [groups]);

  const toggle = (p: string) => setChosen((cur) => {
    const n = new Set(cur ?? perms);
    if (n.has(p)) n.delete(p);
    else n.add(p);
    return n;
  });
  const toggleGroup = (group: string, actions: string[]) => setChosen((cur) => {
    const n = new Set(cur ?? perms);
    const all = actions.every((a) => n.has(`${group}.${a}`));
    for (const a of actions) {
      if (all) n.delete(`${group}.${a}`);
      else n.add(`${group}.${a}`);
    }
    return n;
  });

  const save = useMutation({
    mutationFn: () => {
      const body = { name: name.trim(), description: description.trim() || null, permissions: [...perms] };
      return role ? rolesApi.update({ id: role.id, body }) : rolesApi.create(body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      modal.hide();
    },
  });

  return (
    <Sheet open={modal.visible} onOpenChange={(o) => !o && modal.hide()}>
      <SheetContent dir={getDirection()} side="right" className="w-full gap-0 p-0 sm:max-w-4xl">
        <SheetHeader className="border-b border-border px-6 py-4 pe-14 text-start">
          <SheetTitle className="flex items-center gap-2.5 text-base"><span aria-hidden className="h-5 w-1 rounded-full bg-terracotta" />{role ? t("edit_role") : t("add_role")}</SheetTitle>
          <SheetDescription className="sr-only">{t("team_roles")}</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {isOwner && <p className="flex items-start gap-2 rounded-xl bg-warning/10 p-3 text-sm"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />{t("owner_role_warning")}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-medium text-muted-foreground">{t("role_name")} *<Input value={name} maxLength={100} onChange={(e) => setName(e.target.value)} className="h-10" /></label>
            <label className="space-y-1.5 text-xs font-medium text-muted-foreground">{t("description")}<Input value={description} maxLength={500} onChange={(e) => setDescription(e.target.value)} className="h-10" /></label>
          </div>
          {catalogue.isLoading || (role && full.isLoading) ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 text-start font-medium">{t("permission_group")}</th>
                    {columns.map((c) => <th key={c} className="px-3 py-2.5 text-center font-medium">{t(`perm_${c.toLowerCase()}`, { defaultValue: c })}</th>)}
                    <th className="px-3 py-2.5 text-center font-medium">{t("all")}</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map(([g, acts]) => (
                    <tr key={g} className="border-t border-border">
                      <th scope="row" className="whitespace-nowrap px-4 py-2 text-start font-medium text-foreground">{t(`perm_group_${g}`, { defaultValue: g.replace(/([a-z])([A-Z])/g, "$1 $2") })}</th>
                      {columns.map((c) => (
                        <td key={c} className="px-3 py-2 text-center">
                          {acts.includes(c) ? <input type="checkbox" checked={perms.has(`${g}.${c}`)} onChange={() => toggle(`${g}.${c}`)} aria-label={`${g} ${c}`} className="size-4 cursor-pointer accent-[var(--primary)]" /> : <span className="text-muted-foreground/40">·</span>}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center"><input type="checkbox" checked={acts.every((a) => perms.has(`${g}.${a}`))} onChange={() => toggleGroup(g, acts)} aria-label={`${g} ${t("all")}`} className="size-4 cursor-pointer accent-[var(--primary)]" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border px-6 py-3">
          <span className="text-xs text-muted-foreground">{t("n_selected", { n: perms.size })}</span>
          <span className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => modal.hide()}>{t("cancel")}</Button>
            <Button type="button" variant="primary" disabled={!name.trim() || perms.size === 0 || save.isPending} onClick={() => save.mutate()}>{save.isPending && <Loader2 className="animate-spin" />}{t("save")}</Button>
          </span>
        </div>
      </SheetContent>
    </Sheet>
  );
});

/** Roles are bundles of permissions. The Owner role is created with every permission and should rarely change. */
export default function RolesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["roles", "all"], queryFn: () => fetchAll<IRole>("roles") });
  const remove = async (r: IRole) => {
    const ok = await confirmAction({ title: t("delete_confirm_title"), subject: r.name, description: r.name === "Owner" ? t("owner_role_warning") : t("delete_irreversible"), confirmText: t("delete"), danger: true });
    if (!ok) return;
    await rolesApi.remove(r.id);
    qc.invalidateQueries({ queryKey: ["roles"] });
  };
  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">{t("team_roles")}</h1>
          <p className="text-sm text-muted-foreground">{t("roles_desc")}</p>
        </div>
        <Button type="button" variant="primary" onClick={() => NiceModal.show(RoleEditor, {})}><Plus />{t("add_role")}</Button>
      </header>
      {q.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
      ) : (q.data ?? []).length === 0 ? (
        <EmptyState icon={ShieldCheck} title={t("no_roles")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(q.data ?? []).map((r, i) => (
            <CardShell key={r.id} index={i} actions={<><Button type="button" variant="ghost" size="icon" aria-label={t("edit")} onClick={() => NiceModal.show(RoleEditor, { role: r })}><Pencil className="size-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label={t("delete")} onClick={() => remove(r)} className="hover:text-destructive"><Trash2 className="size-4" /></Button></>}>
              <div className="flex flex-1 flex-col gap-2 p-5 pe-24">
                <span className={cn("grid size-10 place-items-center rounded-xl", r.name === "Owner" ? "bg-terracotta text-white" : "bg-primary/10 text-primary")}><ShieldCheck className="size-5" /></span>
                <h3 className="font-display text-lg font-semibold text-foreground">{r.name}</h3>
                <p className="line-clamp-2 text-sm text-muted-foreground">{r.description || "—"}</p>
              </div>
            </CardShell>
          ))}
        </div>
      )}
    </section>
  );
}
