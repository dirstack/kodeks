import { defineConfig } from "oxlint"
import baseConfig from "./oxlint-base.ts"

export default defineConfig({
  extends: [baseConfig],
  plugins: ["nextjs"],
  rules: {
    "nextjs/no-img-element": "off",
    "nextjs/no-html-link-for-pages": "off",
  },
})
