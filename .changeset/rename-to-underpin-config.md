---
"@underpin/config": minor
---

The package is renamed from `@dirstack/kodeks` to `@underpin/config`, and its CLI from `kodeks` to `underpin`. `@dirstack/kodeks` stays on npm at 1.11.0.

To move over, replace the package name in your `package.json` and in every path that names it, such as `node_modules/@dirstack/kodeks/configs/...` in `lefthook.json` and `commitlint.json`, `@dirstack/kodeks/oxlint` in `oxlint.config.ts` and `@dirstack/kodeks/changesets-changelog` in `.changeset/config.json`. The rest keeps working:

- The CLI is also installed as `kodeks`, so scripts and workflows that call `kodeks` run the new package.
- The config file is now `underpin.release.json`. A repository that only has `kodeks.release.json` is read as before, and `underpin sync-public` writes the mirror's config under the name the mirror already uses.
- `underpin changesets init` writes `@underpin/config/changesets-changelog`.
- The `public-sync.yml` workflow runs `@underpin/config` when the monorepo lists it, and `@dirstack/kodeks` when it lists only that name.
- The `public-release.yml` workflow's default `publish-command` is now `bun run underpin publish`, which only runs a locally installed CLI and never fetches a package from npm. A caller that bumps its pin to this release while it still depends on `@dirstack/kodeks` must pass `publish-command: bunx kodeks publish`, or rename its dependency in the same change.
