"use client";

import type React from "react";

import { useCallback, useState } from "react";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react"; // Import useEditorState
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  CodeIcon,
  MinusIcon,
  UndoIcon,
  RedoIcon,
  LinkIcon,
  UnlinkIcon,
  SubscriptIcon,
  SuperscriptIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  AlignJustifyIcon,
  PaletteIcon,
  HighlighterIcon,
  EraserIcon,
  ImageIcon,
  Video,
  TrashIcon,
  ChevronDownIcon,
  UnderlineIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

interface TiptapToolbarProps {
  editor: Editor | null;
}

// const FONT_SIZES = [
//   "12px",
//   "14px",
//   "16px",
//   "18px",
//   "20px",
//   "24px",
//   "28px",
//   "32px",
//   "36px",
//   "48px",
//   "64px",
//   "72px",
// ];

export function TiptapToolbar({ editor }: TiptapToolbarProps) {
  if (!editor) return null;
  return <TiptapToolbarInner editor={editor} />;
}

function TiptapToolbarInner({ editor }: { editor: Editor }) {
  const { t } = useTranslation();
  const [linkUrl, setLinkUrl] = useState("");
  const [imageSrc, setImageSrc] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageWidth, setImageWidth] = useState<string>("");
  const [imageHeight, setImageHeight] = useState<string>("");

  const [embedUrl, setEmbedUrl] = useState("");
  const [embedWidth, setEmbedWidth] = useState<string>("");
  const [embedHeight, setEmbedHeight] = useState<string>("");

  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isEmbedDialogOpen, setIsEmbedDialogOpen] = useState(false);

  const editorState = useEditorState({
        editor,
        selector: (ctx) => ({
          isBold: ctx.editor.isActive("bold"),
          canBold: ctx.editor.can().toggleBold(),
          isItalic: ctx.editor.isActive("italic"),
          canItalic: ctx.editor.can().toggleItalic(),
          isStrike: ctx.editor.isActive("strike"),
          canStrike: ctx.editor.can().toggleStrike(),
          isUnderline: ctx.editor.isActive("underline"),
          canUnderline: ctx.editor.can().toggleUnderline(),
          isCode: ctx.editor.isActive("code"),
          canCode: ctx.editor.can().toggleCode(),
          isSubscript: ctx.editor.isActive("subscript"),
          canSubscript: ctx.editor.can().toggleSubscript(),
          isSuperscript: ctx.editor.isActive("superscript"),
          canSuperscript: ctx.editor.can().toggleSuperscript(),
          canClearMarks: ctx.editor.can().unsetAllMarks(),
          isParagraph: ctx.editor.isActive("paragraph"),
          isHeading1: ctx.editor.isActive("heading", { level: 1 }),
          isHeading2: ctx.editor.isActive("heading", { level: 2 }),

          isHeading3: ctx.editor.isActive("heading", { level: 3 }),
          isHeading4: ctx.editor.isActive("heading", { level: 4 }),
          isHeading5: ctx.editor.isActive("heading", { level: 5 }),
          isHeading6: ctx.editor.isActive("heading", { level: 6 }),
          canSetHorizontalRule: ctx.editor.can().setHorizontalRule(),
          isCodeBlock: ctx.editor.isActive("codeBlock"),
          canToggleCodeBlock: ctx.editor.can().toggleCodeBlock(),
          isAlignLeft: ctx.editor.isActive({ textAlign: "left" }),
          isAlignCenter: ctx.editor.isActive({ textAlign: "center" }),
          isAlignRight: ctx.editor.isActive({ textAlign: "right" }),
          isAlignJustify: ctx.editor.isActive({ textAlign: "justify" }),
          canUndo: ctx.editor.can().undo(),
          canRedo: ctx.editor.can().redo(),
          isLinkActive: ctx.editor.isActive("link"),
          currentFontSize: ctx.editor.getAttributes("textStyle").fontSize,
        }),
      });
  const setLink = useCallback(() => {
    if (!editor) return;
    if (editorState.isLinkActive) {
      editor.chain().focus().unsetLink().run();
      setLinkUrl("");
      setIsLinkDialogOpen(false);
      return;
    }

    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl, target: "_blank" }).run();
      setLinkUrl("");
      setIsLinkDialogOpen(false);
    }
  }, [editor, linkUrl, editorState.isLinkActive]);

  // const handleImageFileChange = useCallback(
  //   (e: React.ChangeEvent<HTMLInputElement>) => {
  //     if (e.target.files && e.target.files[0]) {
  //       setImageFile(e.target.files[0]);
  //       setImageSrc(""); // Clear URL if file is selected
  //     } else {
  //       setImageFile(null);
  //     }
  //   },
  //   []
  // );

  const insertImage = useCallback(() => {
    if (!editor) return;

    const attrs: any = { src: "" };
    if (imageWidth) attrs.width = imageWidth;
    if (imageHeight) attrs.height = imageHeight;

    if (imageFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        attrs.src = reader.result as string;
        editor.chain().focus().setImage(attrs).run();
        setImageFile(null);
        setImageWidth("");
        setImageHeight("");
        setIsImageDialogOpen(false);
      };
      reader.readAsDataURL(imageFile);
    } else if (imageSrc) {
      attrs.src = imageSrc;
      editor.chain().focus().setImage(attrs).run();
      setImageSrc("");
      setImageWidth("");
      setImageHeight("");
      setIsImageDialogOpen(false);
    }
  }, [editor, imageSrc, imageFile, imageWidth, imageHeight]);

  const insertEmbed = useCallback(() => {
    if (!editor || !embedUrl) return;
    const attrs: { src: string; width?: string; height?: string } = {
      src: embedUrl,
    };
    if (embedWidth) attrs.width = embedWidth;
    if (embedHeight) attrs.height = embedHeight;

    // editor.chain().focus().setEmbed(attrs).run();
    setEmbedUrl("");
    setEmbedWidth("");
    setEmbedHeight("");
    setIsEmbedDialogOpen(false);
  }, [editor, embedUrl, embedWidth, embedHeight]);

  const clearFormatting = useCallback(() => {
    editor?.chain().focus().unsetAllMarks().run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div
      role="toolbar"
      aria-label={t("a11y_editor_toolbar")}
      className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-md"
    >
      {/* Headings & Paragraph */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            title={t("textStyle")}
            className="w-[90px] overflow-hidden"
          >
            {editorState.isHeading1 && "H1"}
            {editorState.isHeading2 && "H2"}
            {editorState.isHeading3 && "H3"}
            {editorState.isHeading4 && "H4"}
            {editorState.isHeading5 && "H5"}
            {editorState.isHeading6 && "H6"}
            {editorState.isParagraph && t("paragraph")}
            {!editorState.isHeading1 &&
              !editorState.isHeading2 &&
              !editorState.isHeading3 &&
              !editorState.isHeading4 &&
              !editorState.isHeading5 &&
              !editorState.isHeading6 &&
              !editorState.isParagraph &&
              t("style")}
            <ChevronDownIcon className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[30px] ">
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={editorState.isParagraph ? "is-active" : ""}
          >
            {t("paragraph")}
          </DropdownMenuItem>
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <DropdownMenuItem
              key={level}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .toggleHeading({ level: Number(level) as any })
                  .run()
              }
              className={
                editorState[`isHeading${level}` as keyof typeof editorState]
                  ? "is-active"
                  : ""
              }
            >
              {t("heading")} {level}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Font Size */}
      {/* <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            aria-label={t("a11y_t_font_size")}
          >
            {editorState.currentFontSize || "Size"}
            <ChevronDownIcon className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[100px]">
          {FONT_SIZES.map((size) => (
            <DropdownMenuItem
              key={size}
              onClick={() => editor.chain().focus().setFontSize(size).run()}
              className={
                editorState.currentFontSize === size ? "is-active" : ""
              }
            >
              {size}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem
            onClick={() => editor.chain().focus().unsetFontSize().run()}
          >
            Reset
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu> */}

      {/* Text Formatting */}
      <Toggle
        size="sm"
        pressed={editorState.isBold}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label={t("a11y_t_toggle_bold")}
        type="button"
        disabled={!editorState.canBold}
      >
        <BoldIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editorState.isItalic}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label={t("a11y_t_toggle_italic")}
        type="button"
        disabled={!editorState.canItalic}
      >
        <ItalicIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editorState.isStrike}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        aria-label={t("a11y_t_toggle_strikethrough")}
        type="button"
        disabled={!editorState.canStrike}
      >
        <StrikethroughIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editorState.isUnderline}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        aria-label={t("a11y_t_toggle_underline")}
        type="button"
        disabled={!editorState.canUnderline}
      >
        <UnderlineIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editorState.isCode}
        onPressedChange={() => editor.chain().focus().toggleCode().run()}
        aria-label={t("a11y_t_toggle_inline_code")}
        type="button"
        disabled={!editorState.canCode}
      >
        <CodeIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editorState.isSubscript}
        onPressedChange={() => editor.chain().focus().toggleSubscript().run()}
        aria-label={t("a11y_t_toggle_subscript")}
        type="button"
        disabled={!editorState.canSubscript}
      >
        <SubscriptIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editorState.isSuperscript}
        onPressedChange={() => editor.chain().focus().toggleSuperscript().run()}
        aria-label={t("a11y_t_toggle_superscript")}
        type="button"
        disabled={!editorState.canSuperscript}
      >
        <SuperscriptIcon className="h-4 w-4" />
      </Toggle>

      {/* Clear Formatting */}
      <Button
        variant="outline"
        size="sm"
        onClick={clearFormatting}
        aria-label={t("clearFormatting")}
        type="button"
        disabled={!editorState.canClearMarks}
      >
        <EraserIcon className="h-4 w-4" />
      </Button>

      {/* Horizontal Rule & Code Block */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        aria-label={t("insertHorizontalRule")}
        type="button"
        disabled={!editorState.canSetHorizontalRule}
      >
        <MinusIcon className="h-4 w-4" />
      </Button>
      <Toggle
        size="sm"
        pressed={editorState.isCodeBlock}
        onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
        aria-label={t("a11y_t_toggle_code_block")}
        type="button"
        disabled={!editorState.canToggleCodeBlock}
      >
        <CodeIcon className="h-4 w-4" />
      </Toggle>

      {/* Alignment */}
      <Toggle
        size="sm"
        pressed={editorState.isAlignLeft}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("left").run()
        }
        aria-label={t("a11y_t_align_left")}
        type="button"
      >
        <AlignLeftIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editorState.isAlignCenter}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("center").run()
        }
        aria-label={t("a11y_t_align_center")}
        type="button"
      >
        <AlignCenterIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editorState.isAlignRight}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("right").run()
        }
        aria-label={t("a11y_t_align_right")}
        type="button"
      >
        <AlignRightIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editorState.isAlignJustify}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("justify").run()
        }
        aria-label={t("a11y_t_align_justify")}
        type="button"
      >
        <AlignJustifyIcon className="h-4 w-4" />
      </Toggle>

      {/* Color and Highlight Color */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            aria-label={t("textColor")}
            type="button"
            variant="outline"
          >
            <PaletteIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <Input
            type="color"
            defaultValue="#000000"
            onChange={(event) =>
              editor.chain().focus().setColor(event.target.value).run()
            }
            aria-label={t("selectTextColor")}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().unsetColor().run()}
            className="mt-2 w-full"
            type="button"
          >
            {t("resetColor")}
          </Button>
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            aria-label={t("highlightColor")}
            type="button"
            variant="outline"
          >
            <HighlighterIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <Input
            type="color"
            defaultValue="#FFFF00"
            onChange={(event) =>
              editor
                .chain()
                .focus()
                .setHighlight({ color: event.target.value })
                .run()
            }
            aria-label={t("selectHighlightColor")}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().unsetHighlight().run()}
            className="mt-2 w-full"
            type="button"
          >
            {t("resetHighlight")}
          </Button>
        </PopoverContent>
      </Popover>

      {/* Undo/Redo */}
      <Button
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editorState.canUndo}
        aria-label={t("undo")}
        type="button"
        variant="outline"
        title={t("undo")}
      >
        <UndoIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editorState.canRedo}
        aria-label={t("redo")}
        type="button"
        title={t("redo")}
      >
        <RedoIcon className="h-4 w-4" />
      </Button>

      {/* Link */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            type="button"
            aria-label={t("addEditLink")}
            variant="outline"
            title={t("addEditLink")}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editorState.isLinkActive ? t("editLink") : t("addLink")}
            </DialogTitle>
            <DialogDescription>{t("enterLinkUrl")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="link-url" className="text-right">
                {t("url")}
              </Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="col-span-3"
                placeholder="https://example.com"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            {editorState.isLinkActive && (
              <Button
                variant="outline"
                onClick={() => editor.chain().focus().unsetLink().run()}
                type="button"
              >
                <UnlinkIcon className="h-4 w-4 mr-2" /> {t("removeLink")}
              </Button>
            )}
            <Button onClick={setLink} type="button" variant="outline">
              {editorState.isLinkActive ? t("updateLink") : t("addLink")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            type="button"
            aria-label={t("insertImage")}
            title={t("insertImage")}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("insertImage")}</DialogTitle>
            <DialogDescription>{t("enterLinkUrl")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image-url" className="text-right">
                {t("url")}
              </Label>
              <Input
                id="image-url"
                value={imageSrc}
                onChange={(e) => {
                  setImageSrc(e.target.value);
                  setImageFile(null); // Clear file if URL is being typed
                }}
                className="col-span-3"
                placeholder="https://example.com/image.jpg"
                disabled={!!imageFile} // Disable if a file is selected
              />
            </div>
            {/* <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image-file" className="text-right">
                Upload File
              </Label>
              <Input
                id="image-file"
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="col-span-3"
                disabled={!!imageSrc} // Disable if URL is being typed
              />
            </div> */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image-width" className="text-right">
                {t("width")}
              </Label>
              <Input
                id="image-width"
                type="text"
                value={imageWidth}
                onChange={(e) => setImageWidth(e.target.value)}
                className="col-span-3"
                placeholder={t("widthPlaceholder")}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image-height" className="text-right">
                {t("height")}
              </Label>
              <Input
                id="image-height"
                type="text"
                value={imageHeight}
                onChange={(e) => setImageHeight(e.target.value)}
                className="col-span-3"
                placeholder={t("heightPlaceholder")}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={insertImage}
              type="button"
              disabled={!imageSrc && !imageFile}
            >
              {t("insertImage")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Embed (Twitter, YouTube, Facebook, Instagram) */}
      <Dialog open={isEmbedDialogOpen} onOpenChange={setIsEmbedDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            type="button"
            aria-label={t("insertEmbed")}
            title={t("insertEmbed")}
          >
            <Video className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("insertEmbed")}</DialogTitle>
            <DialogDescription>{t("insertEmbedDescription")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="embed-url" className="text-right">
                {t("url")}
              </Label>
              <Input
                id="embed-url"
                value={embedUrl}
                onChange={(e) => setEmbedUrl(e.target.value)}
                className="col-span-3"
                placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="embed-width" className="text-right">
                {t("width")}
              </Label>
              <Input
                id="embed-width"
                type="text"
                value={embedWidth}
                onChange={(e) => setEmbedWidth(e.target.value)}
                className="col-span-3"
                placeholder={t("widthPlaceholder")}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="embed-height" className="text-right">
                {t("height")}
              </Label>
              <Input
                id="embed-height"
                type="text"
                value={embedHeight}
                onChange={(e) => setEmbedHeight(e.target.value)}
                className="col-span-3"
                placeholder={t("heightPlaceholder")}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={insertEmbed} type="button">
              {t("insertEmbed")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear Editor */}
      <Button
        size="sm"
        onClick={() => editor.chain().focus().clearContent().run()}
        aria-label={t("clearEditor")}
        variant="mono"
        type="button"
        title={t("clearEditor")}
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
