import { defineConfig } from "oxlint"
import baseConfig from "./oxlint-base.ts"

export default defineConfig({
  extends: [baseConfig],

  // `ignorePatterns` is not inherited through `extends`, so it is repeated here
  // for consumers that spread this config.
  ignorePatterns: ["**/*.gen.ts", "**/.generated/**"],

  overrides: [
    {
      // TanStack Router route components are conventionally declared as named
      // `function` declarations and wired up via `createFileRoute(...)`.
      files: ["**/routes/**/*.{ts,tsx}"],
      rules: {
        "func-style": "off",
      },
    },
  ],
})
