import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { Wordmark } from "@/components/common/Brand";
import { EASE } from "@/components/common/Motion";

/** 404: the two plates with their pupils looking away, because the dish is not here. */
const NotFoundPage = () => {
  const { t } = useTranslation();

  // Return to the page the user came from; fall back to the dashboard when the 404 was opened directly.
  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    // Plain navigation: this page can also render outside the router.
    window.location.assign("/dashboard");
  };

  return (
    <div className="relative flex min-h-[72vh] items-center justify-center overflow-hidden p-4">
      <svg aria-hidden viewBox="0 0 400 400" className="pointer-events-none absolute -end-40 -top-40 size-[44rem] text-primary/[0.07]" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="200" cy="200" r="190" />
        <circle cx="200" cy="200" r="140" />
        <circle cx="200" cy="200" r="90" />
      </svg>

      <div className="relative z-10 w-full max-w-xl text-center">
        <motion.svg
          viewBox="0 22 86 48"
          className="mx-auto h-28 w-auto text-primary"
          role="img"
          aria-label="404"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <g fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round">
            <circle cx="23" cy="46" r="15" />
            <circle cx="63" cy="46" r="15" />
          </g>
          <motion.g
            fill="currentColor"
            initial={{ x: 0, y: 0 }}
            animate={{ x: [0, -6, -6, 5, 5, 0], y: [0, 3, 3, 4, 4, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: EASE, times: [0, 0.15, 0.4, 0.55, 0.8, 1], delay: 0.8 }}
          >
            <circle cx="27" cy="43.5" r="3.3" />
            <circle cx="67" cy="43.5" r="3.3" />
          </motion.g>
        </motion.svg>

        <motion.p
          className="font-display mt-6 text-7xl font-semibold tabular-nums text-foreground sm:text-8xl"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
        >
          404
        </motion.p>
        <motion.h1
          className="mt-3 text-2xl font-semibold text-foreground text-balance"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
        >
          {t("page_not_found") || "Page Not Found"}
        </motion.h1>
        <motion.p
          className="mx-auto mt-3 max-w-md text-base leading-relaxed text-muted-foreground"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}
        >
          {t("page_not_found_desc") || "The page you are looking for doesn't exist or has been moved."}
        </motion.p>

        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.4 }}
        >
          <button
            type="button"
            onClick={goBack}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-card transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
          >
            <ArrowLeft className="size-4 rtl:-scale-x-100" />
            {t("go_back")}
          </button>
          <a
            href="/dashboard"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            <LayoutDashboard className="size-4" />
            {t("go_to_dashboard")}
          </a>
        </motion.div>

        <Wordmark className="mx-auto mt-14 h-4 text-muted-foreground/60" />
      </div>
    </div>
  );
};

export default NotFoundPage;
