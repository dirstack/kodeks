import { defineConfig } from "oxlint"
import baseConfig from "./configs/oxlint-base.ts"

export default defineConfig({
  extends: [baseConfig],
  // The config sources are this package's deliverables: they export defaults and
  // import siblings relatively, which the shared rules forbid in app code.
  ignorePatterns: ["configs/**", "dist/**"],
  overrides: [
    {
      // The CLI ships as plain tsc output, which has no path alias resolution.
      files: ["cli/**"],
      rules: {
        "no-restricted-imports": "off",
      },
    },
  ],
})
