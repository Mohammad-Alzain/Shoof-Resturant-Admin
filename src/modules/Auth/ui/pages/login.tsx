"use client";

import { createRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { RootRoute } from "../../../../App";
import { dashboardUrl } from "@/helpers";
import { Button } from "@/components/ui/button";
import { parseApiError } from "@/Api/httpClient";
import useAuthStore from "@/modules/Auth/core/store/AuthStore";
import { useSignInPost } from "../../core/api";
import { hostSlug, saveSlug, savedSlug } from "../../core/tenant";
import { AuthShell } from "../components/AuthShell";
import { AuthField } from "../components/AuthField";

export const LoginRoute = createRoute({
  path: "/login",
  getParentRoute: () => RootRoute,
  component: LoginComponent,
  beforeLoad: ({ context }: { context: any }) => {
    const auth = context?.auth?.auth;
    if (auth) {
      throw redirect({ to: auth.mustChangePassword ? "/change-password" : dashboardUrl("/") });
    }
  },
});

function LoginComponent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const applySession = useAuthStore((s) => s.applySession);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const signIn = useSignInPost();

  const fromHost = hostSlug();
  const schema = z.object({
    tenantSlug: z.string().trim().min(1, t("field_required")),
    email: z.string().min(1, t("field_required")).email(t("invalid_email")),
    password: z.string().min(1, t("field_required")),
  });
  type Values = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { tenantSlug: fromHost || savedSlug(), email: "", password: "" } });

  const onSubmit = async (values: Values) => {
    try {
      const reply = await signIn.mutateAsync({ ...values, tenantSlug: values.tenantSlug.trim().toLowerCase() });
      saveSlug(values.tenantSlug.trim().toLowerCase());
      applySession(reply);
      if (reply.mustChangePassword) {
        navigate({ to: "/change-password" });
        return;
      }
      await fetchProfile();
      navigate({ to: dashboardUrl("/") });
    } catch (error) {
      const { status, message, fieldErrors } = parseApiError(error);
      if (status === 429) return; // the client already showed "too many attempts"
      (["tenantSlug", "email", "password"] as const).forEach((field) => {
        if (fieldErrors[field]?.[0]) setError(field, { message: fieldErrors[field][0] });
      });
      if (!Object.keys(fieldErrors).length) {
        setError("root", { message: message || t("login_failed") });
      }
    }
  };

  return (
    <AuthShell
      title={t("signin_title")}
      description={t("signin_desc")}
      footer={
        <Link to="/reset-password" className="font-medium text-primary hover:underline">
          {t("forgot_link")}
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {errors.root?.message && (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {errors.root.message}
          </div>
        )}
        {!fromHost && (
          <AuthField
            label={t("restaurant_code")}
            dir="ltr"
            className="text-start"
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="my-restaurant"
            error={errors.tenantSlug?.message}
            {...register("tenantSlug")}
          />
        )}
        <AuthField
          label={t("field_email")}
          type="email"
          autoComplete="username"
          dir="ltr"
          className="text-start"
          autoFocus={!!fromHost}
          placeholder="admin@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <AuthField
          label={t("password")}
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {t("sign_in")}
        </Button>
      </form>
    </AuthShell>
  );
}

export default LoginComponent;
