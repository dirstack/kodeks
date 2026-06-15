import { defineConfig } from "oxlint"

// Tailwind v4 canonical-class linting via oxlint JS plugins (alpha).
// Add-on config — compose alongside another config and point the plugin at the
// project's CSS entry, e.g.:
//
//   extends: [tanstackConfig, tailwindConfig],
//   settings: { "better-tailwindcss": { entryPoint: "src/styles.css" } },
//
// Requires `eslint-plugin-better-tailwindcss` installed in the consuming project.
export default defineConfig({
  jsPlugins: ["eslint-plugin-better-tailwindcss"],
  rules: {
    "better-tailwindcss/enforce-canonical-classes": "warn",
    "better-tailwindcss/no-unnecessary-whitespace": "warn",
  },
})
