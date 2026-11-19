export interface LanguageItem {
  lang: "en" | "ar";
  name: string;
  flag: string;
}

/** Languages the console supports (spec: English / Arabic with RTL). */
export const LanguagesList: LanguageItem[] = [
  { lang: "en", name: "English", flag: `${import.meta.env.BASE_URL}media/flags/united-states.svg` },
  { lang: "ar", name: "العربية", flag: `${import.meta.env.BASE_URL}media/flags/syria.svg` },
];
