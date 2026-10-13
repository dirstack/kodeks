import {
  copyFile,
  cp,
  lstat,
  mkdir,
  readdir,
  readFile,
  readlink,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises"
import path from "node:path"
import { runCommand } from "./command.ts"
import { CONFIG_FILE, DEFAULT_PACKAGES_DIR } from "./config.ts"
import type { ReleaseConfig } from "./config.ts"
import type { PackageJson } from "./prepare-package.ts"

export interface ExtraFile {
  source: string // Path in the monorepo, relative to its root.
  destination: string // Path in the mirror, relative to its root.
}

export interface SyncOptions {
  root: string // The monorepo root.
  target: string // A checkout of the public mirror.
  packagesDir: string
  packages: string[] // Package directories to mirror.
  publishPackages?: string[] // Package directories the mirror publishes. Defaults to the public ones.
  licenseFrom?: string
  extra: ExtraFile[]
  exclude: string[]
}

// Build output and caches never reach the mirror.
export const DEFAULT_EXCLUDES = ["dist", "node_modules", ".turbo"]

export const DEFAULT_GITIGNORE = ["node_modules", "dist", ".turbo", "*.log", ".DS_Store", ""].join(
  "\n",
)

function isInside(parent: string, child: string): boolean {
  const relative = path.relative(parent, child)
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))
}

function isSubdirectory(value: string): boolean {
  const normalized = path.normalize(value)
  return !path.isAbsolute(normalized) && normalized !== "." && isInside(".", normalized)
}

// Parses `source` or `source:destination`. A bare source keeps its relative path.
export function parseExtra(value: string): ExtraFile {
  const separatorIndex = value.indexOf(":")
  const source = separatorIndex === -1 ? value : value.slice(0, separatorIndex)
  const destination = separatorIndex === -1 ? value : value.slice(separatorIndex + 1)

  if (!source || !destination) {
    throw new Error(`Invalid extra "${value}". Use "source" or "source:destination".`)
  }

  if (path.isAbsolute(destination) || !isInside(".", path.normalize(destination))) {
    throw new Error(`Invalid extra "${value}". The destination must stay inside the mirror.`)
  }

  return { source, destination }
}

async function walk(root: string, directory: string, exclude: Set<string>): Promise<string[]> {
  const entries = await readdir(path.join(root, directory), { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    if (exclude.has(entry.name)) continue

    const relativePath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await walk(root, relativePath, exclude)))
    } else {
      files.push(relativePath)
    }
  }

  return files
}

// Lists the files git does not ignore, so untracked secrets such as a local .env never
// reach the public mirror. Returns undefined when the root is not inside a git repository.
function getGitVisibleFiles(root: string, directories: string[]): Set<string> | undefined {
  try {
    const args = ["ls-files", "-z", "--cached", "--others", "--exclude-standard", "--"]
    const result = runCommand("git", [...args, ...directories], { cwd: root })

    if (result.status !== 0) return

    return new Set(result.stdout.split("\0").filter(Boolean))
  } catch {}
}

// Lists every file mirrored from the packages, relative to the monorepo root.
export async function listSyncFiles(
  root: string,
  packagesDir: string,
  packages: string[],
  exclude: string[] = DEFAULT_EXCLUDES,
): Promise<string[]> {
  const excluded = new Set(exclude)
  const files: string[] = []

  for (const packageName of packages) {
    const packageDirectory = path.join(packagesDir, packageName)
    const stats = await stat(path.join(root, packageDirectory)).catch(() => undefined)

    if (!stats?.isDirectory()) throw new Error(`Package directory ${packageDirectory} not found.`)

    files.push(...(await walk(root, packageDirectory, excluded)))
  }

  const visibleFiles = getGitVisibleFiles(
    root,
    packages.map(packageName => path.join(packagesDir, packageName)),
  )

  return files.filter(file => !visibleFiles || visibleFiles.has(file)).sort()
}

// Copies a file, symlink or directory. Directories merge into an existing destination.
async function copyEntry(source: string, destination: string) {
  const stats = await lstat(source)

  if (stats.isDirectory()) {
    await cp(source, destination, { recursive: true, force: true, verbatimSymlinks: true })
    return
  }

  await mkdir(path.dirname(destination), { recursive: true })

  if (stats.isSymbolicLink()) {
    await rm(destination, { force: true })
    await symlink(await readlink(source), destination)
    return
  }

  await copyFile(source, destination)
}

async function isPublicPackage(root: string, packagesDir: string, packageName: string) {
  const manifestPath = path.join(root, packagesDir, packageName, "package.json")
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as PackageJson

  return manifest.private !== true
}

export async function syncPublic(options: SyncOptions): Promise<string[]> {
  const root = path.resolve(options.root)
  const target = path.resolve(options.target)
  const { packagesDir, packages } = options

  const targetStats = await stat(target).catch(() => undefined)

  if (!targetStats?.isDirectory()) throw new Error(`Target ${target} is not a directory.`)
  if (isInside(target, root)) throw new Error("The target must not contain the monorepo.")
  if (!packages.length) throw new Error("No packages to sync. Pass --packages.")

  // The package tree is deleted and rewritten, so it must be a real subdirectory of the target.
  for (const subpath of [packagesDir, ...packages]) {
    if (!isSubdirectory(subpath)) throw new Error(`"${subpath}" must be a subdirectory path.`)
  }

  const files = await listSyncFiles(root, packagesDir, packages, [
    ...DEFAULT_EXCLUDES,
    ...options.exclude,
  ])

  // Replace the mirrored package tree. The mirror's .git and other root files stay.
  await rm(path.join(target, packagesDir), { recursive: true, force: true })
  await mkdir(path.join(target, packagesDir), { recursive: true })

  for (const file of files) {
    await copyEntry(path.join(root, file), path.join(target, file))
  }

  if (options.licenseFrom) {
    await copyFile(path.join(root, options.licenseFrom), path.join(target, "LICENSE"))
  }

  const publishPackages =
    options.publishPackages ??
    (
      await Promise.all(
        packages.map(async name => [name, await isPublicPackage(root, packagesDir, name)] as const),
      )
    )
      .filter(([, isPublic]) => isPublic)
      .map(([name]) => name)

  // The mirror only needs to know what to publish, never the monorepo's sync settings.
  const mirrorConfig: ReleaseConfig = {
    ...(packagesDir === DEFAULT_PACKAGES_DIR ? {} : { packagesDir }),
    packages: publishPackages,
  }

  await writeFile(path.join(target, ".gitignore"), DEFAULT_GITIGNORE, "utf8")
  await writeFile(path.join(target, CONFIG_FILE), `${JSON.stringify(mirrorConfig, null, 2)}\n`)

  // Extras go last, so they can replace the generated .gitignore and config.
  for (const { source, destination } of options.extra) {
    await copyEntry(path.join(root, source), path.join(target, destination))
  }

  return files
}
