# Kodeks

[![npm version](https://img.shields.io/npm/v/%40underpin%2Fkodeks.svg)](https://www.npmjs.com/package/@underpin/kodeks)
[![license](https://img.shields.io/npm/l/%40underpin%2Fkodeks.svg)](https://github.com/dirstack/kodeks/blob/main/LICENSE)

Shared linter configurations and release tooling for TypeScript projects.

Renamed from `@dirstack/kodeks`, whose last version is 1.11.0. `@underpin/kodeks` continues its 1.x line: replace the package name in your `package.json` and in every config path that names it. The workflows stay in this repository, so `uses:` lines need no change.

Kodeks provides reusable, opinionated configurations for maintaining consistent code quality across TypeScript projects, plus a `kodeks` CLI that releases npm packages with Changesets: from a single-package repository, a public monorepo, or a private monorepo through a public mirror.

## Usage

### oxlint

```bash
bun add -d @underpin/kodeks oxlint
```

Create a `.oxlintrc.json` file in your project root:

```json
{
  "extends": ["./node_modules/@underpin/kodeks/configs/oxlint-base.json"]
}
```

For Next.js projects, use the Next.js preset:

```json
{
  "extends": ["./node_modules/@underpin/kodeks/configs/oxlint-next.json"]
}
```

For TanStack projects, use the TanStack preset:

```json
{
  "extends": ["./node_modules/@underpin/kodeks/configs/oxlint-tanstack.json"]
}
```

### oxfmt

```bash
bun add -d @underpin/kodeks oxfmt
```

Since oxfmt does not support configuration inheritance, you have two options:

**Option 1: Reference via CLI flag**

Add to your `package.json` scripts:

```json
{
  "scripts": {
    "format": "oxfmt --config ./node_modules/@underpin/kodeks/configs/oxfmt.json --write ."
  }
}
```

**Option 2: Copy configuration locally**

```bash
cp ./node_modules/@underpin/kodeks/configs/oxfmt.json ./.oxfmtrc.json
```

### Commitlint

```bash
bun add -d @underpin/kodeks @commitlint/cli @commitlint/config-conventional
```

Create a `commitlint.json` file in your project root:

```json
{
  "extends": ["./node_modules/@underpin/kodeks/configs/commitlint.json"]
}
```

### Semantic Release

```bash
bun add -d @underpin/kodeks semantic-release conventional-changelog-conventionalcommits
```

Create a `release.json` file in your project root:

```json
{
  "extends": "@underpin/kodeks/semantic-release"
}
```

A dry-run variant is also available for CI validation:

```json
{
  "extends": "@underpin/kodeks/semantic-release-dry-run"
}
```

### Lefthook

```bash
bun add -d @underpin/kodeks lefthook
```

Create a `lefthook.json` file in your project root and extend the hooks you need:

```json
{
  "extends": [
    "node_modules/@underpin/kodeks/configs/lefthook-oxlint.json",
    "node_modules/@underpin/kodeks/configs/lefthook-oxfmt.json",
    "node_modules/@underpin/kodeks/configs/lefthook-commitlint.json"
  ]
}
```

**Available hooks:**
- `lefthook-oxlint.json` — Lints and fixes staged files with oxlint (pre-commit)
- `lefthook-oxfmt.json` — Formats staged files with oxfmt (pre-commit)
- `lefthook-commitlint.json` — Validates commit messages (commit-msg)
- `lefthook-typescript.json` — Type checks with tsc (pre-commit)

## Releasing packages

Kodeks releases packages with [Changesets](https://github.com/changesets/changesets). A changeset is a small Markdown file in `.changeset/` that names the packages to bump, the bump type and a changelog line. Pushing to `main` never publishes on its own. You decide when to release by merging the "Version Packages" pull request.

1. **Version.** A pushed changeset opens or updates the "Version Packages" pull request. Merging it bumps the versions and writes each package's `CHANGELOG.md` on `main`.
2. **Release.** The release workflow builds the packages and runs `kodeks publish`. It publishes each version that is not on npm yet and creates its GitHub Release, with the version's changelog section as the release notes.

`kodeks publish` skips versions that are already on npm, so a push that changes no version publishes nothing. The dist-tag follows the version: `1.2.3` publishes under `latest`, `1.2.3-beta.0` under `beta` and is marked as a GitHub prerelease. A stable version below the current `latest`, such as a `1.0.1` backport after `2.0.0`, publishes under `latest-1`, so `latest` never moves backwards. `kodeks publish` passes `--provenance`, so a publish that cannot attest provenance fails instead of succeeding without it.

The `releaseTag` setting picks the release tags. With `"version"`, one release tagged `v<version>` lists every package, and `kodeks publish` stops before publishing when the packages have different versions. With `"package"`, each package gets its own release tagged `<name>@<version>`. The default is `"version"` for one package and `"package"` for several.

A re-run recovers a release that failed after its packages reached npm. For a version that is already on npm, `kodeks publish` reads the commit npm recorded at publish time (`gitHead`). It creates the missing release at that commit only when the commit belongs to the repository. A version published by hand, or by an earlier setup, gets no release.

### Single package or public monorepo

```bash
bun add -d @underpin/kodeks @changesets/cli
bunx kodeks changesets init --repo acme/acme-js
```

`--repo` links each changelog entry to the commit that added its changeset. Leave it out for a private repository.

A single-package repository needs no `kodeks.release.json`: when the root `package.json` is not private, `kodeks publish` publishes the root package. A public monorepo lists its packages:

```json
{
  "packages": ["core", "sdk"]
}
```

Each package publishes from `dist` when the build wrote `dist/package.json` (see `kodeks prepare-package` below), and from its own directory otherwise, where npm reads the `files` field. Set `publishDir` to pick the directory explicitly.

Call the version and release workflows on every push to `main`. Both are cheap when there is nothing to do: the version job only touches the pull request when changesets are pending, and the release job publishes nothing when every version is already on npm.

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: release
  cancel-in-progress: false

jobs:
  version:
    # A manual run can target any branch, so only main may version or publish.
    if: github.ref == 'refs/heads/main'
    permissions:
      contents: write
      pull-requests: write
    uses: dirstack/kodeks/.github/workflows/public-version.yml@<release commit SHA> # v<version>

  release:
    if: github.ref == 'refs/heads/main'
    permissions:
      contents: write
      id-token: write
    uses: dirstack/kodeks/.github/workflows/public-release.yml@<release commit SHA> # v<version>
```

Both workflows accept `bun-version` or `bun-version-file` (such as `.bun-version`), and `install-command`. The release workflow also accepts `build-command` and `publish-command` (default `bunx kodeks publish`). Set up [trusted publishing](#trusted-publishing-on-npmjscom) with `release.yml` as the workflow filename.

To move an existing package over, set `version` in `package.json` to the version that is on npm now, so the first changeset bumps from there.

Kodeks releases itself this way. Its `release.yml` calls the two workflows by path and passes `publish-command: node dist/cli/kodeks.js publish`, because `bunx kodeks` inside this repository would fetch the unrelated `kodeks` package from npm.

### Private monorepo through a public mirror

npm only attests [provenance](https://docs.npmjs.com/generating-provenance-statements) for packages published from a public repository. A private monorepo that ships public client packages therefore publishes them from a public mirror repository. Kodeks provides the commands and reusable GitHub workflows for that setup.

The mirror setup adds a sync step between versioning and releasing:

1. **Version (monorepo).** Merging the "Version Packages" pull request bumps the versions on `main`.
2. **Sync (monorepo to mirror).** The version bump on `main` runs `kodeks sync-public`, which copies the listed packages and root files into a checkout of the mirror and pushes the result.
3. **Release (mirror).** The sync commit runs the mirror's release workflow, which runs `kodeks publish`.

#### Setup in the monorepo

```bash
bun add -d @underpin/kodeks @changesets/cli
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
| `packages` | The root package, when it is not private | Package directories to publish, in publish order. |
| `publishDir` | `"dist"` when it holds a `package.json`, else the package itself | Directory inside each package that npm publishes. The mirror's config always gets `"dist"`. |
| `releaseTag` | `"version"` for one package, `"package"` for several | `"version"` tags one `v<version>` release for packages released in lockstep. `"package"` tags one `<name>@<version>` release per package. |
| `sync.packages` | `packages` | Package directories to mirror. Add shared private packages the public ones build with, such as a `tsconfig` package. |
| `sync.licenseFrom` | | File copied to the mirror's root `LICENSE`. |
| `sync.extra` | | Files or directories copied into the mirror, as `"source"` (same path) or `"source:destination"`. A directory merges into the destination. Files git ignores inside a directory are skipped, and an extra file that git ignores is an error. |
| `sync.exclude` | | Names skipped at any depth, on top of `dist`, `node_modules` and `.turbo`. |
| `sync.packagesOnly` | `false` | Writes only the listed package directories and leaves every root file in the mirror alone: no `.gitignore`, `kodeks.release.json`, `LICENSE` or extras. Use it for a public monorepo that owns its root files and holds packages of its own next to the mirrored ones. It cannot be combined with `sync.licenseFrom` or `sync.extra`. |

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
    "@underpin/kodeks": "^1.9.0",
    "tsdown": "^0.22.3",
    "typescript": "^6.0.3"
  }
}
```

On every sync, `kodeks sync-public` replaces each listed package directory in the mirror with the package files git does not ignore, so a local `.env` never reaches the mirror. Packages the mirror holds that are not listed stay, so a package removed from the list stays in the mirror until you delete it there. It only runs in a git repository, and stops with an error when `git ls-files` fails. Unless `sync.packagesOnly` is set, it also writes a `.gitignore` and a `kodeks.release.json` that only holds the packages to publish, `publishDir` and the `releaseTag`. The mirror's `publishDir` is `"dist"`, so a build that skipped `kodeks prepare-package` fails the publish instead of shipping the source manifest. Extras are copied last, so an extra can replace either generated file. Root files that were removed from the monorepo stay in the mirror until you delete them there.

The mirror keeps its own `bun.lock`, because the monorepo's lockfile describes private packages. The sync workflow refreshes it after each sync with `bun install --lockfile-only --ignore-scripts`, which resolves only what changed and installs nothing. The release then installs with `--frozen-lockfile`, so every publish builds with the versions committed in the mirror. After a local `kodeks sync-public`, run that same command in the mirror before you commit.

#### Changesets

The Changesets config has no `extends`, so Kodeks ships a template instead:

```bash
bunx kodeks changesets init
```

This writes `.changeset/config.json` with two settings:

- `"privatePackages": { "version": false, "tag": false }` keeps every private workspace package out of versioning, so there is no `ignore` list to maintain.
- `"changelog": "@underpin/kodeks/changesets-changelog"` writes changelog entries without commit hashes or pull request links, which would point at the private monorepo. With `--repo owner/name`, as in a public repository, each entry links to its commit instead. The changelog needs Node 22.12 or newer.

To release packages in lockstep, list them in `fixed` and set `"releaseTag": "version"` in `kodeks.release.json`, so they share one `v<version>` GitHub Release. To publish prereleases, run `bunx changeset pre enter beta` and commit `.changeset/pre.json`. Run `bunx changeset pre exit` to return to stable versions. These settings apply to every setup.

#### Workflows

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
    uses: dirstack/kodeks/.github/workflows/public-version.yml@<release commit SHA> # v<version>
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
    uses: dirstack/kodeks/.github/workflows/public-sync.yml@<release commit SHA> # v<version>
    with:
      mirror-repository: acme/acme-js
    secrets:
      mirror-deploy-key: ${{ secrets.MIRROR_DEPLOY_KEY }}
```

The sync workflow runs the `@underpin/kodeks` range from the monorepo's root `package.json` (or the `@dirstack/kodeks` range, when only that name is listed), without installing the monorepo's dependencies. Inputs: `mirror-repository` (required), `mirror-branch` (default `main`), `kodeks-version`, `commit-message`, and `lockfile-command` (empty skips the lockfile refresh). The version workflow accepts `bun-version`, `bun-version-file`, `install-command`, `version-command` (default `bunx changeset version`) and `title`.

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
    uses: dirstack/kodeks/.github/workflows/public-release.yml@<release commit SHA> # v<version>
```

The release workflow installs npm 11 (input `npm-version`), runs `install-command` (default `bun install --frozen-lockfile`) and `build-command` (default `bun run build`), then runs `publish-command` (default `bunx kodeks publish`). Commit this file to the mirror once, by hand.

Pin each `uses:` to the commit SHA of a kodeks release, with the version in a comment, never to the tag: the sync receives the mirror's deploy key and the release holds `id-token: write`, so a moved tag could push to the mirror or publish to npm. Every action inside these workflows is pinned to a commit SHA as well, so the monorepo and the mirror can turn on *Require actions to be pinned to a full-length commit SHA* (Settings, Actions, General).

### Trusted publishing on npmjs.com

`kodeks publish` authenticates with [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC), so the publishing repository needs no `NPM_TOKEN`. npm attests provenance for each publish. Trusted publishing needs npm 11.5.1 or newer, and `kodeks publish` stops with an error when the npm in `PATH` is older.

npm validates the **calling** workflow, so the reusable release workflow works as long as the trusted publisher names the publishing repository's own workflow file (the mirror's, in the mirror setup):

1. **Create each package.** npm cannot attach a trusted publisher to a package that does not exist. Publish the first version of each package by hand after `npm login`: build it, then run `npm publish --access public` in the directory `kodeks publish` would publish from. Add `--tag beta` to make that first version a beta. Skip this step for a package that is already on npm.
2. **Add the trusted publisher.** On npmjs.com, open each package's *Settings*, find *Trusted Publisher*, and choose *GitHub Actions*. Enter the organization and repository that publish, and the workflow filename `release.yml` (the caller, not `public-release.yml`). Leave the environment empty. Allow the `npm publish` action.
3. **Lock it down.** Once a release has gone through, set each package's publishing access to *Require two-factor authentication and disallow tokens*.

#### Sync credential

The sync job pushes to the mirror with a deploy key. A push made with a deploy key starts the mirror's release workflow, which a push made with `GITHUB_TOKEN` would not.

1. Generate a key pair: `ssh-keygen -t ed25519 -N "" -C "mirror sync" -f mirror-deploy-key`.
2. In the mirror, open *Settings*, then *Deploy keys*, and add `mirror-deploy-key.pub` with **Allow write access**.
3. In the monorepo, open *Settings*, then *Secrets and variables*, then *Actions*, and add the contents of `mirror-deploy-key` as the secret `MIRROR_DEPLOY_KEY`.
4. Delete both key files from your machine.

### Command reference

```bash
kodeks prepare-package [dir]
kodeks publish [--packages a,b] [--publish-dir <dir>] [--dry-run]
kodeks sync-public --target <dir> [--packages <list>] [--license-from <path>] [--extra <path>...] [--packages-only]
kodeks changesets init [--repo <owner/name>] [--force]
```

Run `kodeks <command> --help` for details. Run `kodeks publish --dry-run` to print the publish and release decisions without publishing. `kodeks publish` creates releases through the GitHub REST API with `GITHUB_TOKEN` (or `GH_TOKEN`). The repository comes from `GITHUB_REPOSITORY` or the `origin` remote.

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
