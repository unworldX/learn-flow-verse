import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // Generated or build outputs that should not be linted
    ignores: [
      "dist",
      "web-dist",
      // Supabase generated database types can be very large and trip parsers
      "src/integrations/supabase/types.ts",
      // Supabase functions often use Node runtimes and separate configs
      "supabase/functions/**",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // Relax a few noisy rules for this mixed web/electron project
      "@typescript-eslint/no-unused-vars": "off",
      // Permit "any" where pragmatic; tighten gradually later
      "@typescript-eslint/no-explicit-any": "off",
      // Prefer-const changes can be handled over time
      "prefer-const": "warn",
    },
  }
);
