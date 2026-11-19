"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import TiptapExtensions from "@/lib/tiptap-extensions";
import { TiptapToolbar } from "./tiptap-toolbar";
import { FieldProps } from "../../interfaces/FieldProps";
import InputContainer from "../Common/InputContainer";
import InputLabel from "../Common/InputLabel";
import { useTranslation } from "react-i18next";
import { getDirection } from "@/Translation/i18n";
export default function TiptapEditorImpl({
  name,
  onChange,
  value,
  ...props
}: FieldProps) {
  const editor = useEditor({
    extensions: TiptapExtensions,
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        ...(props.label ? { "aria-label": props.label } : {}),
        class:
          "prose dark:prose-invert min-h-[300px] max-h-[500px] overflow-y-auto p-4 focus:outline-none rounded-b-md",
      },
    },
  });

  // Update editor content when value changes
  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);
  const { t } = useTranslation();
  if (!editor) {
    return null;
  }

  return (
    <InputContainer style={props?.style} className={props?.className}>
      <InputLabel
        className={props?.labelClassName}
        toolTipText={props.toolTipText}
        required={props.required}
        label={props.label}
        variant={props?.toolTipVariant}
      />

      <div className="w-full mx-auto border border-gray-200 dark:border-gray-700 rounded-md shadow-sm mt-2">
        {/* Only render toolbar + editor when ready */}
        {editor ? (
          <>
            <TiptapToolbar editor={editor} />
            <EditorContent dir={getDirection()} editor={editor} />
            <input type="hidden" name={name} value={editor.getHTML()} />
          </>
        ) : (
          <div className="p-4 text-gray-500 dark:text-gray-400">{t("initializing_editor")}</div>
        )}
      </div>
    </InputContainer>
  );
}
