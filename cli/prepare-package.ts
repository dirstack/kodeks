import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

export interface PackageJson {
  name?: string
  version?: string
  private?: boolean
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  exports?: Record<string, unknown>
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

export function rewriteExport(value: unknown): unknown {
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

// Follows the pnpm and Bun publish rules: `workspace:*` pins the exact version,
// `workspace:^` and `workspace:~` keep the range operator, anything else drops the prefix.
export function resolveWorkspaceRange(range: string, version: string): string {
  const specifier = range.slice(WORKSPACE_PROTOCOL.length)

  if (specifier === "*" || specifier === "") return version
  if (specifier === "^" || specifier === "~") return `${specifier}${version}`

  return specifier
}

export function resolveWorkspaceDependencies(
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
  const distExports = Object.fromEntries(
    Object.entries(packageJson.exports ?? {}).map(([key, value]) => [key, rewriteExport(value)]),
  )

  const publishConfig: Record<string, unknown> = { ...packageJson.publishConfig }
  delete publishConfig.directory

  const basePackage: Record<string, unknown> = { ...packageJson }
  delete basePackage.files
  delete basePackage.scripts
  delete basePackage.devDependencies

  const distPackage: Record<string, unknown> = {
    ...basePackage,
    main: "./index.js",
    module: "./index.js",
    types: "./index.d.ts",
    exports: distExports,
    dependencies: resolveWorkspaceDependencies(packageJson.dependencies, workspaceVersions),
    peerDependencies: resolveWorkspaceDependencies(packageJson.peerDependencies, workspaceVersions),
    publishConfig: Object.keys(publishConfig).length ? publishConfig : undefined,
  }

  // Drop the keys that resolved to nothing so they are absent rather than `undefined`.
  for (const key of ["dependencies", "peerDependencies", "publishConfig"]) {
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
      const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as PackageJson

      if (manifest.name && manifest.version) versions.set(manifest.name, manifest.version)
    } catch {}
  }

  return versions
}

export async function preparePackage(directory: string): Promise<string> {
  const packageDirectory = path.resolve(directory)
  const packageJson = JSON.parse(
    await readFile(path.join(packageDirectory, "package.json"), "utf8"),
  ) as PackageJson

  const workspaceVersions = hasWorkspaceDependency(packageJson)
    ? await getWorkspaceVersions(packageDirectory)
    : new Map<string, string>()

  const distDirectory = path.join(packageDirectory, "dist")
  const distPackagePath = path.join(distDirectory, "package.json")
  const distPackage = generateDistManifest(packageJson, workspaceVersions)

  await mkdir(distDirectory, { recursive: true })
  await writeFile(distPackagePath, `${JSON.stringify(distPackage, null, 2)}\n`, "utf8")

  for (const fileName of COPIED_FILES) {
    try {
      await copyFile(path.join(packageDirectory, fileName), path.join(distDirectory, fileName))
    } catch {}
  }

  return distPackagePath
}
