import { defineConfig } from "oxlint"

export default defineConfig({
  plugins: ["react", "typescript", "jsx-a11y", "import", "oxc"],

  // Generated and vendored code is exempt from style rules.
  ignorePatterns: ["**/*.gen.ts", "**/.generated/**"],

  rules: {
    // Prefer `type` aliases over `interface` declarations.
    "typescript/consistent-type-definitions": ["error", "type"],
    // Use the generic `Array<T>` syntax instead of the `T[]` shorthand.
    "typescript/array-type": ["error", { default: "generic" }],
    // Never use `any`; reach for `unknown` and narrow instead.
    "typescript/no-explicit-any": "error",
    // Type-only imports must use `import type`.
    "typescript/consistent-type-imports": "error",
    // Compose strings with template literals, never `+` concatenation.
    "prefer-template": "error",
    // Always use strict equality, except for `== null` / `!= null` checks.
    eqeqeq: ["error", "smart"],
    // Always brace control-flow blocks.
    curly: ["error", "all"],
    // Allow empty `catch {}` for intentionally ignored failures.
    "no-empty": ["error", { allowEmptyCatch: true }],
    // Components and utilities are arrow functions, not `function` declarations.
    "func-style": ["error", "expression"],
    // Named exports only.
    "import/no-default-export": "error",
    // Use `~/*` path aliases; never relative imports.
    "no-restricted-imports": ["error", { patterns: ["./**", "../**"] }],

    // Inherited project overrides.
    "react-hooks/exhaustive-deps": "off",
    "jsx-a11y/anchor-has-content": "off",
    "jsx-a11y/heading-has-content": "off",
  },

  overrides: [
    {
      // Config files require default exports and may need relative sibling imports.
      files: ["*.config.{js,ts,mjs,cjs}", "**/*.config.{js,ts,mjs,cjs}"],
      rules: {
        "import/no-default-export": "off",
        "func-style": "off",
        "no-restricted-imports": "off",
      },
    },
    {
      // React Email templates are rendered via their default export.
      files: ["**/emails/**/*.{ts,tsx}"],
      rules: {
        "import/no-default-export": "off",
      },
    },
  ],
})
