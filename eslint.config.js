import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { globalIgnores } from "eslint/config";

export default tseslint.config([
  globalIgnores(["dist", ".eslintrc.cjs"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      {
        // Manually apply react-hooks recommended config with our custom rules
        plugins: {
          "react-hooks": reactHooks,
        },
        rules: {
          "react-hooks/rules-of-hooks": "error",
          "react-hooks/exhaustive-deps": "warn",
        },
      },
      {
        // Manually apply react-refresh config
        plugins: {
          "react-refresh": reactRefresh,
        },
        rules: {
          "react-refresh/only-export-components": [
            "warn",
            { allowConstantExport: true },
          ],
        },
      },
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
      },
      parser: tseslint.parser,
      parserOptions: {
        project: true,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);
