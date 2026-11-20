import { asset } from "@/helpers/asset";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/Layout/Header/LanguageSwitcher";
import { getDirection } from "@/Translation/i18n";
import { BrandMark, Wordmark } from "@/components/common/Brand";

const POINTS = ["stage_point_models", "stage_point_partners", "stage_point_billing"] as const;

/**
 * Shoof's mark made real: the logo is two plates seen from above, each with a pupil. Here the first plate is a real
 * dish photographed from above, and the second is the ivory plate whose pupil turns toward it ("the tasting gaze").
 * A terracotta arc with the identity's rotation cue says the dish can be turned. Logos never mirror, so neither does this.
 * Static: one ~55 kB photo plus inline vectors.
 */
function GazeOnDish({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 440" className={className} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="sh-plate">
          <circle cx="210" cy="220" r="160" />
        </clipPath>
        <filter id="sh-lift" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="22" stdDeviation="22" floodColor="#261C1A" floodOpacity="0.55" />
        </filter>
      </defs>

      {/* orbit with the rotation cue: the dish turns */}
      <g fill="none" stroke="#B95035" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="210" cy="220" r="196" strokeOpacity="0.28" strokeWidth="2" />
        <path d="M37.5 311.9A196 196 0 0 1 112 50.3" strokeWidth="4" />
        <path d="M112 50.3l-3 26M112 50.3l-25.5 -5.5" strokeWidth="4" />
      </g>
      <circle cx="37.5" cy="311.9" r="7" fill="#B95035" />

      {/* plate one: the real dish, seen from above, clipped just inside its own ceramic rim */}
      <g filter="url(#sh-lift)">
        <circle cx="210" cy="220" r="160" fill="#E9DDCF" />
        <image
          href={asset("images/login/shoof-dish.webp")}
          x="42"
          y="52"
          width="336"
          height="336"
          clipPath="url(#sh-plate)"
          preserveAspectRatio="xMidYMid slice"
        />
      </g>

      {/* plate two: the ivory plate of the mark, its pupil looking at the dish */}
      <circle cx="590" cy="220" r="128" fill="none" stroke="#FBF5E9" strokeWidth="52" />
      <circle cx="548" cy="206" r="30" fill="#FBF5E9" />
    </svg>
  );
}

/**
 * Stage colours are written out (not theme variables): the brand side must look the same in every theme and state.
 * On wide screens the art and the copy share one centred column, so they stay aligned however wide the stage gets.
 */
function Stage() {
  const { t } = useTranslation();

  return (
    <aside className="relative h-[248px] overflow-hidden bg-[#541F2D] text-[#FBF5E9] sm:h-[300px] lg:sticky lg:top-0 auth-stage">
      <img src={asset("images/login/shoof-stage.svg")} alt="" decoding="async" className="absolute inset-0 size-full object-cover" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-1/2 bg-linear-to-t from-[#261C1A]/90 via-[#261C1A]/40 to-transparent lg:block" />

      <div className="relative flex h-full flex-col p-5 sm:p-7 lg:p-10 xl:p-12">
        <div className="flex items-center gap-3">
          <BrandMark className="size-10 shadow-[0_6px_16px_-6px_rgb(20_8_10/0.6)] ring-1 ring-[#FBF5E9]/25" />
          <Wordmark className="h-[22px] text-[#FBF5E9]" />
          <span className="ms-1 hidden rounded-full border border-[#FBF5E9]/30 px-3 py-1 text-xs font-medium text-[#E9DDCF] lg:inline">
            {t("console_for_restaurants")}
          </span>
        </div>

        <div className="mx-auto flex min-h-0 w-full flex-1 flex-col lg:max-w-[40rem] lg:justify-center lg:gap-6 lg:pb-4">
          <div className="flex min-h-0 flex-1 items-center justify-center py-3 lg:flex-none lg:py-0">
            <GazeOnDish className="h-full max-h-[150px] w-auto max-w-full sm:max-h-[200px] lg:h-auto lg:max-h-[38vh] lg:w-full" />
          </div>

          <div className="hidden lg:block">
            <h2 className="font-display text-[clamp(2.25rem,2.7vw,3.25rem)] font-semibold leading-[1.15] text-balance rtl:leading-[1.45]">
              {t("stage_headline")}
            </h2>
            <p className="mt-4 max-w-[34rem] text-[1.0625rem] leading-relaxed text-[#E9DDCF] rtl:leading-[1.9]">{t("stage_subline")}</p>
            <ul className="mt-7 grid gap-3 border-t border-[#FBF5E9]/15 pt-6">
              {POINTS.map((key) => (
                <li key={key} className="flex items-center gap-3 text-[0.9375rem] text-[#FBF5E9]/90">
                  <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-[#E08A6C]" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </aside>
  );
}

/** Stage on top (phones) or beside the form (desktop), mirrored in RTL. Always the light set in the brand palette. */
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
    <div dir={getDirection()} className="auth-light auth-screen grid bg-background text-foreground lg:grid-cols-[minmax(0,1.15fr)_minmax(30rem,1fr)]">
      <Stage />

      <div className="flex flex-col">
        <div className="flex justify-end gap-1 p-4">
          <LanguageSwitcher />
        </div>

        <main className="flex flex-1 items-start justify-center px-6 pb-16 pt-4 sm:px-10 lg:items-center lg:pb-24 lg:pt-0">
          <div className="w-full max-w-[400px]">
            <h1 className="font-display text-[2rem] font-semibold leading-tight text-foreground lg:text-[2.375rem]">{title}</h1>
            {description && <p className="mt-2.5 text-base leading-relaxed text-muted-foreground">{description}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-6 text-sm">{footer}</div>}
          </div>
        </main>
      </div>
    </div>
  );
}
