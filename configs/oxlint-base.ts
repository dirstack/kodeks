import { defineConfig } from "oxlint"

export default defineConfig({
  plugins: ["react", "typescript", "jsx-a11y", "oxc"],
  rules: {
    "react-hooks/exhaustive-deps": "off",
    "jsx-a11y/anchor-has-content": "off",
    "jsx-a11y/heading-has-content": "off",
  },
})
