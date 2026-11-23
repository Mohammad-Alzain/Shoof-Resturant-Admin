import { useEffect, useState } from "react";
import { createRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RootRoute } from "../../../../App";
import { Button } from "@/components/ui/button";
import { parseApiError } from "@/Api/httpClient";
import { useForgotPassword, useResetPassword } from "../../core/api";
import { defaultSlug, hostSlug } from "../../core/tenant";
import { AuthShell } from "../components/AuthShell";
import { AuthField } from "../components/AuthField";

/**
 * `/reset-password` has two modes (docs/functional-specs/README.md §2.1):
 *  - no query string: ask for the email (forgot password);
 *  - `?email=…&token=…` (the link in the email): choose a new password.
 */
export const ResetPasswordRoute = createRoute({
  path: "/reset-password",
  getParentRoute: () => RootRoute,
  component: ResetPasswordPage,
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === "string" ? search.email : undefined,
    token: typeof search.token === "string" ? search.token : undefined,
    slug: typeof search.slug === "string" ? search.slug : undefined,
  }),
});

const BackToLogin = () => {
  const { t } = useTranslation();
  return (
    <Link to="/login" className="font-medium text-primary hover:underline">
      {t("back_to_login")}
    </Link>
  );
};

function ResetPasswordPage() {
  const search = ResetPasswordRoute.useSearch();
  // Keep the one-time token in memory and take it out of the URL (history, screenshots, Referer headers).
  const [creds, setCreds] = useState<{ email: string; token: string; slug: string } | null>(
    search.email && search.token ? { email: search.email, token: search.token, slug: search.slug ?? defaultSlug() } : null,
  );
  useEffect(() => {
    if (search.email && search.token) {
      setCreds({ email: search.email, token: search.token, slug: search.slug ?? defaultSlug() });
      window.history.replaceState(window.history.state, "", "/reset-password");
    }
  }, [search.email, search.token]);
  return creds ? <ChooseNewPassword email={creds.email} token={creds.token} slug={creds.slug} /> : <RequestLink />;
}

function RequestLink() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const forgot = useForgotPassword();
  const fromHost = hostSlug();
  const schema = z.object({
    tenantSlug: z.string().trim().min(1, t("field_required")),
    email: z.string().min(1, t("field_required")).email(t("invalid_email")),
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { tenantSlug: defaultSlug(), email: "" } });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      await forgot.mutateAsync({ ...values, tenantSlug: values.tenantSlug.trim().toLowerCase() });
    } catch {
      // The API always answers 204; any failure (e.g. 429) is reported by the client.
      return;
    }
    setSent(true);
  };

  return (
    <AuthShell
      title={t("forget_password")}
      description={sent ? undefined : t("forgot_password_desc")}
      footer={<BackToLogin />}
    >
      {sent ? (
        <p role="status" className="rounded-md border border-success/30 bg-success/10 px-3 py-3 text-center text-sm text-foreground">
          {t("reset_link_sent_if_exists")}
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {!fromHost && (
            <AuthField label={t("restaurant_code")} dir="ltr" className="text-start" autoCapitalize="none" placeholder="pizzahut" error={errors.tenantSlug?.message} {...register("tenantSlug")} />
          )}
          <AuthField
            label={t("email")}
            type="email"
            autoComplete="email"
            autoFocus
            error={errors.email?.message}
            {...register("email")}
          />
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {t("send_reset_link")}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

function ChooseNewPassword({ email, token, slug }: { email: string; token: string; slug: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reset = useResetPassword();
  const schema = z
    .object({
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
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { newPassword: "", confirm: "" } });

  const onSubmit = async ({ newPassword }: Values) => {
    try {
      await reset.mutateAsync({ tenantSlug: slug, email, token, newPassword });
      toast.success(t("password_reset_success"));
      navigate({ to: "/login" });
    } catch (error) {
      const { status, message, fieldErrors } = parseApiError(error);
      if (fieldErrors.newPassword?.[0]) setError("newPassword", { message: fieldErrors.newPassword[0] });
      else if (status === 400) setError("root", { message: message || t("reset_link_invalid") });
    }
  };

  return (
    <AuthShell title={t("reset_password")} description={email} footer={<BackToLogin />}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {errors.root?.message && (
          <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errors.root.message}{" "}
            <a href="/reset-password" className="font-medium underline">{t("request_new_link")}</a>
          </div>
        )}
        <AuthField
          label={t("new_password")}
          type="password"
          autoComplete="new-password"
          autoFocus
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
          {t("reset_password_button")}
        </Button>
      </form>
    </AuthShell>
  );
}
