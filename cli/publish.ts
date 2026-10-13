import path from "node:path"
import { runCommand } from "./command.ts"
import type { ReleaseTag } from "./config.ts"
import { GITHUB_REPOSITORY, GITHUB_SHA, GITHUB_TOKEN } from "./env.ts"
import type { GitHubClient, GitHubRelease } from "./github.ts"
import {
  createGitHubRelease,
  hasGitHubCommit,
  hasGitHubRelease,
  parseGitHubRepository,
} from "./github.ts"
import { readJson } from "./json.ts"
import type { PackageJson } from "./prepare-package.ts"

export interface PublishTarget {
  directory: string // The built `dist` directory that gets published.
  name: string
  version: string
}

export interface PublishDecision extends PublishTarget {
  tag: string // The npm dist-tag.
  skip: boolean // True when this exact version is already on npm.
}

export interface PlannedRelease<T extends PublishTarget = PublishTarget> extends GitHubRelease {
  targets: T[]
}

export interface Registry {
  isPublished(name: string, version: string): Promise<boolean>
  getGitHead(name: string, version: string): Promise<string | undefined>
}

export interface ReleaseSources {
  headCommit: string
  registry: Registry
  hasCommit(sha: string): Promise<boolean>
}

interface PublishOptions {
  root: string
  packagesDir: string
  packages: string[]
  releaseTag?: ReleaseTag
  dryRun: boolean
  registry?: Registry
}

// Trusted publishing (OIDC) needs this npm version or newer.
const MINIMUM_NPM_VERSION = "11.5.1"

// `1.2.3` publishes under `latest`, `1.2.3-beta.0` under `beta`. A purely numeric
// prerelease such as `1.2.3-0` would be an invalid dist-tag, so it goes to `next`.
export function getDistTag(version: string): string {
  const [release = ""] = version.split("+")
  const dashIndex = release.indexOf("-")

  if (dashIndex === -1) return "latest"

  const [identifier = ""] = release.slice(dashIndex + 1).split(".")

  return /^\d*$/.test(identifier) ? "next" : identifier
}

function parseVersionNumbers(version: string): number[] {
  const [release = ""] = version.split("-")
  return release.split(".").map(Number)
}

export function isVersionAtLeast(version: string, minimum: string): boolean {
  const actual = parseVersionNumbers(version)
  const required = parseVersionNumbers(minimum)

  for (let index = 0; index < required.length; index++) {
    const difference = (actual[index] ?? 0) - (required[index] ?? 0)
    if (difference !== 0) return difference > 0
  }

  return true
}

async function readPublishTargets(
  root: string,
  packagesDir: string,
  packages: string[],
): Promise<PublishTarget[]> {
  const targets: PublishTarget[] = []

  for (const packageName of packages) {
    const directory = path.join(root, packagesDir, packageName, "dist")
    const manifestPath = path.join(directory, "package.json")
    let manifest: PackageJson

    try {
      manifest = await readJson<PackageJson>(manifestPath)
    } catch {
      throw new Error(`${path.relative(root, manifestPath)} not found. Build the package first.`)
    }

    if (!manifest.name || !manifest.version) {
      throw new Error(`${path.relative(root, manifestPath)} has no name or version.`)
    }

    targets.push({ directory, name: manifest.name, version: manifest.version })
  }

  return targets
}

export async function planPublish(
  targets: PublishTarget[],
  registry: Registry,
): Promise<PublishDecision[]> {
  const decisions: PublishDecision[] = []

  for (const target of targets) {
    const skip = await registry.isPublished(target.name, target.version)
    decisions.push({ ...target, tag: getDistTag(target.version), skip })
  }

  return decisions
}

export function getDefaultReleaseTag(packages: string[]): ReleaseTag {
  return packages.length === 1 ? "version" : "package"
}

// The tag scheme comes from config, never from the versions of a run, so a version keeps
// the same tag on every run. `version` needs every package at one version.
export function getReleases<T extends PublishTarget>(
  targets: T[],
  releaseTag: ReleaseTag,
): PlannedRelease<T>[] {
  if (releaseTag === "package") {
    return targets.map(target => ({
      tag: `${target.name}@${target.version}`,
      notes: `- ${target.name}@${target.version}\n`,
      prerelease: target.version.includes("-"),
      targets: [target],
    }))
  }

  const versions = [...new Set(targets.map(target => target.version))]
  const [version] = versions

  if (version === undefined) return []

  if (versions.length > 1) {
    throw new Error(
      `releaseTag "version" needs every package at one version, found ${versions.join(", ")}. Release the packages in lockstep or set releaseTag to "package".`,
    )
  }

  return [
    {
      tag: `v${version}`,
      notes: targets.map(target => `- ${target.name}@${target.version}\n`).join(""),
      prerelease: version.includes("-"),
      targets,
    },
  ]
}

