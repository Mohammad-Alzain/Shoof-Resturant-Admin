import { useEffect, useState } from "react";
import { animate } from "motion/react";
import { useTranslation } from "react-i18next";
import { BadgePercent, Check, ExternalLink, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isSafeUrl } from "@/helpers/url";

type Json = Record<string, unknown>;
type Variant = "primary" | "secondary" | "success" | "warning" | "info" | "destructive";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2})?/;

export const humanizeKey = (key: string) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

/** Identifiers are never worth reading: hide `id`, `fooId`, `fooIds`, GUID-looking values and secrets. */
const isIdKey = (k: string) => /^id$|(^|[a-z0-9])Ids?$|guid|uuid|correlation|lineage|batch|signature|hash/i.test(k);
const isHiddenKey = (k: string) => isIdKey(k) || /^(accessToken|refreshToken|token|password|secret)$/i.test(k);
const isGuid = (v: unknown) => typeof v === "string" && UUID.test(v.trim());
const isEmpty = (v: unknown) => v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);

const GUID_IN_TEXT = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
/** Hides ids that appear inside a sentence. */
export const maskIds = (s: string) => s.replace(GUID_IN_TEXT, "…");

/** Numeric enums the API sends as numbers: field → translation key of each value. */
const ENUMS: Record<string, string[]> = {
  discountType: ["val_percentage", "val_fixed"],
  direction: ["val_inbound", "val_outbound"],
  approvalStatus: ["val_pending", "val_approved", "val_rejected"],
  generationStatus: ["val_pending", "val_processing", "val_ready", "val_failed", "val_cancelled"],
  sourceType: ["tenant", "api_key"],
};

/** `Lambdor.Library.Basics.Exceptions.BusinessException` → "Business exception". */
const prettyType = (v: string) => {
  if (/^[A-Za-z_]\w*(\.[A-Za-z_]\w*){2,}$/.test(v)) return humanizeKey(v.split(".").pop() ?? v).toLowerCase().replace(/^./, (c) => c.toUpperCase());
  return v;
};

const STATUS_KEY = /^(status|type|level|direction|discountType|state|kind|method|priority)$/i;
const MONEY_KEY = /price|amount|cost|discount$|total$|balance|revenue|income|fee$|paid|spent|earning|payment|refund/i;
/** Counts and credit units look like money by name ("totalCount", "usedCredits") but are plain numbers. */
const NOT_MONEY = /count|credits?|quantity|used|limit|remaining|percent|rate$|days|ms$/i;
const isMoneyKey = (k: string) => MONEY_KEY.test(k) && !NOT_MONEY.test(k);

/** The currency a record is priced in: `currencyIsoCode` / `currencyCode` / a 3-letter `currency`. */
const currencyOf = (o: Json): string | undefined => {
  for (const k of ["currencyIsoCode", "currencyCode", "currency", "isoCode"]) {
    const v = o[k];
    if (typeof v === "string" && /^[A-Za-z]{3}$/.test(v.trim())) return v.trim().toUpperCase();
  }
  return undefined;
};

/** 1250 + "USD" → "$1,250.00"; an unknown code falls back to "1,250.00 XYZ". */
export const formatMoney = (n: number, currency: string | undefined, locale: string) => {
  const opts = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  if (currency) {
    try {
      return new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: "narrowSymbol", ...opts }).format(n);
    } catch {
      return `${n.toLocaleString(locale, opts)} ${currency}`;
    }
  }
  return n.toLocaleString(locale, opts);
};

/** A number that counts up to its value when it appears (instant when motion is reduced). */
function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const c = animate(0, value, { duration: 0.9, ease: [0.16, 1, 0.3, 1], onUpdate: setShown });
    return () => c.stop();
  }, [value]);
  return <>{format(shown)}</>;
}
const MONO_KEY = /^(slug|code|keyPrefix|clientIp|ip|url|path|key|symbol|isoCode|timeZoneId|method|source|replacedByKeyPrefix)$/i;
const IMAGE_KEY = /thumbnail|image|logo|avatar|photo|icon/i;

