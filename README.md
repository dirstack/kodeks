# Kodeks

[![npm version](https://img.shields.io/npm/v/%40dirstack%2Fkodeks.svg)](https://www.npmjs.com/package/@dirstack/kodeks)
[![license](https://img.shields.io/npm/l/%40dirstack%2Fkodeks.svg)](https://github.com/dirstack/kodeks/blob/main/LICENSE)

Shared linter configurations for TypeScript projects.

Kodeks provides reusable, opinionated configurations for maintaining consistent code quality across TypeScript projects.

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

## Agentic Coding

### Skills

This package includes agent skills for code formatting, testing, and commit conventions.

**Available skills:**
- `formatting` - Code formatting rules not handled by auto-formatters (arrow functions, exports, types, naming, comments, JSX)
- `testing` - Best practices, structure, coverage categories, and formatting conventions for writing tests
- `commits` - Conventional commit types, scopes, and message formatting guidelines

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
