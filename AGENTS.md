# Kodeks

Shared lint, format, commit and release configs, plus the `kodeks` CLI in `cli/`. Published to npm as `@underpin/kodeks`, which was `@dirstack/kodeks` up to 1.11.0.

## Checks

```bash
bun run lint
bun run format:check
bun run typecheck
bun run test
bun run build
```

## Releasing

Releases use Changesets. Pushing to `main` never publishes on its own.

1. **A PR that changes what the package ships carries a changeset.** Run `bunx changeset`, choose the bump and write the entry for the people who use Kodeks. It lands in `CHANGELOG.md` and in the GitHub Release. The package ships `cli/`, `configs/`, `skills/`, `package.json` and the reusable workflows `.github/workflows/public-*.yml`.
2. **Pick the bump by its effect on existing users.** A fix is a patch. A new config, command, option or workflow input is a minor. A removed export, a renamed flag or input, or any change that makes a working setup fail is a major.
3. **A change that ships nothing needs no changeset.** That covers tests, the README, `ci.yml` and `release.yml`. CI checks this with `bunx changeset status --since=origin/main` and fails a PR that changes a shipped file without a changeset. When a shipped file changes but users see no difference, such as a devDependency bump, add `bunx changeset --empty`. The shipped paths above are the `changedFilePatterns` in `.changeset/config.json`. Change both together.
4. **`release.yml` versions and publishes.** While changesets are pending, it opens or updates the "Version Packages" PR. Merging that PR bumps the version, and the release job publishes it with `node dist/cli/kodeks.js publish`.

Rules:

- **Never publish by hand.** npm accepts only trusted publishing from this repository's `release.yml`, and tokens are disallowed. Renaming `release.yml` breaks publishing until the trusted publisher on npmjs.com is updated.
- **Never run `bunx kodeks` in this repository.** It resolves the unrelated `kodeks` package on npm, not this one. Run `bun run build`, then `node dist/cli/kodeks.js <command>`.
- **Pin every action in the reusable workflows to a full commit SHA.** Other repositories call them with publishing rights and a deploy key.
