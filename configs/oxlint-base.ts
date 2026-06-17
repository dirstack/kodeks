import { defineConfig } from "oxlint"

export default defineConfig({
  plugins: ["react", "typescript", "jsx-a11y", "import", "oxc"],

  // Generated and vendored code is exempt from style rules.
  ignorePatterns: ["**/*.gen.ts", "**/.generated/**"],

  rules: {
    // Prefer `interface` declarations over `type` aliases for object shapes.
    "typescript/consistent-type-definitions": ["error", "interface"],
    // Use the `T[]` shorthand instead of the generic `Array<T>` syntax.
    "typescript/array-type": ["error", { default: "array" }],
    // Never use `any`; reach for `unknown` and narrow instead.
    "typescript/no-explicit-any": "error",
    // Type-only imports must use `import type`.
    "typescript/consistent-type-imports": "error",
    // Compose strings with template literals, never `+` concatenation.
    "prefer-template": "error",
    // Always use strict equality, except for `== null` / `!= null` checks.
    eqeqeq: ["error", "smart"],
    // Brace control-flow blocks only when the body is on its own line.
    // Single-line guards like `if (!raw) return null` stay unbraced.
    curly: ["error", "multi-line"],
    // Allow empty `catch {}` for intentionally ignored failures.
    "no-empty": ["error", { allowEmptyCatch: true }],
    // Named functions (components, utilities) use `function` declarations.
    // Inline callbacks passed as arguments are exempt and stay as arrows.
    "func-style": ["error", "declaration"],
    // Named exports only.
    "import/no-default-export": "error",
    // No namespace imports like `import * as React`; use named imports.
    "import/no-namespace": "error",
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
