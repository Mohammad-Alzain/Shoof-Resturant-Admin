/* eslint-disable react-hooks/rules-of-hooks */
// export const errorMessages = {
//     required: "mohammad tell u require filed",
//     // Add more custom error messages as needed

import { useTranslation } from "react-i18next";

interface errorMessages {
  required?: string;
  invalid_email?: string;
  invalid_type?: string;
  too_small?: string;
  too_long?: string;
  too_big?: string;
  invalid_url?: string;
  at_least?: string;
}
export const errorMessages = (): errorMessages => {
  const { t } = useTranslation();
  return {
    at_least: t("at_least"),
    required: t("require"),
    invalid_email: t("invalid_email"),
    invalid_type: t("invalid_type"),
    too_small: t("too_small"),
    too_long: t("too_long"),
    too_big: t("too_big"),
    invalid_url: t("invalid_url"),
  };
};