const variantOf = (raw: string): Variant => {
  const v = raw.toLowerCase();
  if (/^(active|ready|success|succeeded|approved|completed|paid|ok|true|online|info)$/.test(v)) return /info/.test(v) ? "info" : "success";
  if (/^(pending|processing|queued|warning|warn|trial|expiring|waiting)$/.test(v)) return "warning";
  if (/^(failed|error|rejected|cancelled|canceled|expired|suspended|critical|fatal|inactive|refunded)$/.test(v)) return "destructive";
  return "secondary";
};

/** Label for a field: our translation when we have one, otherwise a readable fallback. */
export function useFieldLabel() {
  const { t, i18n } = useTranslation();
  return (key: string) => {
    const k = `field_${key}`;
    if (i18n.exists(k)) return t(k);
    const bare = key.replace(/Name$/, "");
    if (bare !== key && i18n.exists(`field_${bare}`)) return t(`field_${bare}`);
    if (i18n.exists(key)) return t(key);
    return humanizeKey(key);
  };
}

function useValueLabel() {
  const { t, i18n } = useTranslation();
  return (raw: string) => {
    const k = `val_${raw.trim().toLowerCase().replace(/[\s-]+/g, "_")}`;
    return i18n.exists(k) ? t(k) : prettyType(raw);
  };
}

/** The relative time ("2 hours ago") next to an exact date. */
const ago = (d: Date, locale: string) => {
  const diff = (d.getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [u, s] of units) if (Math.abs(diff) >= s) return rtf.format(Math.round(diff / s), u);
  return rtf.format(Math.round(diff), "second");
};

