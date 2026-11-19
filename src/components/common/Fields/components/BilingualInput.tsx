import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LangSwitch, type Lang } from "@/components/common/LangSwitch";
import { cn } from "@/lib/utils";
import { FieldProps } from "../interfaces/FieldProps";
import InputContainer from "./Common/InputContainer";
import InputLabel from "./Common/InputLabel";

/**
 * Two values of one text (English in `name`, Arabic in `pairName`) behind the console's language flip. Both inputs stay
 * mounted, so validation and submit see both; the switch shows which language is filled or has an error, and jumps to
 * the one with the error.
 */
function BilingualInput(props: FieldProps & { pairName?: string; multiline?: boolean; rows?: number }) {
  const { name, pairName = `${name.replace(/En$/, "")}Ar`, multiline, rows = 4 } = props;
  const [lang, setLang] = useState<Lang>("en");
  const values = props.watch ? props.watch([name, pairName]) : [];
  const errEn = props.errors?.[name];
  const errAr = props.errors?.[pairName];

  useEffect(() => {
    if (errAr && !errEn) setLang("ar");
    else if (errEn) setLang("en");
  }, [errEn, errAr]);

  const field = (key: string, dir: "ltr" | "rtl", active: boolean) => {
    const reg = props.register?.(key);
    const invalid = key === name ? !!errEn : !!errAr;
    const common = { id: key, ...reg, dir, "aria-invalid": invalid || undefined, disabled: props.disabled, placeholder: props.placeholder, className: dir === "rtl" ? "text-right" : "" };
    return (
      <div key={key} className={cn(!active && "hidden")}>
        {multiline ? <Textarea rows={rows} {...common} /> : <Input {...common} className={cn("h-[42px] text-base", common.className)} />}
      </div>
    );
  };

  return (
    <InputContainer className={cn(props.className, "w-full")}>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <InputLabel htmlFor={lang === "en" ? name : pairName} required={props.required} label={props.label} toolTipText={props.toolTipText} className={props.labelClassName} variant={props.toolTipVariant} />
        <LangSwitch value={lang} onChange={setLang} invalid={{ en: !!errEn, ar: !!errAr }} filled={{ en: !!values?.[0], ar: !!values?.[1] }} />
      </div>
      {field(name, "ltr", lang === "en")}
      {field(pairName, "rtl", lang === "ar")}
      {lang === "ar" && errAr?.message && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {String(errAr.message)}
        </p>
      )}
    </InputContainer>
  );
}

export default BilingualInput;
