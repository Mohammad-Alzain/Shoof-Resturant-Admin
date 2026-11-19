import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { saveLanguage } from "@/Translation/i18n";
import { LanguagesList } from "@/Translation/languages";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = LanguagesList.find((l) => l.lang === i18n.language) ?? LanguagesList[0];

  const change = (lang: string) => {
    if (lang === current.lang) return;
    saveLanguage(lang);
    // Direction and request headers are read once per page load, so reload to apply them everywhere.
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("language")}>
          <img src={current.flag} alt="" className="size-5 rounded-full object-cover" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {LanguagesList.map((l) => (
          <DropdownMenuItem key={l.lang} onClick={() => change(l.lang)} className="gap-2">
            <img src={l.flag} alt="" className="size-4 rounded-full object-cover" />
            <span className="flex-1">{l.name}</span>
            {l.lang === current.lang && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
