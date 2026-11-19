import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import Global/Core translations
import GlobalEn from "./data/en/global.json";
import GlobalAr from "./data/ar/global.json";

// Import Custom/Client translations
import CustomEn from "./data/en/custom.json";
import CustomAr from "./data/ar/custom.json";

const I18N_CONFIG_KEY =
  import.meta.env.VITE_APP_I18N_CONFIG_KEY || "shoof-restaurant-i18n";

export function getLanguage() {
  try {
    // A shared link can force the language: /login?lang=ar
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (fromUrl === "ar" || fromUrl === "en") {
      localStorage.setItem(I18N_CONFIG_KEY, fromUrl);
      return fromUrl;
    }
    return localStorage.getItem(I18N_CONFIG_KEY) || "en";
  } catch {
    return "en"; // storage blocked
  }
}

export function saveLanguage(lang: string) {
  localStorage.setItem(I18N_CONFIG_KEY, lang);
}

// Initialize i18n with a merged resource strategy
i18n.use(initReactI18next).init({
  fallbackLng: "en",
  resources: {
    en: {
      translation: {
        ...GlobalEn,
        ...CustomEn,
      },
    },
    ar: {
      translation: {
        ...GlobalAr,
        ...CustomAr,
      },
    },
  },
  lng: getLanguage(),
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export const getDirection = () => {
  if (i18n.language === "ar") return "rtl";
  return "ltr";
};

export default i18n;
