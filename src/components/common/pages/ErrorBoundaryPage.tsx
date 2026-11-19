import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { RefreshCw, TriangleAlert, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/common/Brand";

/** A code-split chunk that no longer exists (new deployment, stale tab) or could not be downloaded. */
const isChunkError = (error?: Error) =>
  /dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk/i.test(error?.message ?? "");

/**
 * Catch-all for render errors. A stale-chunk error is not shown as an error at all: the page reloads once
 * to fetch the new build and only falls back to this screen if that did not help.
 */
const ErrorBoundaryPage = ({ error, reset }: { error: Error; reset: () => void }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const stale = isChunkError(error);

  useEffect(() => {
    if (!stale) return;
    const last = Number(sessionStorage.getItem("chunk-reload") ?? 0);
    if (Date.now() - last > 15_000) {
      sessionStorage.setItem("chunk-reload", String(Date.now()));
      window.location.reload();
    }
  }, [stale]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-page p-4">
      <div role="alert" className="relative w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-card">
        <BrandMark className="absolute -top-5 start-1/2 size-10 -translate-x-1/2 shadow-card rtl:translate-x-1/2" />
        <span className="mx-auto mb-5 mt-3 flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          {stale ? <RefreshCw className="size-7" /> : <TriangleAlert className="size-7" />}
        </span>
        <h1 className="font-display text-2xl font-bold text-foreground">
          {stale ? t("page_update_title") : t("something_went_wrong")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {stale ? t("page_update_body") : t("error_occurred_desc")}
        </p>

        <div className="mt-7 flex flex-col gap-2.5">
          <Button
            variant="primary"
            size="lg"
            onClick={() => (stale ? window.location.reload() : reset())}
          >
            <RefreshCw />
            {stale ? t("reload_page") : t("try_again")}
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate({ to: "/dashboard" })}>
            <LayoutDashboard />
            {t("go_to_dashboard")}
          </Button>
        </div>

        {import.meta.env.DEV && !stale && (
          <pre className="mt-6 max-h-40 overflow-auto rounded-lg bg-muted p-3 text-start text-xs text-muted-foreground">
            {error?.stack}
          </pre>
        )}
      </div>
    </div>
  );
};

export default ErrorBoundaryPage;
