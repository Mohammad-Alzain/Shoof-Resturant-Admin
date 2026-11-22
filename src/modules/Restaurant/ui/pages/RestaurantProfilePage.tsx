import { can } from "@/modules/Auth/core/can";
import { Can } from "@/components/common/Can";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Clock, Globe2, Store } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import FormBuilder from "@/components/common/FormBuilder";
import { FieldTypes } from "@/components/common/Fields/Enums/Field";
import { Skeleton } from "@/components/ui/skeleton";
import { strOrNull } from "@/helpers/body";
import { http } from "@/Api/httpClient";
import { fetchAll, getBilingual, useCurrencies } from "@/modules/shared/core/lookups";
import { useCurrentRestaurant, type IRestaurant } from "@/modules/shared/core/restaurant";
import { FilePickButton } from "@/modules/shared/ui/parts";
import { uploadRestaurantLogo } from "../../core/api";

interface ICountry {
  id: string;
  isoCode: string;
  nameEn: string;
  nameAr?: string | null;
  timeZoneId: string;
}

/** The restaurant's identity: names, logo, currency and country (the country sets the time zone). Restaurants are created by Shoof, not here. */
export default function RestaurantProfilePage() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const { restaurant, loading } = useCurrentRestaurant();
  const currencies = useCurrencies();
  const countries = useQuery({ queryKey: ["countries", "all"], staleTime: 30 * 60_000, queryFn: () => fetchAll<ICountry>("countries") });
  const bi = useQuery({ queryKey: ["restaurants", "bilingual", restaurant?.id, restaurant?.name], enabled: !!restaurant, queryFn: () => getBilingual<IRestaurant>("restaurants", restaurant!.id, ["name"]) });
  const refresh = () => qc.invalidateQueries({ queryKey: ["restaurants"] });
  const save = useMutation({ mutationFn: (body: unknown) => http.put(`restaurants/${restaurant?.id}`, body) });

  if (loading || !restaurant || bi.isLoading || !currencies.data || !countries.data) return <Skeleton className="h-96 max-w-3xl rounded-2xl" />;
  const zone = countries.data.find((c) => c.id === restaurant.countryId)?.timeZoneId ?? restaurant.timeZoneId;
  const ar = i18n.language.startsWith("ar");

  return (
    <section className="space-y-5">
      <header>
        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">{t("restaurant_profile")}</h1>
        <p className="text-sm text-muted-foreground">{t("profile_desc")}</p>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="space-y-4 rounded-2xl border border-border bg-card p-5 text-center shadow-card">
          {restaurant.logoUrl ? (
            <img src={restaurant.logoUrl} alt="" className="mx-auto size-28 rounded-3xl border border-border object-cover" />
          ) : (
            <span className="mx-auto grid size-28 place-items-center rounded-3xl bg-terracotta font-display text-4xl font-bold text-white">{restaurant.name.charAt(0).toUpperCase()}</span>
          )}
          <p className="font-display text-lg font-semibold text-foreground">{restaurant.name}</p>
          <Can permission="Restaurants.Edit">
          <FilePickButton accept=".jpg,.jpeg,.png,.webp" label={t("upload_logo")} onPick={(f) => uploadRestaurantLogo(restaurant.id, f).then(() => { refresh(); toast.success(t("success_update")); })} className="w-full" />
          </Can>
          <dl className="space-y-2.5 border-t border-border pt-4 text-start text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Globe2 className="size-4" /><span className="text-foreground">{restaurant.countryName ?? "—"}</span></div>
            <div className="flex items-center gap-2 text-muted-foreground"><Clock className="size-4" /><span dir="ltr" className="text-foreground">{zone ?? "—"}</span></div>
            <div className="flex items-center gap-2 text-muted-foreground"><Store className="size-4" /><span className="text-foreground">{restaurant.currencyIsoCode ?? "—"}</span></div>
          </dl>
        </aside>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <fieldset disabled={!can("Restaurants.Edit")} className="m-0 min-w-0 border-0 p-0">
          <FormBuilder
            query={() => save}
            initialState={{ nameEn: bi.data!.en.name, nameAr: bi.data!.ar.name, contactEmail: restaurant.contactEmail ?? "", contactPhone: restaurant.contactPhone ?? "", currencyId: restaurant.currencyId, countryId: restaurant.countryId }}
            validationSchema={z.object({ nameEn: z.string().min(1, t("field_required")).max(200), nameAr: z.string().max(200).optional().nullable(), contactEmail: z.union([z.literal(""), z.string().trim().email(t("contact_email_invalid"))]).optional().nullable(), contactPhone: z.string().max(50, t("phone_too_long")).optional().nullable(), currencyId: z.string().min(1, t("field_required")), countryId: z.string().min(1, t("field_required")) })}
            valuesBody={(v: any) => ({ nameEn: v.nameEn, nameAr: strOrNull(v.nameAr), logoUrl: restaurant.logoUrl ?? null, contactEmail: strOrNull(v.contactEmail), contactPhone: strOrNull(v.contactPhone), currencyId: String(v.currencyId), countryId: String(v.countryId) })}
            refreshOnSubmit={false}
            buttonText={t("save")}
            onSuccessFunction={() => {
              refresh();
              toast.success(t("success_update"));
            }}
            fields={[
              { name: "nameEn", pairName: "nameAr", control: FieldTypes.bilingual, label: t("name"), required: true },
              { name: "contactEmail", control: FieldTypes.text, label: t("contact_email"), helpertext: t("contact_email_hint") },
              { name: "contactPhone", control: FieldTypes.text, label: t("contact_phone") },
              { name: "currencyId", control: FieldTypes.select, label: t("currency"), required: true, options: currencies.data.map((c) => ({ value: c.id, label: `${c.isoCode} · ${c.displayName}` })) },
              { name: "countryId", control: FieldTypes.select, label: t("country"), required: true, helpertext: t("country_sets_time_zone"), options: countries.data.map((c) => ({ value: c.id, label: ar && c.nameAr ? c.nameAr : c.nameEn })) },
            ]}
          />
          </fieldset>
        </div>
      </div>
    </section>
  );
}