/** One value, rendered by what it is (date, flag, status, money, link, image, plain text). */
export function ValueView({ name, value, currency }: { name: string; value: unknown; currency?: string }) {
  const { t, i18n } = useTranslation();
  const valueLabel = useValueLabel();
  const dash = <span className="text-muted-foreground">—</span>;
  if (isEmpty(value)) return dash;

  if (typeof value === "boolean") {
    const active = /^is?active$/i.test(name);
    const label = active ? (value ? t("active") : t("inactive")) : value ? t("yes") : t("no");
    return (
      <Badge variant={value ? "success" : "secondary"} appearance="light" size="md" className="gap-1">
        {value ? <Check className="size-3" /> : <X className="size-3" />}
        {label}
      </Badge>
    );
  }

  if (typeof value === "number") {
    const en = ENUMS[name];
    if (en && en[value]) {
      return <Badge variant="secondary" appearance="light" size="md">{t(en[value])}</Badge>;
    }
    if (/durationMs|ms$/i.test(name)) return <span dir="ltr" className="tabular-nums">{value.toLocaleString(i18n.language)} ms</span>;
    if (/percent|rate$/i.test(name)) return <span dir="ltr" className="tabular-nums">{value.toLocaleString(i18n.language)}%</span>;
    if (isMoneyKey(name)) return <span dir="ltr" className="tabular-nums">{formatMoney(value, currency, i18n.language)}</span>;
    return <span dir="ltr" className="tabular-nums">{value.toLocaleString(i18n.language)}</span>;
  }

  if (typeof value === "string") {
    const s = value.trim();
    if (ISO.test(s) && !Number.isNaN(new Date(s).getTime()) && /(At|Date|date|On|Time|Utc)$|^(from|to|date|created|updated|expires)/.test(name)) {
      const d = new Date(s);
      const dateOnly = !s.includes("T") && !s.includes(" ");
      return (
        <span className="inline-flex flex-wrap items-baseline gap-x-2">
          <time dateTime={s} className="tabular-nums">
            {d.toLocaleDateString(i18n.language, { day: "numeric", month: "short", year: "numeric" })}
            {!dateOnly && <> · {d.toLocaleTimeString(i18n.language, { timeStyle: "short" })}</>}
          </time>
          <span className="text-xs text-muted-foreground">{ago(d, i18n.language)}</span>
        </span>
      );
    }
    if (isGuid(s)) return dash;
    if (/^\+?[\d\s().-]{7,}$/.test(s)) return <span dir="ltr" className="inline-block tabular-nums">{s}</span>;
    if (/^https?:\/\/|^\//.test(s) && isSafeUrl(s)) {
      if (IMAGE_KEY.test(name) || /\.(png|jpe?g|webp|gif|svg|avif)(\?|$)/i.test(s)) {
        return (
          <a href={s} target="_blank" rel="noreferrer noopener" className="inline-block overflow-hidden rounded-lg border border-border">
            <img src={s} alt="" loading="lazy" onError={(e) => { e.currentTarget.parentElement?.setAttribute("hidden", ""); }} referrerPolicy="no-referrer" className="size-16 object-cover" />
          </a>
        );
      }
      let host = s;
      try { host = new URL(s, window.location.origin).host; } catch { /* keep raw */ }
      return (
        <a href={s} target="_blank" rel="noreferrer noopener" dir="ltr" className="inline-flex max-w-full items-center gap-1 text-primary underline-offset-2 hover:underline">
          <span className="truncate">{host}</span>
          <ExternalLink className="size-3 shrink-0" />
        </a>
      );
    }
    if (/@/.test(s) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return <span dir="ltr" className="break-all">{s}</span>;
    if (STATUS_KEY.test(name) && s.length < 32) {
      const mono = /^method$/i.test(name);
      return (
        <Badge variant={mono ? "info" : variantOf(s)} appearance="light" size="md" className={cn(mono && "font-mono")}>
          {mono ? s : valueLabel(s)}
        </Badge>
      );
    }
    if (MONO_KEY.test(name)) return <code dir="ltr" className="break-all rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{s}</code>;
    return <span className="break-words">{maskIds(prettyType(s))}</span>;
  }
  return <span>{String(value)}</span>;
}

/** The most useful single line of a record: a name, a title, a code. */
const TITLE_KEYS = ["name", "fullName", "title", "tenantName", "planName", "nameEn", "titleEn", "matchText", "keyPrefix", "code", "email", "message"];
const pickTitle = (o: Json) => {
  for (const k of TITLE_KEYS) {
    const v = o[k];
    if (typeof v === "string" && v.trim() && !isGuid(v)) return { key: k, text: maskIds(prettyType(v.trim())) };
  }
  return null;
};

/** `used` + `limit` pairs (`monthlyUsed` / `monthlyLimit`, `creditsUsed` / `credits`) are shown as one progress meter. */
function meters(o: Json) {
  const out: { base: string; used: number; limit: number; usedKey: string; limitKey: string }[] = [];
  for (const [k, v] of Object.entries(o)) {
    const m = /^(.*?)(Used)$/.exec(k);
    if (!m || typeof v !== "number") continue;
    const base = m[1];
    const limitKey = [`${base}Limit`, base, "limit"].find((c) => c !== k && typeof o[c] === "number");
    if (limitKey) out.push({ base, used: v, limit: o[limitKey] as number, usedKey: k, limitKey });
  }
  return out;
}

function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const { i18n } = useTranslation();
  const ratio = limit > 0 ? Math.min(1, used / limit) : 0;
  const tone = ratio >= 1 ? "bg-destructive" : ratio >= 0.9 ? "bg-warning" : "bg-primary";
  return (
    <div className="rounded-xl border border-border bg-card p-3.5 sm:col-span-2">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span dir="ltr" className="text-sm font-semibold tabular-nums text-foreground">
          {used.toLocaleString(i18n.language)} <span className="font-normal text-muted-foreground">/ {limit.toLocaleString(i18n.language)}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={used}>
        <div className={cn("h-full rounded-full transition-[width] duration-700", tone)} style={{ width: `${Math.max(ratio * 100, used > 0 ? 3 : 0)}%` }} />
      </div>
    </div>
  );
}

