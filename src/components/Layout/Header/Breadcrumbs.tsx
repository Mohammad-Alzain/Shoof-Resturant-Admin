import { Fragment, useMemo } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getDirection } from "@/Translation/i18n";

const humanize = (segment: string) =>
  decodeURIComponent(segment)
    .replace(/[-_]+/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

/** Breadcrumb trail built from the URL; each segment is looked up as a translation key first. */
export function Breadcrumbs() {
  const { t, i18n } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const rtl = getDirection() === "rtl";

  // /credit-purchases → credit_purchases, /reports/tenant-revenue → report_tenant_revenue
  const translateSegment = (segment: string) => {
    const snake = segment.replace(/-/g, "_");
    const key = [segment, snake, `report_${snake}`].find((k) => i18n.exists(k));
    return key ? t(key) : humanize(segment);
  };

  const crumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((segment, i) => ({
      href: "/" + segments.slice(0, i + 1).join("/"),
      label: /^\d+$|^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(segment) ? t("record_details") : translateSegment(segment),
    }));
  }, [pathname, t, i18n]);

  return (
    <nav aria-label={t("breadcrumb")} className="min-w-0">
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <li className="flex items-center">
          <Link to="/dashboard" aria-label={t("a11y_home")} className="transition-colors hover:text-foreground">
            <Home className="size-4" />
          </Link>
        </li>
        {crumbs.slice(1).map((crumb, i, list) => {
          const last = i === list.length - 1;
          return (
            <Fragment key={crumb.href}>
              <li aria-hidden className="flex items-center">
                <ChevronRight className={rtl ? "size-3.5 rotate-180" : "size-3.5"} />
              </li>
              <li className={last ? "truncate font-medium text-foreground" : "hidden truncate sm:block"}>
                {last ? (
                  <span aria-current="page">{crumb.label}</span>
                ) : (
                  <Link to={crumb.href} className="transition-colors hover:text-foreground">
                    {crumb.label}
                  </Link>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
