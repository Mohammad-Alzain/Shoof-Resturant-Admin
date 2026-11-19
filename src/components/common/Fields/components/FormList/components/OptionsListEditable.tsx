import React from "react";
import { FieldProps } from "@/components/common/Fields/interfaces/FieldProps";
import { useFieldArray } from "react-hook-form";
import { Trash, Add } from "iconsax-react";
import { useTranslation } from "react-i18next";

export const OptionsListEditable = (props: FieldProps) => {
  const { t } = useTranslation();

  const { append, remove, fields } = useFieldArray({
    control: props.controlField,
    name: props.name,
  });

  // Use watch to get reactive values (re-renders on toggle change)
  const watchedOptions =
    typeof props.watch === "function" ? props.watch(props.name) || [] : [];

  return (
    <div className="w-full space-y-3 mt-2 mb-6">
      {fields.map((item, index) => {
        const isCorrect = Boolean(watchedOptions[index]?.is_correct);

        return (
          <div
            key={item.id}
            className={`group relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 bg-white dark:bg-card shadow-sm
              ${
                isCorrect
                  ? "border-emerald-400 bg-emerald-50/50 shadow-emerald-100"
                  : "border-gray-200 dark:border-gray-700 hover:border-indigo-200 hover:bg-indigo-50/20"
              }`}
          >
            {/* Letter badge */}
            <div
              className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-200
                ${isCorrect ? "bg-emerald-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}
            >
              {String.fromCharCode(65 + index)}
            </div>

            {/* Option text input */}
            <input
              type="text"
              {...(props.register
                ? props.register(`${props.name}.${index}.option_text`)
                : {})}
              placeholder={t("enter_option", "Enter option text...")}
              className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 min-w-0"
            />

            {/* Correct toggle */}
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`text-xs font-medium transition-colors duration-200 ${
                  isCorrect ? "text-emerald-700" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {t("is_correct", "Correct")}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (props.setValue) {
                    const newValue = !isCorrect;

                    // If setting this one to correct, deselect all other options
                    if (newValue === true) {
                      fields.forEach((_, i) => {
                        if (i !== index) {
                          props.setValue(
                            `${props.name}.${i}.is_correct`,
                            false,
                            {
                              shouldDirty: true,
                            },
                          );
                        }
                      });
                    }

                    props.setValue(
                      `${props.name}.${index}.is_correct`,
                      newValue,
                      {
                        shouldDirty: true,
                        shouldValidate: true,
                      },
                    );
                  }
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1
                  ${isCorrect ? "bg-emerald-500" : "bg-gray-200"}`}
                aria-pressed={isCorrect}
                aria-label={t("is_correct", "Correct")}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-card shadow ring-0 transition duration-200 ease-in-out
                    ${
                      isCorrect
                        ? "ltr:translate-x-4 rtl:-translate-x-4"
                        : "translate-x-0"
                    }`}
                />
              </button>
            </div>

            {/* Remove button */}
            <button
              type="button"
              onClick={() => remove(index)}
              className="shrink-0 p-1.5 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-all duration-150"
              title={t("remove_option", "Remove option")}
            >
              <Trash size={18} variant="Linear" color="currentColor" />
            </button>
          </div>
        );
      })}

      {/* Add option button */}
      <button
        type="button"
        onClick={() => append({ option_text: "", is_correct: false })}
        className="flex items-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-500 hover:border-indigo-400 hover:bg-indigo-50/40 hover:text-indigo-600 transition-all duration-200 text-sm font-medium"
      >
        <Add size={18} variant="Linear" color="currentColor" />
        {t("add_option", "Add Option")}
      </button>
    </div>
  );
};
