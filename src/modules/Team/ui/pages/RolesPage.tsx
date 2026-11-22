import { Can } from "@/components/common/Can";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle, Box, Check, Coins, Crown, FolderTree, Globe, KeyRound, LayoutDashboard, LayoutGrid, Loader2, Palette,
  Plus, QrCode, Salad, Search, Share2, ShieldCheck, Sparkles, Store, Trash2, Users, UtensilsCrossed, Wheat,
} from "lucide-react";
import { toast } from "sonner";
import { confirmAction } from "@/components/common/Modal/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { fetchAll } from "@/modules/shared/core/lookups";
import { EmptyState } from "@/modules/shared/ui/parts";
import { getPermissionCatalogue, getRole, rolesApi, type IRole } from "../../core/api";

type Icon = React.ComponentType<{ className?: string }>;

const GROUP_ICONS: Record<string, Icon> = {
  AdminUsers: Users, Roles: ShieldCheck, Restaurants: Store, MenuCategories: FolderTree, MenuItems: UtensilsCrossed,
  Ingredients: Wheat, MenuItemIngredients: Salad, MenuItem3DModels: Box, ModelGenerationJobs: Sparkles, QrCodes: QrCode,
  Tables: LayoutGrid, MenuThemes: Palette, RestaurantSocialLinks: Share2, Currencies: Coins, Countries: Globe, RestaurantDashboard: LayoutDashboard,
};

const ACTION_ORDER = ["View", "Add", "Edit", "Delete"];
const rank = (a: string) => ACTION_ORDER.indexOf(a) + 1 || 9;

/** `Group.Action` strings -> groups with their actions: built from the server's catalogue, never hard-coded. */
const parse = (catalogue: { permissions: string[] }[]) => {
  const out = new Map<string, string[]>();
  for (const g of catalogue) for (const p of g.permissions) {
    const i = p.indexOf(".");
    const group = i < 0 ? p : p.slice(0, i);
    const action = i < 0 ? "" : p.slice(i + 1);
    out.set(group, [...(out.get(group) ?? []), action]);
  }
  return [...out.entries()].map(([group, actions]) => ({ group, actions: actions.sort((a, b) => rank(a) - rank(b)) }));
};

const sameSet = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every((x) => b.has(x));

