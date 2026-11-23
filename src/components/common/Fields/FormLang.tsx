import { createContext, useContext } from "react";
import type { Lang } from "@/components/common/LangSwitch";

/**
 * The content language of a whole form. A form with bilingual fields (English + Arabic pairs) has one switch at its top,
 * and every bilingual field shows that language: the owner writes all the English, then flips once and writes all the
 * Arabic, instead of flipping field by field. `null` outside such a form: a field then keeps its own switch.
 */
export const FormLangContext = createContext<{ lang: Lang } | null>(null);

export const useFormLang = () => useContext(FormLangContext);
