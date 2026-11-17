---
"@underpin/kodeks": minor
---

`kodeks sync-public` now replaces only the package directories it lists. Other packages in the mirror stay, where it used to delete the mirror's whole `packages` directory. A package removed from the list now stays in the mirror until you delete it there.

The new `sync.packagesOnly` option (`--packages-only`) writes only those package directories and leaves every root file in the mirror alone, the generated `.gitignore` and `kodeks.release.json` included. Use it for a public monorepo that owns its root files and develops packages of its own next to the mirrored ones.
