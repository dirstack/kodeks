#!/usr/bin/env node
import path from "node:path"
import { parseArgs } from "node:util"
import { initChangesets } from "./changesets.ts"
import { CONFIG_FILE, DEFAULT_PACKAGES_DIR, loadReleaseConfig, parseList } from "./config.ts"
import { preparePackage } from "./prepare-package.ts"
import { publish } from "./publish.ts"
import { parseExtra, syncPublic } from "./sync-public.ts"

interface Command {
  usage: string
  run(args: string[]): Promise<void>
}

const HELP = `Usage: kodeks <command> [options]

Commands:
  prepare-package [dir]   Write the publishable dist/package.json for a package
  publish                 Publish built packages to npm and cut GitHub Releases
  sync-public             Mirror packages from a monorepo into a public repository
  changesets init         Write a Changesets config for publishing from a mirror

Options:
  -h, --help              Show help for kodeks or a command

Defaults are read from ${CONFIG_FILE} in the current directory.
`

const HELP_OPTION = { help: { type: "boolean", short: "h" } } as const

const commands: Record<string, Command> = {
  "prepare-package": {
    usage: `Usage: kodeks prepare-package [dir]

Writes <dir>/dist/package.json, the manifest npm publishes. Entry points move from
./src/*.ts to the built ./*.js and ./*.d.ts files, nested conditions included, and main,
module and types follow the root export. workspace: ranges become real versions, and
files, scripts and devDependencies are dropped. README.md and LICENSE
are copied from <dir> into dist. <dir> defaults to the current directory.
`,
    async run(args) {
      const { positionals } = parseArgs({ args, options: HELP_OPTION, allowPositionals: true })
      const manifestPath = await preparePackage(positionals[0] ?? ".")

      console.log(`[prepare-package] wrote ${path.relative(process.cwd(), manifestPath)}`)
    },
  },

  publish: {
    usage: `Usage: kodeks publish [--packages a,b] [--dry-run]

Publishes each package from its built <packagesDir>/<package>/dist, in the listed order.
Versions already on npm are skipped. A prerelease such as 1.2.3-beta.0 publishes under
the "beta" dist-tag, a plain version under "latest", and a stable version below the current
"latest" under "latest-<major>". A missing GitHub Release is created for
each version published in this run, and for each earlier version whose npm gitHead is a
commit of this repository. "releaseTag" in ${CONFIG_FILE} picks the tags: "version" for one
"v<version>" release (packages in lockstep), "package" for one "<name>@<version>" release per
package. It defaults to "version" for one package and "package" for several.

Runs under npm trusted publishing (OIDC), so no NPM_TOKEN is needed. Requires npm 11.5.1
or newer, and GITHUB_TOKEN to create releases.

Options:
  --packages <list>   Comma-separated package directories (default: "packages" in ${CONFIG_FILE})
  --dry-run           Print the publish and release decisions without publishing
  -h, --help          Show this help
`,
    async run(args) {
      const { values } = parseArgs({
        args,
        options: {
          ...HELP_OPTION,
          packages: { type: "string" },
          "dry-run": { type: "boolean" },
        },
      })

      const root = process.cwd()
      const config = await loadReleaseConfig(root)
      const packages = parseList(values.packages) ?? config.packages ?? []

      if (!packages.length) {
        throw new Error(
          `No packages to publish. Pass --packages or set "packages" in ${CONFIG_FILE}.`,
        )
      }

      await publish({
        root,
        packagesDir: config.packagesDir ?? DEFAULT_PACKAGES_DIR,
        packages,
        releaseTag: config.releaseTag,
        dryRun: values["dry-run"] ?? false,
      })
    },
  },

  "sync-public": {
    usage: `Usage: kodeks sync-public --target <dir> [--packages <list>] [--license-from <path>] [--extra <path>...]

Mirrors packages from this monorepo into a checkout of the public repository. The target's
<packagesDir> is replaced. Files git ignores, and dist, node_modules and .turbo, are skipped.
A .gitignore and a ${CONFIG_FILE} listing the packages to publish are written to the target root.

Options:
  --target <dir>         Checkout of the public mirror (required)
  --packages <list>      Comma-separated package directories (default: "sync.packages",
                         then "packages" in ${CONFIG_FILE})
  --license-from <path>  File copied to the mirror's LICENSE (default: "sync.licenseFrom")
  --extra <path>         File or directory copied into the mirror, as "source" or
                         "source:destination". Repeatable, added to "sync.extra".
  -h, --help             Show this help
`,
    async run(args) {
      const { values } = parseArgs({
        args,
        options: {
          ...HELP_OPTION,
          target: { type: "string" },
          packages: { type: "string" },
          "license-from": { type: "string" },
          extra: { type: "string", multiple: true },
        },
      })

      if (!values.target) throw new Error("Missing --target <dir>.")

      const root = process.cwd()
      const config = await loadReleaseConfig(root)
      const sync = config.sync ?? {}
      const packagesDir = config.packagesDir ?? DEFAULT_PACKAGES_DIR

      const files = await syncPublic({
        root,
        target: values.target,
        packagesDir,
        packages: parseList(values.packages) ?? sync.packages ?? config.packages ?? [],
        publishPackages: config.packages,
        releaseTag: config.releaseTag,
        licenseFrom: values["license-from"] ?? sync.licenseFrom,
        extra: [...(sync.extra ?? []), ...(values.extra ?? [])].map(parseExtra),
        exclude: sync.exclude ?? [],
      })

      console.log(`Mirrored ${files.length} files into ${values.target}. Review, then commit.`)
    },
  },

  changesets: {
    usage: `Usage: kodeks changesets init [--force]

Writes .changeset/config.json for a monorepo whose public packages are published from a
mirror: private packages are never versioned, and changelog entries carry no links to the
private repository. Fill in "fixed" to release packages in lockstep.

Options:
  --force     Replace an existing .changeset/config.json
  -h, --help  Show this help
`,
    async run(args) {
      const { values, positionals } = parseArgs({
        args,
        options: { ...HELP_OPTION, force: { type: "boolean" } },
        allowPositionals: true,
      })

      if (positionals[0] !== "init") throw new Error('Unknown subcommand. Use "changesets init".')

      const configPath = await initChangesets(process.cwd(), values.force ?? false)
      console.log(`wrote ${path.relative(process.cwd(), configPath)}`)
    },
  },
}

async function main(argv: string[]) {
  const [name, ...args] = argv

  if (!name || name === "-h" || name === "--help") {
    process.stdout.write(HELP)
    return
  }

  const command = commands[name]

  if (!command) {
    process.stderr.write(`Unknown command "${name}".\n\n${HELP}`)
    process.exitCode = 1
    return
  }

  if (args.includes("-h") || args.includes("--help")) {
    process.stdout.write(command.usage)
    return
  }

  try {
    await command.run(args)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(`kodeks ${name}: ${message}\n`)
    process.exitCode = 1
  }
}

await main(process.argv.slice(2))
