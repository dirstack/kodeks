import { describe, expect, it } from "bun:test"
import type { PublishDecision, PublishTarget, Registry, ReleaseSources } from "./publish.ts"
import {
  findReleaseCommit,
  getDefaultReleaseTag,
  getDistTag,
  getReleases,
  isVersionAtLeast,
  planPublish,
} from "./publish.ts"

function createRegistry(
  published: string[],
  gitHeads: Record<string, string> = {},
  latestVersions: Record<string, string> = {},
): Registry {
  return {
    async isPublished(name, version) {
      return published.includes(`${name}@${version}`)
    },
    async getLatestVersion(name) {
      return latestVersions[name]
    },
    async getGitHead(name, version) {
      return gitHeads[`${name}@${version}`]
    },
  }
}

function createSources(registry: Registry, commits: string[]): ReleaseSources {
  return {
    headCommit: "head000",
    registry,
    async hasCommit(sha) {
      return commits.includes(sha)
    },
  }
}

function createDecision(name: string, version: string, skip: boolean): PublishDecision {
  return { directory: `packages/${name}/dist`, name, version, tag: "latest", skip }
}

const targets: PublishTarget[] = [
  { directory: "packages/embeds/dist", name: "@acme/embeds", version: "1.2.0" },
  { directory: "packages/sdk/dist", name: "@acme/sdk", version: "1.2.0" },
]

describe("getDistTag", () => {
  it("should publish a plain version under latest", () => {
    expect(getDistTag("1.2.3")).toBe("latest")
  })

  it("should publish a beta prerelease under beta", () => {
    expect(getDistTag("1.2.3-beta.0")).toBe("beta")
  })

  it("should publish a release candidate under rc", () => {
    expect(getDistTag("2.0.0-rc.4")).toBe("rc")
  })

  it("should keep a hyphenated prerelease identifier whole", () => {
    expect(getDistTag("1.0.0-canary-next.3")).toBe("canary-next")
  })

  it("should ignore build metadata", () => {
    expect(getDistTag("1.2.3+build-7")).toBe("latest")
  })

  it("should publish a numeric prerelease under next", () => {
    expect(getDistTag("1.2.3-0")).toBe("next")
  })

  it("should publish a newer stable version under latest", () => {
    expect(getDistTag("2.1.0", "2.0.4")).toBe("latest")
  })

  it("should publish a backport below the current latest under latest-<major>", () => {
    expect(getDistTag("1.0.1", "2.0.0")).toBe("latest-1")
  })

  it("should ignore the current latest for a prerelease", () => {
    expect(getDistTag("1.5.0-beta.0", "2.0.0")).toBe("beta")
  })
})

describe("isVersionAtLeast", () => {
  it("should accept the exact minimum", () => {
    expect(isVersionAtLeast("11.5.1", "11.5.1")).toBe(true)
  })

  it("should accept a newer major", () => {
    expect(isVersionAtLeast("12.0.0", "11.5.1")).toBe(true)
  })

  it("should reject an older patch", () => {
    expect(isVersionAtLeast("11.5.0", "11.5.1")).toBe(false)
  })

  it("should reject the npm bundled with Node 22", () => {
    expect(isVersionAtLeast("10.9.2", "11.5.1")).toBe(false)
  })
})

describe("planPublish", () => {
  it("should publish every version missing from npm", async () => {
    const decisions = await planPublish(targets, createRegistry([]))

    expect(decisions.map(decision => [decision.name, decision.skip, decision.tag])).toEqual([
      ["@acme/embeds", false, "latest"],
      ["@acme/sdk", false, "latest"],
    ])
  })

  it("should skip a version that is already on npm", async () => {
    const decisions = await planPublish(targets, createRegistry(["@acme/embeds@1.2.0"]))

    expect(decisions.map(decision => [decision.name, decision.skip])).toEqual([
      ["@acme/embeds", true],
      ["@acme/sdk", false],
    ])
  })

  it("should skip everything when every version is already on npm", async () => {
    const registry = createRegistry(["@acme/embeds@1.2.0", "@acme/sdk@1.2.0"])
    const decisions = await planPublish(targets, registry)

    expect(decisions.every(decision => decision.skip)).toBe(true)
  })

  it("should keep latest in place when publishing a backport", async () => {
    const registry = createRegistry([], {}, { "@acme/sdk": "2.0.0" })
    const decisions = await planPublish(
      [{ directory: "packages/sdk/dist", name: "@acme/sdk", version: "1.4.1" }],
      registry,
    )

    expect(decisions[0]?.tag).toBe("latest-1")
  })

  it("should check the exact version, not just the package name", async () => {
    const decisions = await planPublish(targets, createRegistry(["@acme/sdk@1.1.0"]))

    expect(decisions.some(decision => decision.skip)).toBe(false)
  })
})

