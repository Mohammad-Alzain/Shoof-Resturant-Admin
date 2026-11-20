import { asset } from "@/helpers/asset";
import { lazy, Suspense, useState, useSyncExternalStore, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/Layout/Header/LanguageSwitcher";
import { getDirection } from "@/Translation/i18n";
import { BrandMark, Wordmark } from "@/components/common/Brand";

// three.js is ~180 kB gzipped: it loads after the form is already usable.
const Dish3D = lazy(() => import("./Dish3D"));

const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const MEZZE = ["mezze_hummus", "mezze_muhammara", "mezze_tabbouleh", "mezze_olives", "mezze_labneh"] as const;

/**
 * The sufra: the 3D dish is served in daylight on a glazed plate and a brass tray, and the mezze bowls are set around it.
 * The cloth is za'atar green; the copy sits on a green scrim at the bottom so it reads over the scene.
 */
function Stage() {
  const { t } = useTranslation();
  const reduced = useSyncExternalStore(subscribeMotion, prefersReducedMotion, () => false);
  const [unsupported, setUnsupported] = useState(false);

  return (
    <aside className="relative h-[260px] overflow-hidden bg-[#1f3a2a] text-[#f4f7ee] sm:h-[320px] lg:h-auto lg:min-h-screen">
      <div className="absolute inset-0">
        {unsupported ? (
          <img src={asset("images/login/sufra-still.png")} alt="" className="size-full object-cover" />
        ) : (
          <Suspense fallback={null}>
            <Dish3D
              reducedMotion={reduced}
              ariaLabel={t("stage_aria")}
              mezze={MEZZE.map((k) => t(k))}
              onUnsupported={() => setUnsupported(true)}
            />
          </Suspense>
        )}
      </div>

      {/* top and bottom scrims in the cloth's own green, so the lockup and the copy read over the table */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#132619]/70 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-[#102016]/92 via-[#132619]/55 to-transparent" />

      <div className="pointer-events-none relative flex h-full flex-col justify-between p-5 sm:p-7 lg:p-12">
        <div className="flex items-center gap-3">
          <BrandMark className="size-10 shadow-[0_6px_18px_-6px_rgb(0_0_0/0.45)]" />
          <Wordmark className="h-[22px] text-brand-ivory" />
          <span className="ms-1 hidden rounded-full bg-brand-burgundy px-2.5 py-1 text-[0.6875rem] font-medium text-brand-ivory lg:inline">{t("console_for_restaurants")}</span>
        </div>

        <div className="hidden max-w-lg lg:block">
          <h2 className="font-display text-[3.25rem] font-semibold leading-[1.08] text-balance">{t("stage_headline")}</h2>
          <p className="mt-4 max-w-md text-[1.0625rem] leading-relaxed text-[#d6e3d2]">{t("stage_subline")}</p>
          <p className="mt-6 flex items-center gap-2 text-xs text-[#b7c8b4]">
            <span aria-hidden className="size-1.5 rounded-full bg-[#e0b23a]" />
            {t("stage_demo_note")}
          </p>
        </div>
      </div>
    </aside>
  );
}

/** Stage on top (phones) or beside the form (desktop), mirrored in RTL. Always the light set: a daylight table. */
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
  return (
    <div dir={getDirection()} className="auth-light grid min-h-screen bg-background text-foreground lg:grid-cols-[1.25fr_1fr]">
      <Stage />

      <div className="flex flex-col">
        <div className="flex justify-end gap-1 p-4">
          <LanguageSwitcher />
        </div>

        <main className="flex flex-1 items-start justify-center px-6 pb-16 pt-2 sm:px-10 lg:items-center lg:pt-0">
          <div className="w-full max-w-[380px]">
            <h1 className="font-display text-[2rem] font-semibold leading-tight text-foreground">{title}</h1>
            {description && <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">{description}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-6 text-sm">{footer}</div>}
          </div>
        </main>
      </div>
    </div>
  );
}
