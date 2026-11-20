import { asset } from "@/helpers/asset";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/Layout/Header/LanguageSwitcher";
import { getDirection } from "@/Translation/i18n";
import { BrandLogo } from "@/components/common/Brand";

/**
 * The dish column, as in the brand book's landing study: one dish, soft side light, a calm linen ground that lets it
 * breathe. The slogan sits on a warm-paper fade at the foot of the photo. Colours are written out: this column looks the
 * same in every theme.
 */
function DishColumn() {
  const { t } = useTranslation();

  return (
    <aside className="relative h-[220px] overflow-hidden bg-[#d9b089] sm:h-[280px] lg:sticky lg:top-0 lg:order-last auth-stage">
      <img
        src={asset("images/login/shoof-dish.webp")}
        alt={t("stage_photo_alt")}
        width={880}
        height={1100}
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 size-full object-cover object-[50%_45%] lg:object-[50%_68%]"
      />

      <span className="absolute end-4 top-4 rounded-full bg-[#FBF5E9]/85 px-3 py-1 text-xs font-medium text-[#261C1A] backdrop-blur-sm lg:end-8 lg:top-8">
        {t("stage_caption")}
      </span>

      <div className="absolute inset-x-0 bottom-0 hidden bg-linear-to-t from-[#E9DDCF] via-[#E9DDCF]/85 to-transparent px-12 pb-12 pt-40 lg:block xl:px-16 xl:pb-16">
        <p className="font-display text-[clamp(2.5rem,3.4vw,4rem)] font-semibold leading-[1.1] text-[#261C1A] rtl:leading-[1.27]">
          {t("stage_headline")}
        </p>
        <p className="mt-3 max-w-md text-lg leading-relaxed text-[#261C1A]/80">{t("stage_subline")}</p>
      </div>
    </aside>
  );
}

/**
 * Sign-in: warm ivory carries the form and the logo (Arabic lockup in Arabic, Latin wordmark in English), the dish
 * column sits beside it on desktop and above it on phones. Mirrored in RTL; the logo itself never mirrors.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div dir={getDirection()} className="auth-light auth-screen grid bg-[#FBF5E9] text-[#261C1A] lg:grid-cols-2">
      <DishColumn />

      <div className="flex min-h-full flex-col px-6 sm:px-10 lg:px-14 xl:px-20">
        <header className="flex items-center justify-between gap-4 py-5 lg:py-8">
          <div className="flex items-center gap-4">
            <BrandLogo gaze className="h-9 text-[#541F2D]" />
            <span aria-hidden className="h-6 w-px bg-[#261C1A]/15" />
            <span className="text-sm font-medium text-[#261C1A]/70">{t("console_for_restaurants")}</span>
          </div>
          <LanguageSwitcher />
        </header>

        <main className="flex flex-1 items-start justify-center pb-16 pt-6 lg:items-center lg:pb-24 lg:pt-0">
          <div className="w-full max-w-[400px]">
            <h1 className="font-display text-[2rem] font-semibold leading-tight lg:text-[2.5rem] rtl:leading-[1.35]">{title}</h1>
            {description && <p className="mt-2.5 text-base leading-relaxed text-muted-foreground">{description}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-6 text-sm">{footer}</div>}
          </div>
        </main>
      </div>
    </div>
  );
}
