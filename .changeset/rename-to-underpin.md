---
"@underpin/kodeks": minor
---

The package is renamed from `@dirstack/kodeks` to `@underpin/kodeks`. Replace the name in your `package.json` and in every path that names it, such as `node_modules/@dirstack/kodeks/configs/...` in `lefthook.json` and `commitlint.json`, `@dirstack/kodeks/oxlint` in `oxlint.config.ts` and `@dirstack/kodeks/changesets-changelog` in `.changeset/config.json`. Nothing else changes. `@dirstack/kodeks` stays on npm at 1.11.0.

`kodeks changesets init` writes `@underpin/kodeks/changesets-changelog`. The `public-sync.yml` workflow runs `@underpin/kodeks` when the monorepo lists it, and `@dirstack/kodeks` when it lists only that name.