// A release for a version published in this run points at HEAD. A version that was already
// on npm only gets a release when npm recorded a commit of this repository as its gitHead,
// so a version published by hand or by an older setup never gets a release at the wrong
// commit. Returns undefined when the release must not be created.
export async function findReleaseCommit(
  release: PlannedRelease<PublishDecision>,
  sources: ReleaseSources,
): Promise<string | undefined> {
  if (release.targets.some(target => !target.skip)) return sources.headCommit

  const gitHeads = new Set<string | undefined>()

  for (const { name, version } of release.targets) {
    gitHeads.add(await sources.registry.getGitHead(name, version))
  }

  const [gitHead] = gitHeads

  if (gitHeads.size !== 1 || !gitHead) return

  return (await sources.hasCommit(gitHead)) ? gitHead : undefined
}

const npmRegistry: Registry = {
  async isPublished(name, version) {
    const result = runCommand("npm", ["view", `${name}@${version}`, "version"])

    if (result.status === 0) return result.stdout.trim() !== ""
    if (/\bE404\b/.test(result.stderr)) return false

    throw new Error(`npm view ${name}@${version} failed:\n${result.stderr.trim()}`)
  },

  async getGitHead(name, version) {
    const result = runCommand("npm", ["view", `${name}@${version}`, "gitHead"])

    return result.status === 0 ? result.stdout.trim() || undefined : undefined
  },
}

function getNpmVersion(): string {
  return runCommand("npm", ["--version"]).stdout.trim()
}

function getGitHubClient(root: string): GitHubClient {
  const repository =
    GITHUB_REPOSITORY ??
    parseGitHubRepository(runCommand("git", ["remote", "get-url", "origin"], { cwd: root }).stdout)

  if (!repository) {
    throw new Error("Cannot tell the GitHub repository. Set GITHUB_REPOSITORY to owner/name.")
  }

  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN (or GH_TOKEN) is not set. It is needed to create the release.")
  }

  return { repository, token: GITHUB_TOKEN }
}

function getHeadCommit(root: string): string {
  return GITHUB_SHA ?? runCommand("git", ["rev-parse", "HEAD"], { cwd: root }).stdout.trim()
}

export async function publish(options: PublishOptions): Promise<void> {
  const { root, packagesDir, packages, dryRun, registry = npmRegistry } = options
  const releaseTag = options.releaseTag ?? getDefaultReleaseTag(packages)
  const targets = await readPublishTargets(root, packagesDir, packages)

  // Checked before publishing, so a version mismatch fails the run before anything reaches npm.
  getReleases(targets, releaseTag)

  const npmVersion = getNpmVersion()

  if (!isVersionAtLeast(npmVersion, MINIMUM_NPM_VERSION)) {
    const message = `npm ${npmVersion} is too old for trusted publishing. It needs npm ${MINIMUM_NPM_VERSION} or newer: run "npm install -g npm@11".`

    if (!dryRun) throw new Error(message)
    console.warn(`warning: ${message}`)
  }

  // Resolve the release credentials before publishing, so a missing token fails the run
  // before anything reaches npm.
  const client = dryRun ? undefined : getGitHubClient(root)
  const decisions = await planPublish(targets, registry)
  let published = 0

  for (const decision of decisions) {
    const label = `${decision.name}@${decision.version}`

    if (decision.skip) {
      console.log(`skip ${label}: already on npm`)
      continue
    }

    if (dryRun) {
      console.log(`would publish ${label} (dist-tag: ${decision.tag})`)
      published++
      continue
    }

    console.log(`publishing ${label} (dist-tag: ${decision.tag})`)

    // Auth and provenance come from trusted publishing, so no token or --provenance flag.
    const result = runCommand("npm", ["publish", "--access", "public", "--tag", decision.tag], {
      cwd: decision.directory,
      inherit: true,
    })

    if (result.status !== 0) throw new Error(`npm publish failed for ${label}.`)
    published++
  }

  if (!published) console.log("nothing to publish: every version is already on npm")

  // Releases cover every current version, not only the ones published in this run, so a
  // re-run creates a release that failed after its packages reached npm.
  for (const release of getReleases(decisions, releaseTag)) {
    if (!client) {
      if (release.targets.some(target => !target.skip)) {
        console.log(`would create release ${release.tag} unless it exists`)
      }
      continue
    }

    if (await hasGitHubRelease(client, release.tag)) {
      console.log(`release ${release.tag} already exists, skipping`)
      continue
    }

    const commit = await findReleaseCommit(release, {
      headCommit: getHeadCommit(root),
      registry,
      hasCommit: sha => hasGitHubCommit(client, sha),
    })

    if (!commit) {
      console.log(`skip release ${release.tag}: npm has no gitHead from this repository`)
      continue
    }

    await createGitHubRelease(client, release, commit)
    console.log(`created release ${release.tag}`)
  }
}
