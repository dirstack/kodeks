# Kodeks

[![npm version](https://img.shields.io/npm/v/%40dirstack%2Fkodeks.svg)](https://www.npmjs.com/package/@dirstack/kodeks)
[![license](https://img.shields.io/npm/l/%40dirstack%2Fkodeks.svg)](https://github.com/dirstack/kodeks/blob/main/LICENSE)

Shared linter configurations and release tooling for TypeScript projects.

Kodeks provides reusable, opinionated configurations for maintaining consistent code quality across TypeScript projects, plus a `kodeks` CLI for publishing public packages from a private monorepo.

## Usage

### oxlint

```bash
bun add -d @dirstack/kodeks oxlint
```

Create a `.oxlintrc.json` file in your project root:

```json
{
  "extends": ["./node_modules/@dirstack/kodeks/configs/oxlint-base.json"]
}
```

For Next.js projects, use the Next.js preset:

```json
{
  "extends": ["./node_modules/@dirstack/kodeks/configs/oxlint-next.json"]
}
```

For TanStack projects, use the TanStack preset:

```json
{
  "extends": ["./node_modules/@dirstack/kodeks/configs/oxlint-tanstack.json"]
}
```

### oxfmt

```bash
bun add -d @dirstack/kodeks oxfmt
```

Since oxfmt does not support configuration inheritance, you have two options:

**Option 1: Reference via CLI flag**

Add to your `package.json` scripts:

```json
{
  "scripts": {
    "format": "oxfmt --config ./node_modules/@dirstack/kodeks/configs/oxfmt.json --write ."
  }
}
```

**Option 2: Copy configuration locally**

```bash
cp ./node_modules/@dirstack/kodeks/configs/oxfmt.json ./.oxfmtrc.json
```

### Commitlint

```bash
bun add -d @dirstack/kodeks @commitlint/cli @commitlint/config-conventional
```

Create a `commitlint.json` file in your project root:

```json
{
  "extends": ["./node_modules/@dirstack/kodeks/configs/commitlint.json"]
}
```

### Semantic Release

```bash
bun add -d @dirstack/kodeks semantic-release conventional-changelog-conventionalcommits
```

Create a `release.json` file in your project root:

```json
{
  "extends": "@dirstack/kodeks/semantic-release"
}
```

A dry-run variant is also available for CI validation:

```json
{
  "extends": "@dirstack/kodeks/semantic-release-dry-run"
}
```

### Lefthook

```bash
bun add -d @dirstack/kodeks lefthook
```

Create a `lefthook.json` file in your project root and extend the hooks you need:

```json
{
  "extends": [
    "node_modules/@dirstack/kodeks/configs/lefthook-oxlint.json",
    "node_modules/@dirstack/kodeks/configs/lefthook-oxfmt.json",
    "node_modules/@dirstack/kodeks/configs/lefthook-commitlint.json"
  ]
}
```

**Available hooks:**
- `lefthook-oxlint.json` — Lints and fixes staged files with oxlint (pre-commit)
- `lefthook-oxfmt.json` — Formats staged files with oxfmt (pre-commit)
- `lefthook-commitlint.json` — Validates commit messages (commit-msg)
- `lefthook-typescript.json` — Type checks with tsc (pre-commit)

## Publishing public packages from a private monorepo

npm only attests [provenance](https://docs.npmjs.com/generating-provenance-statements) for packages published from a public repository. A private monorepo that ships public client packages therefore publishes them from a public mirror repository. Kodeks provides the commands and reusable GitHub workflows for that setup.

### How it flows

1. **Version (monorepo).** A pushed changeset opens or updates a "Version Packages" pull request. Merging it bumps the versions and writes the changelogs on `main`.
2. **Sync (monorepo to mirror).** The version bump on `main` runs `kodeks sync-public`, which copies the listed packages and root files into a checkout of the mirror and pushes the result.
3. **Release (mirror).** The sync commit runs the mirror's release workflow. It builds every package and runs `kodeks publish`, which publishes each version that is not on npm yet and creates its GitHub Release.

`kodeks publish` skips versions that are already on npm, so a sync that changes no version publishes nothing. The dist-tag follows the version: `1.2.3` publishes under `latest`, `1.2.3-beta.0` under `beta` and is marked as a GitHub prerelease. A stable version below the current `latest`, such as a `1.0.1` backport after `2.0.0`, publishes under `latest-1`, so `latest` never moves backwards. `kodeks publish` passes `--provenance`, so a publish that cannot attest provenance fails instead of succeeding without it.

The `releaseTag` setting picks the release tags. With `"version"`, one release tagged `v<version>` lists every package, and `kodeks publish` stops before publishing when the packages have different versions. With `"package"`, each package gets its own release tagged `<name>@<version>`. The default is `"version"` for one package and `"package"` for several.

A re-run recovers a release that failed after its packages reached npm. For a version that is already on npm, `kodeks publish` reads the commit npm recorded at publish time (`gitHead`). It creates the missing release at that commit only when the commit belongs to the mirror. A version published by hand, or by an earlier setup, gets no release.

### Setup in the monorepo

```bash
bun add -d @dirstack/kodeks @changesets/cli
```

Each public package publishes from its built `dist` directory. Run `kodeks prepare-package` after the bundler, so `dist/package.json` points at the built files:

```json
{
  "scripts": {
    "build": "tsdown && kodeks prepare-package"
  }
}
```

`kodeks prepare-package [dir]` rewrites the entry points from `./src/*.ts` to `./*.js` and `./*.d.ts`, including nested conditions such as `react-server`. It points `main`, `module` and `types` at the root export's built files, and drops them when the package has no root export. It also replaces `workspace:` ranges with the sibling package versions, removes `files`, `scripts`, `devDependencies` and `publishConfig.directory`, and copies the package's own `README.md` and `LICENSE` into `dist`.

Create a `kodeks.release.json` in the repository root. The commands read their defaults from this file, and command-line flags override them:

```json
{
  "packages": ["core", "sdk", "react"],
  "releaseTag": "version",
  "sync": {
    "packages": ["core", "sdk", "react", "tsconfig"],
    "licenseFrom": "packages/sdk/LICENSE",
    "extra": ["scripts/mirror/root:."]
  }
}
```

| Field | Default | Description |
| --- | --- | --- |
| `packagesDir` | `"packages"` | Directory that holds the package directories, in both repositories. |
| `packages` | | Package directories to publish, in publish order. |
| `releaseTag` | `"version"` for one package, `"package"` for several | `"version"` tags one `v<version>` release for packages released in lockstep. `"package"` tags one `<name>@<version>` release per package. |
| `sync.packages` | `packages` | Package directories to mirror. Add shared private packages the public ones build with, such as a `tsconfig` package. |
| `sync.licenseFrom` | | File copied to the mirror's root `LICENSE`. |
| `sync.extra` | | Files or directories copied into the mirror, as `"source"` (same path) or `"source:destination"`. A directory merges into the destination. Files git ignores inside a directory are skipped, and an extra file that git ignores is an error. |
| `sync.exclude` | | Names skipped at any depth, on top of `dist`, `node_modules` and `.turbo`. |

Keep the mirror's root files in the monorepo and list them in `sync.extra`. In the example above, `scripts/mirror/root/` holds the mirror's `README.md` and `package.json`. The mirror's `package.json` builds the public packages and needs Kodeks:

```json
{
  "name": "acme-js",
  "private": true,
  "type": "module",
  "workspaces": ["packages/*"],
  "packageManager": "bun@1.3.14",
  "scripts": {
    "build": "bun run --filter '@acme/core' --filter '@acme/sdk' --filter '@acme/react' build"
  },
  "devDependencies": {
    "@dirstack/kodeks": "^1.9.0",
    "tsdown": "^0.22.3",
    "typescript": "^6.0.3"
  }
}
```

On every sync, `kodeks sync-public` replaces the mirror's `packages` directory with the package files git does not ignore, so a local `.env` never reaches the mirror. It only runs in a git repository, and stops with an error when `git ls-files` fails. It also writes a `.gitignore` and a `kodeks.release.json` that only holds the packages to publish and the `releaseTag`. Extras are copied last, so an extra can replace either generated file. Root files that were removed from the monorepo stay in the mirror until you delete them there.

The mirror keeps its own `bun.lock`, because the monorepo's lockfile describes private packages. The sync workflow refreshes it after each sync with `bun install --lockfile-only --ignore-scripts`, which resolves only what changed and installs nothing. The release then installs with `--frozen-lockfile`, so every publish builds with the versions committed in the mirror. After a local `kodeks sync-public`, run that same command in the mirror before you commit.

### Changesets

The Changesets config has no `extends`, so Kodeks ships a template instead:

```bash
bunx kodeks changesets init
```

This writes `.changeset/config.json` with two settings for this setup:

- `"privatePackages": { "version": false, "tag": false }` keeps every private workspace package out of versioning, so there is no `ignore` list to maintain.
- `"changelog": "@dirstack/kodeks/changesets-changelog"` writes changelog entries without commit hashes or pull request links, which would point at the private monorepo. The changelog needs Node 22.12 or newer.

To release packages in lockstep, list them in `fixed` and set `"releaseTag": "version"` in `kodeks.release.json`, so they share one `v<version>` GitHub Release. To publish prereleases, run `bunx changeset pre enter beta` in the monorepo and commit `.changeset/pre.json`. Run `bunx changeset pre exit` to return to stable versions.

### Workflows

The monorepo calls the version and sync workflows. Pin them to a Kodeks release tag:

```yaml
# .github/workflows/version.yml
name: Version

on:
  push:
    branches: [main]

concurrency:
  group: version
  cancel-in-progress: false

jobs:
  version:
    permissions:
      contents: write
      pull-requests: write
    uses: dirstack/kodeks/.github/workflows/public-version.yml@v1.9.0
```

```yaml
# .github/workflows/sync-public.yml
name: Sync public mirror

on:
  push:
    branches: [main]
    paths:
      - "packages/core/**"
      - "packages/sdk/**"
      - "packages/react/**"
      - "packages/tsconfig/**"
      - "scripts/mirror/root/**"
      - "kodeks.release.json"
  workflow_dispatch:

concurrency:
  group: sync-public
  cancel-in-progress: false

jobs:
  sync:
    permissions:
      contents: read
    uses: dirstack/kodeks/.github/workflows/public-sync.yml@v1.9.0
    with:
      mirror-repository: acme/acme-js
    secrets:
      mirror-deploy-key: ${{ secrets.MIRROR_DEPLOY_KEY }}
```

The sync workflow runs the `@dirstack/kodeks` range from the monorepo's root `package.json`, without installing the monorepo's dependencies. Inputs: `mirror-repository` (required), `mirror-branch` (default `main`), `kodeks-version`, `commit-message`, and `lockfile-command` (empty skips the lockfile refresh). The version workflow accepts `bun-version`, `install-command`, `version-command` (default `bunx changeset version`) and `title`.

GitHub starts no workflows for a pull request opened with the default `GITHUB_TOKEN`, so CI does not run on the "Version Packages" pull request. To run CI on it, pass a GitHub App token or a fine-grained token as the `github-token` secret of the version workflow.

The mirror calls the release workflow from its own `.github/workflows/release.yml`:

```yaml
# .github/workflows/release.yml in the mirror
name: Release

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: release
  cancel-in-progress: false

jobs:
  release:
    permissions:
      contents: write
      id-token: write
    uses: dirstack/kodeks/.github/workflows/public-release.yml@v1.9.0
```

The release workflow installs npm 11 (input `npm-version`), runs `install-command` (default `bun install --frozen-lockfile`) and `build-command` (default `bun run build`), then runs `kodeks publish`. Commit this file to the mirror once, by hand.

### Trusted publishing on npmjs.com

`kodeks publish` authenticates with [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC), so the mirror needs no `NPM_TOKEN`. npm attests provenance for each publish. Trusted publishing needs npm 11.5.1 or newer, and `kodeks publish` stops with an error when the npm in `PATH` is older.

npm validates the **calling** workflow, so the reusable release workflow works as long as the trusted publisher names the mirror's own workflow file:

1. **Create each package.** npm cannot attach a trusted publisher to a package that does not exist. Publish the first version of each package by hand, from the monorepo, after `npm login`: build it, then run `npm publish --access public` inside its `dist` directory. Add `--tag beta` to make that first version a beta.
2. **Add the trusted publisher.** On npmjs.com, open each package's *Settings*, find *Trusted Publisher*, and choose *GitHub Actions*. Enter the mirror's organization and repository, and the workflow filename `release.yml` (the caller, not `public-release.yml`). Leave the environment empty. Allow the `npm publish` action.
3. **Lock it down.** Once a release has gone through, set each package's publishing access to *Require two-factor authentication and disallow tokens*.

### Sync credential

The sync job pushes to the mirror with a deploy key. A push made with a deploy key starts the mirror's release workflow, which a push made with `GITHUB_TOKEN` would not.

1. Generate a key pair: `ssh-keygen -t ed25519 -N "" -C "mirror sync" -f mirror-deploy-key`.
2. In the mirror, open *Settings*, then *Deploy keys*, and add `mirror-deploy-key.pub` with **Allow write access**.
3. In the monorepo, open *Settings*, then *Secrets and variables*, then *Actions*, and add the contents of `mirror-deploy-key` as the secret `MIRROR_DEPLOY_KEY`.
4. Delete both key files from your machine.

### Command reference

```bash
kodeks prepare-package [dir]
kodeks publish [--packages a,b] [--dry-run]
kodeks sync-public --target <dir> [--packages <list>] [--license-from <path>] [--extra <path>...]
kodeks changesets init [--force]
```

Run `kodeks <command> --help` for details. Run `kodeks publish --dry-run` in the mirror to print the publish and release decisions without publishing. `kodeks publish` creates releases through the GitHub REST API with `GITHUB_TOKEN` (or `GH_TOKEN`). The repository comes from `GITHUB_REPOSITORY` or the `origin` remote.

## Agentic Coding

### Skills

This package includes agent skills for code formatting, testing, and commit conventions.

**Available skills:**
- `formatting` - Code formatting rules not handled by auto-formatters (arrow functions, exports, types, naming, comments, JSX)
- `testing` - Best practices, structure, coverage categories, and formatting conventions for writing tests
- `commits` - Conventional commit types, scopes, and message formatting guidelines
- `dependencies` - Safely upgrade project dependencies to their latest versions across workspaces
- `dhh` - DHH-style code review for TypeScript/React - direct, opinionated, allergic to over-engineering

Install all skills using [skills.sh](https://skills.sh):

```bash
npx skills add dirstack/kodeks
```

Or install individual skills:

```bash
npx skills add dirstack/kodeks --skill formatting
npx skills add dirstack/kodeks --skill testing
npx skills add dirstack/kodeks --skill commits
```
