import moment from "moment";

export const formatDateTime = (date: string, language: string) => {
  moment.updateLocale("ar", {
    monthsShort: [
      "ينا",
      "فبر",
      "مار",
      "أبر",
      "ماي",
      "يون",
      "يول",
      "أغس",
      "سبت",
      "أكت",
      "نوف",
      "ديس",
    ],
  });

  moment.locale("ar");

  return moment(date).locale(language).format("YYYY-MMM-DD HH:MM");
};
