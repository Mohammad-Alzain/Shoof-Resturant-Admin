import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { parseApiError } from "@/Api/httpClient";
import { AuthField } from "@/modules/Auth/ui/components/AuthField";
import { useChangeMyPassword, useMe, useUpdateMe } from "../../core/hooks";
import useAuthStore from "@/modules/Auth/core/store/AuthStore";

function ProfileForm() {
  const { t } = useTranslation();
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const me = useMe();
  const save = useUpdateMe();
  const isPrimary = false;

  const schema = z.object({
    fullName: z.string().trim().min(1, t("field_required")).max(200),
    email: z.string().email(t("invalid_email")),
    phoneNumber: z.string().max(30).optional().nullable(),
  });
  type Values = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (me.data) reset({ fullName: me.data.fullName ?? me.data.name ?? "", email: me.data.email, phoneNumber: me.data.phoneNumber ?? "" });
  }, [me.data, reset]);

  const onSubmit = async (v: Values) => {
    try {
      // Email is read-only except for the primary SuperAdmin.
      await save.mutateAsync({ fullName: v.fullName, phoneNumber: v.phoneNumber?.trim() || null });
      toast.success(t("success_request"));
      await fetchProfile();
      reset(v);
    } catch (error) {
      const { fieldErrors } = parseApiError(error);
      Object.entries(fieldErrors).forEach(([k, m]) => setError(k as keyof Values, { message: m[0] }));
    }
  };

  if (me.isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <AuthField label={t("full_name")} error={errors.fullName?.message} {...register("fullName")} />
      <AuthField label={t("phone")} dir="ltr" className="text-start" error={errors.phoneNumber?.message} {...register("phoneNumber")} />
      <AuthField label={t("email")} type="email" readOnly={!isPrimary} aria-readonly={!isPrimary} error={errors.email?.message} {...register("email")} />
      <Button type="submit" variant="primary" disabled={isSubmitting || !isDirty}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        {t("save")}
      </Button>
    </form>
  );
}

function PasswordForm() {
  const { t } = useTranslation();
  const applySession = useAuthStore((s) => s.applySession);
  const change = useChangeMyPassword();
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
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { currentPassword: "", newPassword: "", confirm: "" } });

  const onSubmit = async ({ currentPassword, newPassword }: Values) => {
    try {
      // The reply carries a fresh token pair: replace both.
      const reply = await change.mutateAsync({ currentPassword, newPassword });
      applySession({ ...reply, mustChangePassword: false });
      // a new token pair is a new session: read its roles and permissions again, as sign-in does
      await useAuthStore.getState().fetchProfile();
      toast.success(t("password_changed"));
      reset();
    } catch (error) {
      const { fieldErrors } = parseApiError(error);
      Object.entries(fieldErrors).forEach(([k, m]) => setError(k as keyof Values, { message: m[0] }));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <AuthField label={t("current_password")} type="password" autoComplete="current-password" error={errors.currentPassword?.message} {...register("currentPassword")} />
      <AuthField label={t("new_password")} type="password" autoComplete="new-password" error={errors.newPassword?.message} {...register("newPassword")} />
      <AuthField label={t("confirm_new_password")} type="password" autoComplete="new-password" error={errors.confirm?.message} {...register("confirm")} />
      <Button type="submit" variant="outline" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        {t("change_password")}
      </Button>
    </form>
  );
}

export default function ProfilePage() {
  const { t } = useTranslation();
  return (
    <section className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">{t("my_profile")}</h1>
      <div className="rounded-xl border border-border bg-card p-6 shadow-card"><ProfileForm /></div>
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h2 className="mb-4 text-base font-semibold">{t("change_password")}</h2>
        <PasswordForm />
      </div>
    </section>
  );
}
