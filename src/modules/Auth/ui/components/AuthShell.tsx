import { asset } from "@/helpers/asset";
import { lazy, Suspense, useState, useSyncExternalStore, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/Layout/Header/LanguageSwitcher";
import { getDirection } from "@/Translation/i18n";
import { BrandLockup } from "@/components/common/Brand";

// three.js is ~180 kB gzipped: it loads after the form is already usable.
const Dish3D = lazy(() => import("./Dish3D"));

const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const POINTS = ["stage_point_models", "stage_point_billing", "stage_point_partners"] as const;
const LAYERS = ["layer_bun_bottom", "layer_patty", "layer_cheese", "layer_tomato", "layer_lettuce", "layer_bun_top"] as const;

/**
 * The stage tells the product story live: a scan plane turns the raw mesh of the dish into the finished 3D model.
 */
function Stage() {
  const { t } = useTranslation();
  const reduced = useSyncExternalStore(subscribeMotion, prefersReducedMotion, () => false);
  const [unsupported, setUnsupported] = useState(false);

  return (
    <aside className="relative h-[300px] overflow-hidden bg-[#120a08] text-white lg:h-auto lg:min-h-screen">
      <div className="absolute inset-0 bg-[#120a08]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0d0706]/90 via-[#0d0706]/40 to-transparent" />

      <div className="absolute inset-0">
        {unsupported ? (
          <img src={asset("images/login/burger.jpg")} alt="" className="size-full object-cover opacity-70" />
        ) : (
          <Suspense fallback={null}>
            <Dish3D
              reducedMotion={reduced}
              ariaLabel={t("stage_aria")}
              labels={LAYERS.map((k) => t(k))}
              onUnsupported={() => setUnsupported(true)}
            />
          </Suspense>
        )}
      </div>

      <div className="pointer-events-none relative flex h-full flex-col justify-between p-6 lg:p-10">
        <BrandLockup markClassName="size-10" />

        <div className="hidden lg:block">
          <h2 className="max-w-md font-display text-[2.75rem] font-bold leading-[1.06] text-balance">{t("stage_headline")}</h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/80">{t("stage_subline")}</p>
          <ul className="mt-5 grid max-w-xl grid-cols-3 gap-5 border-t border-white/15 pt-4 text-[12.5px] leading-snug text-white/75">
            {POINTS.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>

        </div>
      </div>
    </aside>
  );
}

/** Stage on top (phones) or beside the form (desktop), mirrored in RTL. */
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
    <div dir={getDirection()} className="auth-dark grid min-h-screen bg-background text-foreground lg:grid-cols-[1.4fr_1fr]">
      <Stage />

      <div className="flex flex-col">
        <div className="flex justify-end gap-1 p-4">
          <LanguageSwitcher />
        </div>

        <main className="flex flex-1 items-center justify-center px-6 pb-16 pt-4 sm:px-10">
          <div className="w-full max-w-[380px]">
            <h1 className="font-display text-3xl font-bold text-foreground">{title}</h1>
            {description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-6 text-sm">{footer}</div>}
          </div>
        </main>
      </div>
    </div>
  );
}