describe("getDefaultReleaseTag", () => {
  it("should use version tags for a single package", () => {
    expect(getDefaultReleaseTag(["cli"])).toBe("version")
  })

  it("should use package tags for several packages", () => {
    expect(getDefaultReleaseTag(["embeds", "sdk"])).toBe("package")
  })
})

describe("getReleases", () => {
  it("should cut one version release for packages released in lockstep", () => {
    const releases = getReleases(targets, "version")

    expect(releases.map(({ tag, notes, prerelease }) => ({ tag, notes, prerelease }))).toEqual([
      { tag: "v1.2.0", notes: "- @acme/embeds@1.2.0\n- @acme/sdk@1.2.0\n", prerelease: false },
    ])
  })

  it("should mark a prerelease version as a prerelease", () => {
    const [release] = getReleases(
      [{ directory: "packages/sdk/dist", name: "@acme/sdk", version: "2.0.0-beta.1" }],
      "version",
    )

    expect(release?.prerelease).toBe(true)
  })

  it("should throw when version tags meet packages at different versions", () => {
    expect(() =>
      getReleases(
        [
          { directory: "packages/sdk/dist", name: "@acme/sdk", version: "1.2.0" },
          { directory: "packages/cli/dist", name: "@acme/cli", version: "1.1.0" },
        ],
        "version",
      ),
    ).toThrow('releaseTag "version" needs every package at one version, found 1.2.0, 1.1.0.')
  })

  it("should cut one package release each with package tags", () => {
    const releases = getReleases(targets, "package")

    expect(releases.map(release => release.tag)).toEqual(["@acme/embeds@1.2.0", "@acme/sdk@1.2.0"])
  })

  it("should keep a version's package tag when the other packages move on", () => {
    const first = getReleases(
      [
        { directory: "packages/a/dist", name: "a", version: "1.0.1" },
        { directory: "packages/b/dist", name: "b", version: "1.0.1" },
      ],
      "package",
    )
    const second = getReleases(
      [
        { directory: "packages/a/dist", name: "a", version: "1.0.1" },
        { directory: "packages/b/dist", name: "b", version: "1.0.2" },
      ],
      "package",
    )

    expect(first[0]?.tag).toBe("a@1.0.1")
    expect(second[0]?.tag).toBe("a@1.0.1")
  })

  it("should return no release when there are no packages", () => {
    expect(getReleases([], "version")).toEqual([])
  })
})

describe("findReleaseCommit", () => {
  it("should point a release published in this run at HEAD", async () => {
    const [release] = getReleases([createDecision("@acme/sdk", "1.2.0", false)], "version")
    const commit = await findReleaseCommit(release!, createSources(createRegistry([]), []))

    expect(commit).toBe("head000")
  })

  it("should recover a release at the gitHead npm recorded from this repository", async () => {
    const registry = createRegistry([], { "@acme/sdk@1.2.0": "abc1234" })
    const [release] = getReleases([createDecision("@acme/sdk", "1.2.0", true)], "version")

    expect(await findReleaseCommit(release!, createSources(registry, ["abc1234"]))).toBe("abc1234")
  })

  it("should skip a version published without a gitHead", async () => {
    const [release] = getReleases([createDecision("@acme/sdk", "0.0.2", true)], "version")
    const commit = await findReleaseCommit(release!, createSources(createRegistry([]), []))

    expect(commit).toBeUndefined()
  })

  it("should skip a version whose gitHead is not a commit of this repository", async () => {
    const registry = createRegistry([], { "@acme/sdk@1.2.0": "fff9999" })
    const [release] = getReleases([createDecision("@acme/sdk", "1.2.0", true)], "version")

    expect(await findReleaseCommit(release!, createSources(registry, ["abc1234"]))).toBeUndefined()
  })

  it("should skip a lockstep release whose packages came from different commits", async () => {
    const registry = createRegistry([], {
      "@acme/embeds@1.2.0": "abc1234",
      "@acme/sdk@1.2.0": "def5678",
    })
    const [release] = getReleases(
      [createDecision("@acme/embeds", "1.2.0", true), createDecision("@acme/sdk", "1.2.0", true)],
      "version",
    )
    const sources = createSources(registry, ["abc1234", "def5678"])

    expect(await findReleaseCommit(release!, sources)).toBeUndefined()
  })
})
