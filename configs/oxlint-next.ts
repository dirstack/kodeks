import { defineConfig } from "oxlint"
import baseConfig from "./oxlint-base.ts"

export default defineConfig({
  extends: [baseConfig],

  // `ignorePatterns` is not inherited through `extends`, so it is repeated here
  // for consumers that spread this config.
  ignorePatterns: ["**/*.gen.ts", "**/.generated/**"],

  plugins: ["nextjs"],
  rules: {
    "nextjs/no-img-element": "off",
    "nextjs/no-html-link-for-pages": "off",
  },

  overrides: [
    {
      // Next.js framework files must use default exports and may use function
      // declarations, both required by the framework's file conventions.
      files: [
        "**/app/**/{page,layout,loading,error,global-error,not-found,template,default,route,sitemap,robots,manifest,opengraph-image,twitter-image,icon,apple-icon}.{ts,tsx,js,jsx}",
        "**/pages/**/*.{ts,tsx,js,jsx}",
        "**/middleware.{ts,js}",
        "**/instrumentation.{ts,js}",
        "**/proxy.{ts,tsx}",
      ],
      rules: {
        "import/no-default-export": "off",
        "func-style": "off",
      },
    },
  ],
})
