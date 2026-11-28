import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LangSwitch, type Lang } from "@/components/common/LangSwitch";
import { cn } from "@/lib/utils";
import { FieldProps } from "../interfaces/FieldProps";
import InputContainer from "./Common/InputContainer";
import InputLabel from "./Common/InputLabel";
import { useFormLang } from "../FormLang";
import { errorId } from "@/components/ui/field-a11y";

/**
 * Two values of one text (English in `name`, Arabic in `pairName`) behind the console's language flip. Both inputs stay
 * mounted, so validation and submit see both; the switch shows which language is filled or has an error, and jumps to
 * the one with the error.
 */
function BilingualInput(props: FieldProps & { pairName?: string; multiline?: boolean; rows?: number }) {
  const { name, pairName = `${name.replace(/En$/, "")}Ar`, multiline, rows = 4 } = props;
  const [ownLang, setLang] = useState<Lang>("en");
  // Inside a form with its own content-language switch, follow it; alone, keep the field's own switch.
  const formLang = useFormLang();
  const lang = formLang?.lang ?? ownLang;
  const values = props.watch ? props.watch([name, pairName]) : [];
  const errEn = props.errors?.[name];
  const errAr = props.errors?.[pairName];

  useEffect(() => {
    if (formLang) return; // the form switch already jumps to the language with the error
    if (errAr && !errEn) setLang("ar");
    else if (errEn) setLang("en");
  }, [errEn, errAr, formLang]);

  const field = (key: string, dir: "ltr" | "rtl", active: boolean) => {
    const reg = props.register?.(key);
    const invalid = key === name ? !!errEn : !!errAr;
    const common = { id: key, ...reg, dir, "aria-invalid": invalid || undefined, "aria-describedby": invalid ? errorId(key) : undefined, disabled: props.disabled, placeholder: props.placeholder, className: dir === "rtl" ? "text-right" : "" };
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
        {formLang ? (
          <span className="rounded-md bg-muted px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">{lang === "en" ? "English" : "العربية"}</span>
        ) : (
          <LangSwitch value={lang} onChange={setLang} invalid={{ en: !!errEn, ar: !!errAr }} filled={{ en: !!values?.[0], ar: !!values?.[1] }} />
        )}
      </div>
      {field(name, "ltr", lang === "en")}
      {field(pairName, "rtl", lang === "ar")}
      {lang === "ar" && errAr?.message && (
        <p id={errorId(pairName)} role="alert" className="mt-1 text-xs text-destructive">
          {String(errAr.message)}
        </p>
      )}
    </InputContainer>
  );
}

export default BilingualInput;
