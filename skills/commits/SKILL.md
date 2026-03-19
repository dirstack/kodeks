---
name: commits
description: Conventional commit message guidelines. Use when writing commit messages, reviewing commits, or when asked to commit changes. Covers commit types, subject rules (lowercase, imperative), atomic commits, and examples of good vs bad messages.
---

# Commit Convention

Guidelines for writing consistent and clear commit messages.

## Format

```
<type>: <description>
```

- No scope required.
- No body or footer for simple changes.
- Max 72 characters for the subject line.

## Types

- `feat` — new feature or capability
- `fix` — bug fix
- `docs` — documentation only changes
- `style` — code style/formatting (no logic changes)
- `refactor` — code restructuring (no feature, no fix)
- `perf` — performance improvements
- `test` — adding or updating tests
- `build` — build system or dependency changes
- `ci` — CI/CD configuration changes
- `chore` — maintenance tasks, configs
- `revert` — reverting a previous commit

## Subject Rules

- **lowercase start**: description starts with a lowercase letter.
- **acronyms allowed**: uppercase acronyms like SEO, FAQ, API are fine (e.g., "fix SEO meta tags").
- **dashes allowed**: hyphens in descriptions are fine (e.g., "add user-friendly layout").
- **imperative mood**: use "add", not "added" or "adds".
- **no period**: do not end the subject with a period.
- **max 72 chars**: keep it concise.

## Atomic Commits

One logical change per commit. If the description requires "and", consider splitting the changes into separate commits.

## Breaking Changes

Use the `!` suffix after the type for breaking changes:

```
feat!: remove deprecated API endpoint
```

## Good vs Bad Examples

### Good
- `feat: add user authentication flow`
- `fix: resolve login redirect loop`
- `fix: improve SEO meta tag rendering`
- `feat: add user-friendly FAQ page`
- `refactor: extract validation logic into separate module`
- `docs: update API documentation for v2 endpoints`
- `chore: update dependencies to latest versions`

### Bad
- `feat: Added user authentication` (past tense)
- `fix: Bug fix` (vague)
- `feat: add user auth and update profile page` (multiple logical changes)
- `FEAT: Add user auth` (uppercase type)
- `feat: Add user auth` (uppercase description start)
