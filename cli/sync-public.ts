import {
  copyFile,
  lstat,
  mkdir,
  readdir,
  readlink,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises"
import path from "node:path"
import { runCommand } from "./command.ts"
import { DEFAULT_PACKAGES_DIR, resolveConfigFile } from "./config.ts"
import type { ReleaseConfig, ReleaseTag } from "./config.ts"
import { formatJson, readJson } from "./json.ts"
import type { PackageJson } from "./prepare-package.ts"

interface ExtraFile {
  source: string // Path in the monorepo, relative to its root.
  destination: string // Path in the mirror, relative to its root.
}

interface SyncOptions {
  root: string // The monorepo root.
  target: string // A checkout of the public mirror.
  packagesDir: string
  packages: string[] // Package directories to mirror.
  publishPackages?: string[] // Package directories the mirror publishes. Defaults to the public ones.
  publishDir?: string
  releaseTag?: ReleaseTag
  licenseFrom?: string
  extra: ExtraFile[]
  exclude: string[]
  packagesOnly?: boolean // Writes only the listed package directories, never a root file.
}

// Build output and caches never reach the mirror.
const DEFAULT_EXCLUDES = ["dist", "node_modules", ".turbo"]

const DEFAULT_GITIGNORE = ["node_modules", "dist", ".turbo", "*.log", ".DS_Store", ""].join("\n")

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

// Lists the files git does not ignore under the given paths, so untracked secrets such as a
// local .env never reach the public mirror. Without git there is no way to tell, so it throws.
function getGitVisibleFiles(root: string, paths: string[]): Set<string> {
  const args = ["ls-files", "-z", "--cached", "--others", "--exclude-standard", "--", ...paths]
  const result = runCommand("git", args, { cwd: root })

  if (result.status !== 0) {
    throw new Error(
      `git ls-files failed, and only files from a git repository are mirrored:\n${result.stderr.trim()}`,
    )
  }

  return new Set(result.stdout.split("\0").filter(Boolean))
}

// Lists every file mirrored from the packages, relative to the monorepo root.
export async function listSyncFiles(
  root: string,
  packagesDir: string,
  packages: string[],
  exclude: string[] = DEFAULT_EXCLUDES,
): Promise<string[]> {
  const excluded = new Set(exclude)
  const packageDirectories = packages.map(packageName => path.join(packagesDir, packageName))
  const files: string[] = []

  for (const packageDirectory of packageDirectories) {
    const stats = await stat(path.join(root, packageDirectory)).catch(() => undefined)

    if (!stats?.isDirectory()) throw new Error(`Package directory ${packageDirectory} not found.`)

    files.push(...(await walk(root, packageDirectory, excluded)))
  }

  const visibleFiles = getGitVisibleFiles(root, packageDirectories)

  return files.filter(file => visibleFiles.has(file)).sort()
}

// Expands the extras into single files, each mapped to its path in the mirror. Files git
// ignores inside an extra directory are skipped. An extra file that git ignores is an error.
export async function listExtraFiles(
  root: string,
  extras: ExtraFile[],
  exclude: string[] = DEFAULT_EXCLUDES,
): Promise<ExtraFile[]> {
  const excluded = new Set(exclude)
  const files: ExtraFile[] = []
  const explicitFiles: string[] = []

  for (const extra of extras) {
    const source = path.normalize(extra.source)
    const stats = await lstat(path.join(root, source))

    if (!stats.isDirectory()) {
      files.push({ source, destination: extra.destination })
      explicitFiles.push(source)
      continue
    }

    for (const file of await walk(root, source, excluded)) {
      const destination = path.join(extra.destination, path.relative(source, file))
      files.push({ source: file, destination })
    }
  }

  if (!files.length) return files

  const visibleFiles = getGitVisibleFiles(root, [...new Set(files.map(file => file.source))])
  const ignoredFile = explicitFiles.find(file => !visibleFiles.has(file))

  if (ignoredFile) throw new Error(`Extra ${ignoredFile} is ignored by git, so it is not mirrored.`)

  return files.filter(file => visibleFiles.has(file.source))
}

// Copies a file or a symlink, replacing whatever is at the destination.
async function copyEntry(source: string, destination: string) {
  const stats = await lstat(source)

  await mkdir(path.dirname(destination), { recursive: true })

  if (stats.isSymbolicLink()) {
    await rm(destination, { force: true })
    await symlink(await readlink(source), destination)
    return
  }

  await copyFile(source, destination)
}

// Throws when a directory on the way from the target to the subpath is a symlink, so a mirror
// that commits one cannot point the sync's deletes and writes outside the target.
async function assertNoSymlink(target: string, subpath: string) {
  let current = target

  for (const segment of path.normalize(subpath).split(path.sep)) {
    current = path.join(current, segment)
    const stats = await lstat(current).catch(() => undefined)

    if (!stats) return
    if (stats.isSymbolicLink()) {
      throw new Error(`${path.relative(target, current)} in the target is a symlink.`)
    }
  }
}

async function getPublicPackages(root: string, packagesDir: string, packages: string[]) {
  const publicPackages: string[] = []

  for (const packageName of packages) {
    const manifestPath = path.join(root, packagesDir, packageName, "package.json")
    const manifest = await readJson<PackageJson>(manifestPath)

    if (manifest.private !== true) publicPackages.push(packageName)
  }

  return publicPackages
}

export async function syncPublic(options: SyncOptions): Promise<string[]> {
  const root = path.resolve(options.root)
  const target = path.resolve(options.target)
  const { packagesDir, packages } = options

  const targetStats = await stat(target).catch(() => undefined)

  if (!targetStats?.isDirectory()) throw new Error(`Target ${target} is not a directory.`)
  if (isInside(target, root)) throw new Error("The target must not contain the monorepo.")
  if (!packages.length) throw new Error("No packages to sync. Pass --packages.")

  if (options.packagesOnly && (options.licenseFrom || options.extra.length)) {
    throw new Error(
      "packagesOnly leaves the mirror's root files alone, so drop licenseFrom and extra.",
    )
  }

  // Each listed package directory is deleted and rewritten, so it must be a real subdirectory
  // of the target.
  for (const subpath of [packagesDir, ...packages]) {
    if (!isSubdirectory(subpath)) throw new Error(`"${subpath}" must be a subdirectory path.`)
  }

  const exclude = [...DEFAULT_EXCLUDES, ...options.exclude]
  const files = await listSyncFiles(root, packagesDir, packages, exclude)
  const extraFiles = await listExtraFiles(root, options.extra, exclude)

  // Replace each listed package directory. Packages the mirror holds that are not listed, its
  // .git and its other root files stay.
  for (const packageName of packages) {
    await assertNoSymlink(target, path.join(packagesDir, packageName))
  }

  for (const packageName of packages) {
    await rm(path.join(target, packagesDir, packageName), { recursive: true, force: true })
  }

  await mkdir(path.join(target, packagesDir), { recursive: true })

  for (const file of files) {
    await copyEntry(path.join(root, file), path.join(target, file))
  }

  // The mirror owns its root files, its publish config included.
  if (options.packagesOnly) return files

  if (options.licenseFrom) {
    await copyFile(path.join(root, options.licenseFrom), path.join(target, "LICENSE"))
  }

  const publishPackages =
    options.publishPackages ?? (await getPublicPackages(root, packagesDir, packages))

  // The mirror only needs to know what to publish, never the monorepo's sync settings.
  const mirrorConfig: ReleaseConfig = {
    ...(packagesDir === DEFAULT_PACKAGES_DIR ? {} : { packagesDir }),
    packages: publishPackages,
    // Mirrored packages always publish their built dist, so a build that skipped
    // `underpin prepare-package` fails the publish instead of shipping the source manifest.
    publishDir: options.publishDir ?? "dist",
    ...(options.releaseTag ? { releaseTag: options.releaseTag } : {}),
  }

  await writeFile(path.join(target, ".gitignore"), DEFAULT_GITIGNORE, "utf8")
  // A mirror that still has the legacy config file keeps its name.
  const configFile = await resolveConfigFile(target)

  await writeFile(path.join(target, configFile), formatJson(mirrorConfig))

  // Extras go last, so they can replace the generated .gitignore and config.
  for (const { source, destination } of extraFiles) {
    await copyEntry(path.join(root, source), path.join(target, destination))
  }

  return files
}
