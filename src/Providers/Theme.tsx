/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  /** What is actually painted right now (system resolved). */
  resolvedTheme: "dark" | "light";
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

const readStored = (key: string, fallback: Theme): Theme => {
  try {
    const stored = localStorage.getItem(key);
    return stored === "dark" || stored === "light" || stored === "system" ? stored : fallback;
  } catch {
    return fallback;
  }
};

const systemPrefersDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => readStored(storageKey, defaultTheme));
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  // Follow the OS while the user has chosen "system".
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme: "dark" | "light" =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const value = useMemo<ThemeProviderState>(
    () => ({
      theme,
      resolvedTheme,
      setTheme: (next) => {
        try {
          localStorage.setItem(storageKey, next);
        } catch {
          /* storage unavailable (private mode): the choice lasts for this session only */
        }
        setThemeState(next);
      },
    }),
    [theme, resolvedTheme, storageKey],
  );

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
