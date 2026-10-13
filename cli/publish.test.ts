import { describe, expect, it } from "bun:test"
import type { PublishTarget, Registry } from "./publish.ts"
import { getDistTag, getReleases, isVersionAtLeast, planPublish } from "./publish.ts"

function createRegistry(published: string[]): Registry {
  return {
    async isPublished(name, version) {
      return published.includes(`${name}@${version}`)
    },
  }
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

  it("should check the exact version, not just the package name", async () => {
    const decisions = await planPublish(targets, createRegistry(["@acme/sdk@1.1.0"]))

    expect(decisions.some(decision => decision.skip)).toBe(false)
  })
})

describe("getReleases", () => {
  it("should cut one release for packages sharing a version", () => {
    expect(getReleases(targets)).toEqual([
      {
        tag: "v1.2.0",
        notes: "- @acme/embeds@1.2.0\n- @acme/sdk@1.2.0\n",
        prerelease: false,
      },
    ])
  })

  it("should cut one release per distinct version", () => {
    const releases = getReleases([
      { directory: "packages/sdk/dist", name: "@acme/sdk", version: "1.2.0" },
      { directory: "packages/cli/dist", name: "@acme/cli", version: "0.3.0-beta.1" },
    ])

    expect(releases.map(release => [release.tag, release.prerelease])).toEqual([
      ["v1.2.0", false],
      ["v0.3.0-beta.1", true],
    ])
  })
})
