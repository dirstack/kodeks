# @underpin/config

## 1.12.0

### Minor Changes

- The package is renamed from `@dirstack/kodeks` to `@underpin/config`, and its CLI from `kodeks` to `underpin`. `@dirstack/kodeks` stays on npm at 1.11.0. ([775d4d8](https://github.com/dirstack/kodeks/commit/775d4d86bc0b75e8368b88274a997681f3a0b47c))

  To move over, replace the package name in your `package.json` and in every path that names it, such as `node_modules/@dirstack/kodeks/configs/...` in `lefthook.json` and `commitlint.json`, `@dirstack/kodeks/oxlint` in `oxlint.config.ts` and `@dirstack/kodeks/changesets-changelog` in `.changeset/config.json`. The rest keeps working:

  - The CLI is also installed as `kodeks`, so scripts and workflows that call `kodeks` run the new package.
  - The config file is now `underpin.release.json`. A repository that only has `kodeks.release.json` is read as before, and `underpin sync-public` writes the mirror's config under the name the mirror already uses.
  - `underpin changesets init` writes `@underpin/config/changesets-changelog`.
  - The `public-sync.yml` workflow runs `@underpin/config` when the monorepo lists it, and `@dirstack/kodeks` when it lists only that name.
  - The `public-release.yml` workflow's default `publish-command` is now `bun run underpin publish`, which only runs a locally installed CLI and never fetches a package from npm. A caller that bumps its pin to this release while it still depends on `@dirstack/kodeks` must pass `publish-command: bunx kodeks publish`, or rename its dependency in the same change.
- `kodeks sync-public` now replaces only the package directories it lists. Other packages in the mirror stay, where it used to delete the mirror's whole `packages` directory. A package removed from the list now stays in the mirror until you delete it there. ([651f3be](https://github.com/dirstack/kodeks/commit/651f3be997ccf467d492504fbe9a6a33bcf05fda))

  The new `sync.packagesOnly` option (`--packages-only`) writes only those package directories and leaves every root file in the mirror alone, the generated `.gitignore` and `kodeks.release.json` included. Use it for a public monorepo that owns its root files and develops packages of its own next to the mirrored ones.

## 1.11.0

### Minor Changes

- Add a `publish-command` input to the `public-release.yml` workflow. It sets the command that publishes and defaults to `bunx kodeks publish`. ([9528574](https://github.com/dirstack/kodeks/commit/952857417c91d0a8e8e07d71e58f95e2f86513ab))

### Patch Changes

- Document that the `version-command` input of the `public-version.yml` workflow runs without a shell. Put several commands in a `package.json` script. ([0eb8722](https://github.com/dirstack/kodeks/commit/0eb8722c159a7e731d26bea5978dc1973dc5f9e3))
