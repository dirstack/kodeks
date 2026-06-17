import { defineConfig } from "oxlint"
import baseConfig from "./configs/oxlint-base.ts"

export default defineConfig({
  extends: [baseConfig],
  // The config sources are this package's deliverables: they export defaults and
  // import siblings relatively, which the shared rules forbid in app code.
  ignorePatterns: ["configs/**", "dist/**"],
})