function ListTable({ rows }: { rows: Json[] }) {
  const label = useFieldLabel();
  const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r)))).filter((c) => !isHiddenKey(c) && rows.some((r) => !isEmpty(r[c]) && !isGuid(r[c]) && typeof r[c] !== "object"));
  if (!cols.length) return null;
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-xs text-muted-foreground">
          <tr>
            {cols.map((c) => (
              <th key={c} className="whitespace-nowrap px-3 py-2 text-start font-medium">{label(c)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border align-top transition-colors hover:bg-accent/40">
              {cols.map((c) => (
                <td key={c} className={cn("px-3 py-2", String(r[c] ?? "").length < 40 && "whitespace-nowrap")}><ValueView name={c} value={r[c]} currency={currencyOf(r)} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type Tile = { key: string; amount: number; kind: "money" | "percent"; currency?: string };

/** Headline money figures: big numbers on tiles, the first one on the brand colour. */
function MoneyTiles({ tiles }: { tiles: Tile[] }) {
  const label = useFieldLabel();
  const { t, i18n } = useTranslation();
  const price = tiles.find((x) => /^(price|supportPrice|basePrice)$/i.test(x.key) && x.kind === "money");
  const effective = tiles.find((x) => /^effectivePrice$/i.test(x.key));
  const saving = price && effective && price.amount > effective.amount && price.amount > 0 ? Math.round((1 - effective.amount / price.amount) * 100) : 0;
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(10.5rem,1fr))] gap-2.5" data-testid="money-tiles">
      {tiles.map((x, i) => {
        const format = (n: number) => (x.kind === "percent" ? `${n.toLocaleString(i18n.language, { maximumFractionDigits: 2 })}%` : formatMoney(n, x.currency, i18n.language));
        const hero = i === 0;
        return (
          <div
            key={x.key}
            className={cn(
              "group/tile relative overflow-hidden rounded-xl border p-3.5 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0",
              hero ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-card",
            )}
          >
            <span aria-hidden className={cn("absolute inset-y-0 start-0 w-1", hero ? "bg-terracotta" : "bg-terracotta/60")} />
            <p className={cn("mb-1 flex items-center gap-1.5 text-xs font-medium", hero ? "text-primary-foreground/75" : "text-muted-foreground")}>
              {x.kind === "percent" && <BadgePercent className="size-3.5" />}
              {label(x.key)}
            </p>
            <p dir="ltr" className="text-start text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">
              <CountUp value={x.amount} format={format} />
            </p>
            {x.key === effective?.key && saving > 0 && (
              <Badge variant="success" appearance="light" size="sm" className="mt-1.5">{t("save_percent", { percent: `⁦${saving}%⁩`, defaultValue: "Saves {{percent}}" })}</Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Fact({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn("min-w-0 rounded-xl border border-border bg-card px-3.5 py-3 transition-[border-color,background-color,box-shadow] duration-200 hover:border-terracotta/40 hover:bg-accent/30 hover:shadow-sm", wide && "sm:col-span-2")}>
      <dt className="mb-1 text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span aria-hidden className="h-px w-4 bg-terracotta" />
        {title}
      </h3>
      {children}
    </section>
  );
}

/**
 * Renders whatever the API returns as a readable record: a heading with the name and status, then facts in cards,
 * usage as meters, nested objects as sections and lists as tables. Ids and secrets are never shown.
 */
export function RecordView({ value, bare = false, depth = 0 }: { value: unknown; bare?: boolean; depth?: number }) {
  const label = useFieldLabel();
  const { t } = useTranslation();

  if (isEmpty(value)) return <span className="text-muted-foreground">—</span>;
  if (typeof value !== "object") return <ValueView name="" value={value} />;

  if (Array.isArray(value)) {
    const objs = value.filter((v): v is Json => !!v && typeof v === "object" && !Array.isArray(v));
    if (objs.length && objs.length === value.length) return <ListTable rows={objs} />;
    return (
      <div className="flex flex-wrap gap-1.5">
        {value.filter((v) => !isGuid(v)).map((v, i) => (
          <Badge key={i} variant="secondary" appearance="light" size="md">{String(v)}</Badge>
        ))}
      </div>
    );
  }

  const o = value as Json;
  const entries = Object.entries(o).filter(([k, v]) => !isHiddenKey(k) && !isEmpty(v) && !isGuid(v));
  if (!entries.length) return <span className="text-muted-foreground">—</span>;

  const pairs = meters(o);
  const used = new Set(pairs.flatMap((p) => [p.usedKey, p.limitKey]));
  const title = !bare && depth === 0 ? pickTitle(o) : null;
  // Header badges: only flags that read well alone (a raw status number means nothing without a legend).
  const flags = !bare && depth === 0 ? ["isActive", "status", "level"].filter((k) => typeof o[k] === "boolean" || (typeof o[k] === "string" && !isEmpty(o[k]))) : [];
  const cur = currencyOf(o);
  const discountIsPercent = o.discountType === 0 || o.discountType === "Percentage";
  const tiles: Tile[] = entries
    .filter(([k, v]) => typeof v === "number" && !used.has(k) && ((isMoneyKey(k) && v !== 0) || (/^discount(Value)?$/i.test(k) && v !== 0)))
    .map(([k, v]) => {
      const percent = /^discount(Value)?$/i.test(k) && discountIsPercent;
      return { key: k, amount: v as number, kind: percent ? ("percent" as const) : ("money" as const), currency: percent ? undefined : cur };
    });
  const hide = new Set<string>([...used, ...flags, ...(title ? [title.key] : []), ...tiles.map((x) => x.key), ...(tiles.length ? ["discountType"] : [])]);

  const facts = entries.filter(([k, v]) => !hide.has(k) && (typeof v !== "object" || v === null));
  const nested = entries.filter(([k, v]) => !hide.has(k) && v !== null && typeof v === "object");

  return (
    <div className={cn("space-y-5", depth > 0 && "space-y-3")}>
      {(title || flags.length > 0) && (
        <header className="flex flex-wrap items-center gap-2.5">
          {title && <h2 className="font-display text-lg font-semibold leading-tight tracking-tight text-foreground">{title.text}</h2>}
          {flags.map((k) => (
            <ValueView key={k} name={k} value={o[k]} />
          ))}
        </header>
      )}

      {tiles.length > 0 && <MoneyTiles tiles={tiles} />}

      {(facts.length > 0 || pairs.length > 0) && (
        <dl className="grid gap-2.5 sm:grid-cols-2">
          {pairs.map((p) => (
            <Meter key={p.usedKey} label={label(p.limitKey)} used={p.used} limit={p.limit} />
          ))}
          {facts.map(([k, v]) => (
            <Fact key={k} label={label(k)} wide={typeof v === "string" && v.length > 70}>
              <ValueView name={k} value={v} currency={cur} />
            </Fact>
          ))}
        </dl>
      )}

      {nested.map(([k, v]) => {
        const inner = !Array.isArray(v) && Object.entries(v as Json).filter(([ik, iv]) => !isHiddenKey(ik) && !isEmpty(iv) && !isGuid(iv));
        // `{ id, name }` references collapse into one fact instead of an empty section.
        if (inner && inner.length === 1 && typeof inner[0][1] !== "object") {
          return (
            <dl key={k}>
              <Fact label={label(k)}><ValueView name={inner[0][0]} value={inner[0][1]} /></Fact>
            </dl>
          );
        }
        return (
          <Section key={k} title={label(k)}>
            <RecordView value={v} depth={depth + 1} bare />
          </Section>
        );
      })}

      {!facts.length && !nested.length && !pairs.length && !tiles.length && !title && <p className="text-sm text-muted-foreground">{t("no_data")}</p>}
    </div>
  );
}

export default RecordView;
