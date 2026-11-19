import { getLanguage } from "@/Translation/i18n";

export const getTranslationAccessor = (str: string) => {
  return `${str}_${getLanguage()}`;
};
