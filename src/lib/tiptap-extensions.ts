import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Image from "@tiptap/extension-image"; // Import base Image extension
import CharacterCount from "@tiptap/extension-character-count";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Node } from "@tiptap/core";
import { mergeAttributes } from "@tiptap/react";

const FontSize = TextStyle.extend({
  name: "fontSize",

  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize || null,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) {
            return {};
          }
          return {
            style: `font-size: ${attributes.fontSize}`,
          };
        },
      },
    };
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ commands }) => {
          return commands.updateAttributes("textStyle", {
            fontSize,
          });
        },
      unsetFontSize:
        () =>
        ({ commands }) => {
          return commands.resetAttributes("textStyle", "");
        },
    };
  },
});

// Custom Image Extension to handle width and height attributes, and wrap in a div for alignment
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(), // Inherit all attributes from the base Image extension
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute("width"),
        renderHTML: (attributes) => {
          return attributes.width ? { width: attributes.width } : {};
        },
      },
      height: {
        default: null,
        parseHTML: (element) => element.getAttribute("height"),
        renderHTML: (attributes) => {
          return attributes.height ? { height: attributes.height } : {};
        },
      },
      // Add textAlign attribute so it's recognized and passed to renderHTML
      textAlign: {
        default: null,
        parseHTML: (element) => element.style.textAlign || null, // Parse from inline style
        renderHTML: (attributes) => {
          return attributes.textAlign
            ? { style: `text-align: ${attributes.textAlign}` }
            : {};
        },
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    // Extract width, height, and textAlign from HTMLAttributes
    const { width, height, textAlign, ...restAttributes } = HTMLAttributes;

    return [
      "div", // Wrapper div
      mergeAttributes(restAttributes, {
        class: `image-wrapper`, // Add a specific class for styling
        style: textAlign ? `text-align: ${textAlign}` : null, // Apply text-align directly as inline style
      }),
      ["img", { ...restAttributes, width, height }], // The actual img tag
    ];
  },
});

// Custom Embed Node for Twitter, YouTube, Facebook, Instagram
const Embed = Node.create({
  name: "embed",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: "560",
      },
      height: {
        default: "315",
      },
      frameborder: {
        default: "0",
      },
      allowfullscreen: {
        default: "true",
        parseHTML: (element) => element.hasAttribute("allowfullscreen"),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "iframe",
        getAttrs: (node) => {
          if (typeof node === "string") return {};
          const src = node.getAttribute("src");
          if (
            src &&
            (src.includes("youtube.com") ||
              src.includes("twitter.com/i/cards") ||
              src.includes("facebook.com/plugins/post.php") ||
              src.includes("instagram.com/p/"))
          ) {
            return {
              src: src,
              width: node.getAttribute("width"),
              height: node.getAttribute("height"),
              frameborder: node.getAttribute("frameborder"),
              allowfullscreen: node.hasAttribute("allowfullscreen"),
            };
          }
          return false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["iframe", mergeAttributes(HTMLAttributes)];
  },

  // addCommands() {
  //   return {
  //     setEmbed:
  //       (options: { src: string; width?: string; height?: string }) =>
  //       ({ commands }) => {
  //         return commands.insertContent({
  //           type: this.name,
  //           attrs: options,
  //         });
  //       },
  //   };
  // },
});

export const TiptapExtensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3, 4, 5, 6],
    },
    bulletList: false,
    orderedList: false,
    listItem: false,
    blockquote: false,
    codeBlock: {
      HTMLAttributes: {
        class: "bg-gray-900 text-white p-4 rounded-md overflow-x-auto",
      },
    },
  }),
  Link.configure({
    openOnClick: false,
    validate: (href) => /^https?:\/\//.test(href),
  }),
  Color,
  Highlight.configure({ multicolor: true }),
  TextStyle,
  FontSize,
  Underline,
  Subscript,
  Superscript,
  CustomImage.configure({
    inline: true, // Keep as false, as we're wrapping it in a block div
    allowBase64: true,
  }),
  CharacterCount.configure({
    limit: 10000,
  }),
  TextAlign.configure({
    types: ["heading", "paragraph", "image"], // Ensure 'image' is included
  }),
  Placeholder.configure({
    placeholder: "",
  }),
  Embed,
];

export default TiptapExtensions;
