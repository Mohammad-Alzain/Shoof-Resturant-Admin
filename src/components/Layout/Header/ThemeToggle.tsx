import { Moon, Sun, Monitor, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, type Theme } from "@/Providers/Theme";

const OPTIONS: { value: Theme; icon: typeof Sun; labelKey: string }[] = [
  { value: "light", icon: Sun, labelKey: "theme_light" },
  { value: "dark", icon: Moon, labelKey: "theme_dark" },
  { value: "system", icon: Monitor, labelKey: "theme_system" },
];

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const Icon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("theme")}>
          <Icon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {OPTIONS.map(({ value, icon: Item, labelKey }) => (
          <DropdownMenuItem key={value} onClick={() => setTheme(value)} className="gap-2">
            <Item className="size-4" />
            <span className="flex-1">{t(labelKey)}</span>
            {theme === value && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
