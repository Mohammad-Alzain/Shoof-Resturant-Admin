import { useTranslation } from "react-i18next";

/** Translates a key and re-renders when the language changes. Must be called at the top level of a component. */
export const useTranslated = (key: string) => {
  const { t } = useTranslation();
  return t(key);
};
