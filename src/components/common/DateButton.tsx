import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ar, enUS } from "react-day-picker/locale";
import { CalendarDays, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromIso = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : undefined;
};

/** A labelled date chip that opens a calendar in the interface language (the native date input ignores it). Value is yyyy-mm-dd or "". */
export function DateButton({ label, value, onChange, className }: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const date = value ? fromIso(value) : undefined;
  const rtl = i18n.dir() === "rtl";
  return (
    <div className={cn("flex h-10 items-center rounded-xl border border-border bg-card text-xs text-muted-foreground", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" className="flex h-full items-center gap-2 rounded-xl px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <CalendarDays className="size-4" aria-hidden />
            {label}
            <span className={cn("min-w-20 text-start text-sm", date ? "text-foreground" : "text-muted-foreground/70")}>
              {date ? date.toLocaleDateString(i18n.language, { day: "numeric", month: "short", year: "numeric" }) : t("any_date")}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={date}
            onSelect={(d) => {
              onChange(d ? toIso(d) : "");
              setOpen(false);
            }}
            locale={i18n.language.startsWith("ar") ? ar : enUS}
            dir={rtl ? "rtl" : "ltr"}
            numerals={i18n.language.startsWith("ar") ? "arab" : "latn"}
            formatters={{ formatWeekdayName: (d) => d.toLocaleDateString(i18n.language, { weekday: "narrow" }) }}
          />
        </PopoverContent>
      </Popover>
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label={t("clear")} className="me-2 grid size-6 place-items-center rounded-md hover:bg-muted">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
