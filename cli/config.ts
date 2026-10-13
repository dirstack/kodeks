import { readFile } from "node:fs/promises"
import path from "node:path"

interface SyncConfig {
  packages?: string[] // Package directories to mirror. Defaults to the published packages.
  licenseFrom?: string // File copied to the mirror's root LICENSE.
  extra?: string[] // Extra files or directories, as `source` or `source:destination`.
  exclude?: string[] // File or directory names skipped at any depth, on top of the defaults.
}

// `version` tags one `v<version>` release for packages released in lockstep. `package` tags
// one `<name>@<version>` release per package.
export type ReleaseTag = "version" | "package"

export interface ReleaseConfig {
  packagesDir?: string // Directory holding the package directories. Defaults to `packages`.
  packages?: string[] // Package directories to publish, in publish order.
  releaseTag?: ReleaseTag // Defaults to `version` for one package, `package` for several.
  sync?: SyncConfig
}

export const CONFIG_FILE = "kodeks.release.json"
export const DEFAULT_PACKAGES_DIR = "packages"

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === "string")
}

function assertField(condition: boolean, field: string, expected: string) {
  if (!condition) throw new Error(`${CONFIG_FILE}: "${field}" must be ${expected}.`)
}

export function parseReleaseConfig(raw: unknown): ReleaseConfig {
  assertField(typeof raw === "object" && raw !== null && !Array.isArray(raw), "root", "an object")

  const config = raw as ReleaseConfig
  const { packagesDir, packages, releaseTag, sync } = config

  assertField(
    packagesDir === undefined || typeof packagesDir === "string",
    "packagesDir",
    "a string",
  )
  assertField(packages === undefined || isStringArray(packages), "packages", "an array of strings")
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
  }

  return config
}

export async function loadReleaseConfig(root: string): Promise<ReleaseConfig> {
  let raw: string

  try {
    raw = await readFile(path.join(root, CONFIG_FILE), "utf8")
  } catch {
    return {}
  }

  return parseReleaseConfig(JSON.parse(raw))
}

export function parseList(value: string | undefined): string[] | undefined {
  if (value === undefined) return

  return value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean)
}
