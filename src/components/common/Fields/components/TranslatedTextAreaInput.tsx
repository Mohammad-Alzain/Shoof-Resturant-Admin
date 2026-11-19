import React, { useState } from "react";
import { FieldProps as FieldPropsInterface } from "../interfaces/FieldProps";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { LanguagesList } from "@/Translation/languages";
import TextAreaInput from "./TextArea";

interface TranslatedTextInputProps extends Omit<FieldPropsInterface, "name"> {
  name: string;
  mode?: "all" | "switcher";
}

function TranslatedTextInput({
  name,
  mode = "switcher",
  ...props
}: TranslatedTextInputProps) {
  // Store values for each language
  const [values, setValues] = useState<{ [key: string]: string }>(
    LanguagesList.reduce((acc, lang) => ({ ...acc, [lang.lang]: "" }), {})
  );
  const [activeLang, setActiveLang] = useState(LanguagesList[0]);

  // Handle input change for the active language
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({
      ...prev,
      [activeLang.lang]: e.target.value,
    }));
    if (props?.register) {
      props.register(`${name}.${activeLang.lang}`)?.onChange(e);
      if (typeof props?.afterChangeFunction === "function") {
        props?.afterChangeFunction(props?.getValues());
      }
    }
  };

  if (mode === "all") {
    return (
      <div className="space-y-4">
        {LanguagesList.map((lang) => (
          <TextAreaInput
            key={lang.lang}
            {...props}
            name={`${name}.${lang.lang}`}
            label={`${props.label} (${lang.name.toUpperCase()})`}
            value={values[lang.lang]}
            onChange={handleInputChange}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="">
      {/* Enhanced Language Switcher */}
      <div className="flex flex-wrap gap-2  p-2 rounded-lg ">
        {LanguagesList.map((lang) => (
          <Button
            key={lang.lang}
            type="button"
            size="sm"
            className={clsx(
              " rounded-sm px-2 py-2 text-xs font-medium transition-all duration-200",
              activeLang.lang === lang.lang
                ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
            )}
            onClick={() => setActiveLang(lang)}
          >
            {lang.lang.toUpperCase()}
          </Button>
        ))}
      </div>

      <TextAreaInput
        {...props}
        name={`${name}.${activeLang.lang}`}
        label={`${props.label}`}
        value={values[activeLang.lang]}
        onChange={handleInputChange}
      />
    </div>
  );
}

export default TranslatedTextInput;
