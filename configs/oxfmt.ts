import { defineConfig } from "oxfmt"

export default defineConfig({
  ignorePatterns: ["*.{md,mdx}", "*.gen.ts"],
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: false,
  singleQuote: false,
  trailingComma: "all",
  bracketSpacing: true,
  arrowParens: "avoid",
  sortImports: {
    groups: [
      ["side_effect"],
      ["value-builtin", "type-builtin"],
      ["value-external", "type-external"],
      ["value-internal", "type-internal"],
    ],
    newlinesBetween: false,
  },
})
