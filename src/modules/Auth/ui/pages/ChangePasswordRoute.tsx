import { createRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RootRoute } from "../../../../App";
import { dashboardUrl } from "@/helpers";
import { Button } from "@/components/ui/button";
import { parseApiError } from "@/Api/httpClient";
import useAuthStore from "@/modules/Auth/core/store/AuthStore";
import { useChangePassword } from "../../core/api";
import { AuthShell } from "../components/AuthShell";
import { AuthField } from "../components/AuthField";

/** Forced first-login / admin-reset screen: until the password is changed the API refuses everything else. */
export const ChangePasswordRoute = createRoute({
  path: "/change-password",
  getParentRoute: () => RootRoute,
  component: ChangePasswordPage,
  beforeLoad: ({ context }: { context: any }) => {
    const auth = context?.auth?.auth;
    if (!auth) throw redirect({ to: "/login" });
    if (!auth.mustChangePassword) throw redirect({ to: dashboardUrl("/") });
  },
});

function ChangePasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const change = useChangePassword();
  const applySession = useAuthStore((s) => s.applySession);
  const logOutAction = useAuthStore((s) => s.logOutAction);

  const schema = z
    .object({
      currentPassword: z.string().min(1, t("field_required")),
      newPassword: z.string().min(8, t("password_min_length", { count: 8 })),
      confirm: z.string(),
    })
    .refine((v) => v.newPassword === v.confirm, { path: ["confirm"], message: t("passwords_do_not_match") });
  type Values = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "", confirm: "" },
  });

  const onSubmit = async ({ currentPassword, newPassword }: Values) => {
    try {
      // The reply carries a fresh token pair: replace both.
      const reply = await change.mutateAsync({ currentPassword, newPassword });
      applySession({ ...reply, mustChangePassword: false });
      // a new token pair is a new session: read its roles and permissions again, as sign-in does
      await useAuthStore.getState().fetchProfile();
      toast.success(t("password_changed"));
      navigate({ to: dashboardUrl("/") });
    } catch (error) {
      const { message, fieldErrors } = parseApiError(error);
      (["currentPassword", "newPassword"] as const).forEach((f) => {
        if (fieldErrors[f]?.[0]) setError(f, { message: fieldErrors[f][0] });
      });
      if (!Object.keys(fieldErrors).length && message) setError("root", { message });
    }
  };

  return (
    <AuthShell
      title={t("change_password_title")}
      description={t("change_password_desc")}
      footer={
        <button
          type="button"
          onClick={async () => {
            await logOutAction();
            navigate({ to: "/login" });
          }}
          className="font-medium text-muted-foreground hover:text-foreground"
        >
          {t("logout")}
        </button>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {errors.root?.message && (
          <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errors.root.message}
          </div>
        )}
        <AuthField
          label={t("current_password")}
          type="password"
          autoComplete="current-password"
          autoFocus
          error={errors.currentPassword?.message}
          {...register("currentPassword")}
        />
        <AuthField
          label={t("new_password")}
          type="password"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />
        <AuthField
          label={t("confirm_new_password")}
          type="password"
          autoComplete="new-password"
          error={errors.confirm?.message}
          {...register("confirm")}
        />
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {t("change_password")}
        </Button>
      </form>
    </AuthShell>
  );
}
