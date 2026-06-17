import { defineConfig } from "oxlint"
import baseConfig from "./oxlint-base.ts"

export default defineConfig({
  extends: [baseConfig],

  // `ignorePatterns` is not inherited through `extends`, so it is repeated here
  // for consumers that spread this config.
  ignorePatterns: ["**/*.gen.ts", "**/.generated/**"],

  overrides: [
    {
      // TanStack Start entry files must default-export the server handler.
      files: ["**/{server,start,ssr}.{ts,tsx}"],
      rules: {
        "import/no-default-export": "off",
      },
    },
  ],
})