/** The editor for one role. Mounted with `key` so switching roles resets it. */
function RoleEditor({ role, onSaved, onDeleted, onDirty }: { role: IRole | null; onSaved: (r: IRole) => void; onDeleted: () => void; onDirty: (d: boolean) => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const catalogue = useQuery({ queryKey: ["roles", "catalogue"], queryFn: getPermissionCatalogue, staleTime: 10 * 60_000 });
  const initial = useMemo(() => new Set(role?.permissions ?? []), [role]);
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [perms, setPerms] = useState<Set<string>>(initial);
  const [filter, setFilter] = useState("");
  const isOwner = !!role && (role.isOwner ?? role.name === "Owner");
  /** The Owner role can only gain permissions: the ones it already has are locked on. */
  const locked = isOwner ? initial : new Set<string>();

  const groups = useMemo(() => parse(catalogue.data ?? []), [catalogue.data]);
  const total = useMemo(() => groups.reduce((n, g) => n + g.actions.length, 0), [groups]);
  const label = (g: string) => t(`perm_group_${g}`, { defaultValue: g.replace(/([a-z])([A-Z])/g, "$1 $2") });
  const needle = filter.trim().toLowerCase();
  const shown = groups.filter((g) => !needle || label(g.group).toLowerCase().includes(needle) || g.group.toLowerCase().includes(needle));

  const dirty = name !== (role?.name ?? "") || description !== (role?.description ?? "") || !sameSet(perms, initial);
  useEffect(() => { onDirty(dirty); }, [dirty, onDirty]);

  const mutate = (fn: (n: Set<string>) => void) => setPerms((cur) => { const n = new Set(cur); fn(n); locked.forEach((p) => n.add(p)); return n; });
  /** Add/Edit/Delete need View to be of any use, and removing View removes them, so a role can't end up half-working. */
  const toggle = (g: string, a: string, actions: string[]) => mutate((n) => {
    const key = `${g}.${a}`;
    if (n.has(key)) {
      n.delete(key);
      if (a === "View") for (const x of actions) n.delete(`${g}.${x}`);
    } else {
      n.add(key);
      if (a !== "View" && actions.includes("View")) n.add(`${g}.View`);
    }
  });
  const toggleGroup = (g: string, actions: string[]) => mutate((n) => {
    const all = actions.every((a) => n.has(`${g}.${a}`));
    for (const a of actions) {
      if (all) n.delete(`${g}.${a}`);
      else n.add(`${g}.${a}`);
    }
  });
  const preset = (kind: "read" | "all" | "none") => mutate((n) => {
    n.clear();
    for (const { group, actions } of groups) for (const a of actions) if (kind === "all" || (kind === "read" && a === "View")) n.add(`${group}.${a}`);
  });

  const save = useMutation({
    mutationFn: () => {
      const body = { name: name.trim(), description: description.trim() || null, permissions: [...perms] };
      return role ? rolesApi.update({ id: role.id, body }) : rolesApi.create(body);
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      toast.success(t("saved"));
      onSaved({ id: saved?.id ?? role!.id, name: name.trim(), description: description.trim() || null, permissions: [...perms] });
    },
  });

  const remove = async () => {
    if (!role) return;
    const ok = await confirmAction({ title: t("delete_confirm_title"), subject: role.name, description: isOwner ? t("owner_role_warning") : t("delete_irreversible"), confirmText: t("delete"), danger: true });
    if (!ok) return;
    await rolesApi.remove(role.id);
    qc.invalidateQueries({ queryKey: ["roles"] });
    onDeleted();
  };

  return (
    <div className="flex min-h-0 flex-col rounded-2xl border border-border bg-card shadow-card">
      <div className="space-y-4 border-b border-border p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={cn("grid size-11 place-items-center rounded-xl", isOwner ? "bg-terracotta text-white" : "bg-primary/10 text-primary")}>
              {isOwner ? <Crown className="size-5" /> : <ShieldCheck className="size-5" />}
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">{role ? role.name : t("add_role")}</h2>
              <p className="text-xs text-muted-foreground">{t("n_of_perms", { n: perms.size, total })}</p>
            </div>
          </div>
          {role && !isOwner && <Can permission="Roles.Delete"><Button type="button" variant="ghost" size="sm" onClick={remove} className="text-muted-foreground hover:text-destructive"><Trash2 />{t("delete")}</Button></Can>}
        </div>
        {isOwner && <p className="flex items-start gap-2 rounded-xl bg-warning/10 p-3 text-sm"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />{t("owner_role_locked")}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs font-medium text-muted-foreground">{t("role_name")} *<Input value={name} maxLength={100} disabled={isOwner} onChange={(e) => setName(e.target.value)} className="h-10" /></label>
          <label className="flex flex-col gap-2 text-xs font-medium text-muted-foreground">{t("description")}<Input value={description} maxLength={500} disabled={isOwner} onChange={(e) => setDescription(e.target.value)} className="h-10" /></label>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-48 flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={t("search_permissions")} className="h-9 ps-9" />
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("presets")}>
            <Button type="button" variant="outline" size="sm" onClick={() => preset("read")}>{t("preset_read")}</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => preset("all")}>{t("preset_all")}</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => preset("none")}>{t("preset_none")}</Button>
          </div>
        </div>

        {catalogue.isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        ) : shown.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("no_results")}</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {shown.map(({ group, actions }) => {
              const Ico = GROUP_ICONS[group] ?? KeyRound;
              const have = actions.filter((a) => perms.has(`${group}.${a}`)).length;
              const full = have === actions.length;
              return (
                <section key={group} className={cn("rounded-xl border p-3.5 transition-colors", have ? "border-primary/30 bg-primary/[0.04]" : "border-border bg-background")}>
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className={cn("grid size-8 place-items-center rounded-lg", have ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground")}><Ico className="size-4" /></span>
                    <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{label(group)}</h3>
                    <button type="button" onClick={() => toggleGroup(group, actions)} className="rounded-md px-1.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/10">
                      {full ? t("clear") : t("all")}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {actions.map((a) => {
                      const on = perms.has(`${group}.${a}`);
                      return (
                        <button
                          key={a}
                          type="button"
                          role="switch"
                          aria-checked={on}
                          disabled={locked.has(`${group}.${a}`)}
                          title={locked.has(`${group}.${a}`) ? t("owner_permission_locked") : undefined}
                          onClick={() => toggle(group, a, actions)}
                          className={cn(
                            "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-80",
                            on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                          )}
                        >
                          {on && <Check className="size-3.5" />}
                          {t(`perm_${a.toLowerCase()}`, { defaultValue: a })}
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <Can permission={role ? "Roles.Edit" : "Roles.Add"}>
      <div className="sticky bottom-0 flex items-center justify-between gap-2 rounded-b-2xl border-t border-border bg-card/95 px-5 py-3 backdrop-blur-sm">
        <span className={cn("text-xs", dirty ? "font-medium text-warning" : "text-muted-foreground")}>{dirty ? t("unsaved_changes") : t("all_saved")}</span>
        <span className="flex gap-2">
          <Button type="button" variant="outline" disabled={!dirty} onClick={() => { setName(role?.name ?? ""); setDescription(role?.description ?? ""); setPerms(new Set(initial)); }}>{t("discard")}</Button>
          <Button type="button" variant="primary" disabled={!dirty || !name.trim() || perms.size === 0 || save.isPending} onClick={() => save.mutate()}>{save.isPending && <Loader2 className="animate-spin" />}{t("save")}</Button>
        </span>
      </div>
      </Can>
    </div>
  );
}

/** Roles are bundles of permissions: a list on one side, the selected role's permission grid on the other. */
export default function RolesPage() {
  const { t } = useTranslation();
  const list = useQuery({ queryKey: ["roles", "all"], queryFn: () => fetchAll<IRole>("roles") });
  const [selected, setSelected] = useState<string | "new" | null>(null);
  const dirty = useRef(false);
  const setDirty = useCallback((d: boolean) => { dirty.current = d; }, []);
  const roles = list.data ?? [];
  const currentId = selected ?? roles[0]?.id ?? null;
  const detail = useQuery({ queryKey: ["roles", "detail", currentId], queryFn: () => getRole(currentId!), enabled: !!currentId && currentId !== "new" });

  const choose = async (id: string | "new") => {
    if (id === currentId) return;
    if (dirty.current && !(await confirmAction({ title: t("discard_changes_title"), description: t("discard_changes_desc"), confirmText: t("discard"), danger: true }))) return;
    dirty.current = false;
    setSelected(id);
  };

  return (
    <section className="space-y-5">
      <header>
        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">{t("team_roles")}</h1>
        <p className="text-sm text-muted-foreground">{t("roles_desc")}</p>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="space-y-2 lg:sticky lg:top-4">
          <Can permission="Roles.Add"><Button type="button" variant="primary" className="w-full" onClick={() => choose("new")}><Plus />{t("add_role")}</Button></Can>
          {list.isLoading ? (
            [0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)
          ) : roles.length === 0 && currentId !== "new" ? (
            <EmptyState icon={ShieldCheck} title={t("no_roles")} />
          ) : (
            <ul className="space-y-1.5">
              {currentId === "new" && (
                <li className="flex items-center gap-3 rounded-xl border border-dashed border-primary bg-primary/5 p-3 text-sm font-medium text-primary"><Plus className="size-4" />{t("add_role")}</li>
              )}
              {roles.map((r) => {
                const active = r.id === currentId;
                const owner = r.isOwner ?? r.name === "Owner";
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => choose(r.id)}
                      aria-current={active}
                      className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-start transition-colors", active ? "border-primary bg-primary/8 shadow-sm" : "border-border bg-card hover:border-primary/40")}
                    >
                      <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", owner ? "bg-terracotta text-white" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        {owner ? <Crown className="size-4" /> : <ShieldCheck className="size-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">{r.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{r.description || "—"}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <div className="min-w-0">
          {currentId === "new" ? (
            <RoleEditor key="new" role={null} onDirty={setDirty} onDeleted={() => setSelected(null)} onSaved={(r) => { dirty.current = false; setSelected(r.id); }} />
          ) : !currentId ? (
            list.isLoading ? <Skeleton className="h-96 rounded-2xl" /> : null
          ) : detail.isLoading || !detail.data ? (
            <Skeleton className="h-96 rounded-2xl" />
          ) : (
            <RoleEditor key={currentId} role={detail.data} onDirty={setDirty} onDeleted={() => { dirty.current = false; setSelected(null); }} onSaved={() => { dirty.current = false; }} />
          )}
        </div>
      </div>
    </section>
  );
}
