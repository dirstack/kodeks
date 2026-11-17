import { access, readFile } from "node:fs/promises"
import path from "node:path"

interface SyncConfig {
  packages?: string[] // Package directories to mirror. Defaults to the published packages.
  licenseFrom?: string // File copied to the mirror's root LICENSE.
  extra?: string[] // Extra files or directories, as `source` or `source:destination`.
  exclude?: string[] // File or directory names skipped at any depth, on top of the defaults.
  packagesOnly?: boolean // Writes only the package directories and leaves the mirror's root files alone.
}

// `version` tags one `v<version>` release for packages released in lockstep. `package` tags
// one `<name>@<version>` release per package.
export type ReleaseTag = "version" | "package"

export interface ReleaseConfig {
  packagesDir?: string // Directory holding the package directories. Defaults to `packages`.
  packages?: string[] // Package directories to publish, in publish order.
  publishDir?: string // Directory inside each package that npm publishes. Defaults to `dist` when it holds a package.json, else the package itself.
  releaseTag?: ReleaseTag // Defaults to `version` for one package, `package` for several.
  sync?: SyncConfig
}

export const CONFIG_FILE = "underpin.release.json"
// The config file's name before the package was renamed. A repository that only has this file
// keeps working.
export const LEGACY_CONFIG_FILE = "kodeks.release.json"
export const DEFAULT_PACKAGES_DIR = "packages"

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === "string")
}

class ConfigFieldError extends Error {}

function assertField(condition: boolean, field: string, expected: string) {
  if (!condition) throw new ConfigFieldError(`"${field}" must be ${expected}.`)
}

// Parses the config read from `file`, whose name prefixes every error.
export function parseReleaseConfig(raw: unknown, file: string = CONFIG_FILE): ReleaseConfig {
  try {
    return validateReleaseConfig(raw)
  } catch (error) {
    if (error instanceof ConfigFieldError) throw new Error(`${file}: ${error.message}`)
    throw error
  }
}

function validateReleaseConfig(raw: unknown): ReleaseConfig {
  assertField(typeof raw === "object" && raw !== null && !Array.isArray(raw), "root", "an object")

  const config = raw as ReleaseConfig
  const { packagesDir, packages, publishDir, releaseTag, sync } = config

  assertField(
    packagesDir === undefined || typeof packagesDir === "string",
    "packagesDir",
    "a string",
  )
  assertField(packages === undefined || isStringArray(packages), "packages", "an array of strings")
  assertField(publishDir === undefined || typeof publishDir === "string", "publishDir", "a string")
  assertField(
    releaseTag === undefined || releaseTag === "version" || releaseTag === "package",
    "releaseTag",
    '"version" or "package"',
  )

  if (sync !== undefined) {
    assertField(typeof sync === "object" && sync !== null, "sync", "an object")
    assertField(
      sync.packages === undefined || isStringArray(sync.packages),
      "sync.packages",
      "an array of strings",
    )
    assertField(
      sync.licenseFrom === undefined || typeof sync.licenseFrom === "string",
      "sync.licenseFrom",
      "a string",
    )
    assertField(
      sync.extra === undefined || isStringArray(sync.extra),
      "sync.extra",
      "an array of strings",
    )
    assertField(
      sync.exclude === undefined || isStringArray(sync.exclude),
      "sync.exclude",
      "an array of strings",
    )
    assertField(
      sync.packagesOnly === undefined || typeof sync.packagesOnly === "boolean",
      "sync.packagesOnly",
      "a boolean",
    )
  }

  return config
}

async function exists(file: string): Promise<boolean> {
  return access(file).then(
    () => true,
    () => false,
  )
}

// Returns the name of the config file in `directory`: the current name, or the legacy name when
// only that file exists. A directory with neither gets the current name.
export async function resolveConfigFile(directory: string): Promise<string> {
  if (await exists(path.join(directory, CONFIG_FILE))) return CONFIG_FILE
  if (await exists(path.join(directory, LEGACY_CONFIG_FILE))) return LEGACY_CONFIG_FILE

  return CONFIG_FILE
}

export async function loadReleaseConfig(root: string): Promise<ReleaseConfig> {
  const file = await resolveConfigFile(root)
  let raw: string

  try {
    raw = await readFile(path.join(root, file), "utf8")
  } catch {
    return {}
  }

  return parseReleaseConfig(JSON.parse(raw), file)
}

export function parseList(value: string | undefined): string[] | undefined {
  if (value === undefined) return

  return value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean)
}
