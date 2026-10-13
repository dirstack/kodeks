import { copyFile, mkdir, readdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { formatJson, readJson } from "./json.ts"

export interface PackageJson {
  name?: string
  version?: string
  private?: boolean
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  exports?: unknown
  main?: unknown
  files?: string[]
  peerDependencies?: Record<string, string>
  publishConfig?: Record<string, unknown>
  scripts?: Record<string, string>
  [key: string]: unknown
}

const WORKSPACE_PROTOCOL = "workspace:"

// Files every published package ships from its own directory. There is no fallback to the
// repository root, whose license may differ from the license of the public packages.
const COPIED_FILES = ["README.md", "LICENSE"]

function stripSourcePrefix(value: string): string {
  return value.replace(/^\.\/src\//, "./")
}

function withExtension(value: string, extension: string): string {
  if (value.endsWith("/*")) {
    return `${value}.${extension}`
  }

  if (value.includes("*")) {
    return value.replace(/\*\.tsx?$/, `*.${extension}`).replace(/\*$/, `*.${extension}`)
  }

  if (/\.tsx?$/.test(value)) {
    return value.replace(/\.tsx?$/, `.${extension}`)
  }

  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function rewriteFilePath(value: string, extension: string): string {
  const normalized = stripSourcePrefix(value)

  if (normalized.endsWith(".css")) {
    return normalized.replace(/^\.\/dist\//, "./")
  }

  return withExtension(normalized, extension)
}

// Rewrites a condition object such as `{ "react-server": "./src/server.ts", default: ... }`.
// Paths outside ./src already point at published files and stay as they are. With a sibling
// `types` condition, a source path becomes the built JavaScript file; without one, it gets
// its own `types` and `import` pair.
function rewriteConditions(conditions: Record<string, unknown>): Record<string, unknown> {
  const hasTypes = typeof conditions.types === "string"

  return Object.fromEntries(
    Object.entries(conditions).map(([condition, target]) => {
      if (typeof target !== "string") return [condition, rewriteExport(target)]
      if (!target.startsWith("./src/")) return [condition, target]
      if (condition === "types") return [condition, rewriteFilePath(target, "d.ts")]

      return [condition, hasTypes ? rewriteFilePath(target, "js") : rewriteExport(target)]
    }),
  )
}

export function rewriteExport(value: unknown): unknown {
  if (isRecord(value)) {
    return rewriteConditions(value)
  }

  if (typeof value !== "string") {
    return value
  }

  const normalized = stripSourcePrefix(value)

  if (normalized.endsWith(".css")) {
    return normalized.replace(/^\.\/dist\//, "./")
  }

  return {
    types: withExtension(normalized, "d.ts"),
    import: withExtension(normalized, "js"),
  }
}

// Finds the file a rewritten export resolves to by default, following `import`, then
// `default`, through nested conditions.
function getDefaultTarget(value: unknown, condition: "types" | "import"): string | undefined {
  if (typeof value === "string") return condition === "import" ? value : undefined
  if (!isRecord(value)) return
  if (condition === "types" && typeof value.types === "string") return value.types

  for (const key of ["import", "default"]) {
    const target = getDefaultTarget(value[key], condition)
    if (target) return target
  }
}

// A subpath map has keys starting with "."; anything else is the root export on its own.
function isSubpathMap(exports: unknown): exports is Record<string, unknown> {
  return isRecord(exports) && Object.keys(exports).some(key => key.startsWith("."))
}

function rewriteExports(exports: unknown): unknown {
  if (!isSubpathMap(exports)) return rewriteExport(exports)

  return Object.fromEntries(
    Object.entries(exports).map(([subpath, value]) => [subpath, rewriteExport(value)]),
  )
}

function getEntryFields(rootExport: unknown): Record<string, string | undefined> {
  const entry = getDefaultTarget(rootExport, "import")

  return { main: entry, module: entry, types: entry && getDefaultTarget(rootExport, "types") }
}

// `main`, `module` and `types` follow the root export, and are dropped when there is none.
// Without `exports`, a `main` under ./src is rewritten like a root export, and any other
// `main` already points at a published file, so the fields stay as they are.
function findEntryFields(
  packageJson: PackageJson,
  distExports: unknown,
): Record<string, string | undefined> | undefined {
  if (distExports === undefined) {
    const { main } = packageJson
    return typeof main === "string" && main.startsWith("./src/")
      ? getEntryFields(rewriteExport(main))
      : undefined
  }

  return getEntryFields(
    isSubpathMap(packageJson.exports) ? (distExports as Record<string, unknown>)["."] : distExports,
  )
}

// Follows the pnpm and Bun publish rules: `workspace:*` pins the exact version,
// `workspace:^` and `workspace:~` keep the range operator, anything else drops the prefix.
export function resolveWorkspaceRange(range: string, version: string): string {
  const specifier = range.slice(WORKSPACE_PROTOCOL.length)

  if (specifier === "*" || specifier === "") return version
  if (specifier === "^" || specifier === "~") return `${specifier}${version}`

  return specifier
}

function resolveWorkspaceDependencies(
  dependencies: Record<string, string> | undefined,
  workspaceVersions: Map<string, string>,
): Record<string, string> | undefined {
  if (!dependencies) {
    return
  }

  const resolved: Record<string, string> = {}

  for (const [name, range] of Object.entries(dependencies)) {
    if (!range.startsWith(WORKSPACE_PROTOCOL)) {
      resolved[name] = range
      continue
    }

    const version = workspaceVersions.get(name)

    if (version === undefined) {
      throw new Error(`Cannot resolve "${name}": ${range}. No sibling package has that name.`)
    }

    resolved[name] = resolveWorkspaceRange(range, version)
  }

  return resolved
}

export function generateDistManifest(
  packageJson: PackageJson,
  workspaceVersions: Map<string, string>,
): Record<string, unknown> {
  const distExports =
    packageJson.exports === undefined ? undefined : rewriteExports(packageJson.exports)

  const publishConfig: Record<string, unknown> = { ...packageJson.publishConfig }
  delete publishConfig.directory

  const basePackage: Record<string, unknown> = { ...packageJson }
  delete basePackage.files
  delete basePackage.scripts
  delete basePackage.devDependencies

  const distPackage: Record<string, unknown> = {
    ...basePackage,
    ...findEntryFields(packageJson, distExports),
    exports: distExports,
    dependencies: resolveWorkspaceDependencies(packageJson.dependencies, workspaceVersions),
    peerDependencies: resolveWorkspaceDependencies(packageJson.peerDependencies, workspaceVersions),
    publishConfig: Object.keys(publishConfig).length ? publishConfig : undefined,
  }

  // Drop the keys that resolved to nothing so they are absent rather than `undefined`.
  for (const key of [
    "main",
    "module",
    "types",
    "exports",
    "dependencies",
    "peerDependencies",
    "publishConfig",
  ]) {
    if (distPackage[key] === undefined) delete distPackage[key]
  }

  return distPackage
}

function hasWorkspaceDependency(packageJson: PackageJson): boolean {
  return [packageJson.dependencies, packageJson.peerDependencies].some(dependencies =>
    Object.values(dependencies ?? {}).some(range => range.startsWith(WORKSPACE_PROTOCOL)),
  )
}

// Maps each sibling package's name to its version, so `workspace:` ranges can be pinned.
async function getWorkspaceVersions(packageDirectory: string): Promise<Map<string, string>> {
  const parentDirectory = path.dirname(packageDirectory)
  const entries = await readdir(parentDirectory, { withFileTypes: true })
  const versions = new Map<string, string>()

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    try {
      const manifestPath = path.join(parentDirectory, entry.name, "package.json")
      const manifest = await readJson<PackageJson>(manifestPath)

      if (manifest.name && manifest.version) versions.set(manifest.name, manifest.version)
    } catch {}
  }

  return versions
}

export async function preparePackage(directory: string): Promise<string> {
  const packageDirectory = path.resolve(directory)
  const packageJson = await readJson<PackageJson>(path.join(packageDirectory, "package.json"))

  const workspaceVersions = hasWorkspaceDependency(packageJson)
    ? await getWorkspaceVersions(packageDirectory)
    : new Map<string, string>()

  const distDirectory = path.join(packageDirectory, "dist")
  const distPackagePath = path.join(distDirectory, "package.json")
  const distPackage = generateDistManifest(packageJson, workspaceVersions)

  await mkdir(distDirectory, { recursive: true })
  await writeFile(distPackagePath, formatJson(distPackage), "utf8")

  for (const fileName of COPIED_FILES) {
    try {
      await copyFile(path.join(packageDirectory, fileName), path.join(distDirectory, fileName))
    } catch {}
  }

  return distPackagePath
}
