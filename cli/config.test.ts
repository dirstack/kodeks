import { describe, expect, it } from "bun:test"
import { mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { loadReleaseConfig, parseList, parseReleaseConfig, resolveConfigFile } from "./config.ts"

describe("parseReleaseConfig", () => {
  it("should accept a full config", () => {
    const config = {
      packages: ["embeds", "sdk"],
      sync: { packages: ["embeds", "sdk", "tsconfig"], licenseFrom: "packages/sdk/LICENSE" },
    }

    expect(parseReleaseConfig(config)).toEqual(config)
  })

  it("should reject packages given as a string", () => {
    expect(() => parseReleaseConfig({ packages: "sdk" })).toThrow(
      'underpin.release.json: "packages" must be an array of strings.',
    )
  })

  it("should accept packagesOnly and reject a non-boolean value", () => {
    const config = { packages: ["ui"], sync: { packagesOnly: true } }

    expect(parseReleaseConfig(config)).toEqual(config)
    expect(() => parseReleaseConfig({ sync: { packagesOnly: "yes" } })).toThrow(
      '"sync.packagesOnly" must be a boolean',
    )
  })

  it("should reject a non-object root", () => {
    expect(() => parseReleaseConfig(["sdk"])).toThrow('"root" must be an object')
  })
})

describe("parseList", () => {
  it("should split and trim a comma-separated list", () => {
    expect(parseList("sdk, react,,browser")).toEqual(["sdk", "react", "browser"])
  })

  it("should return undefined when the option is missing", () => {
    expect(parseList(undefined)).toBeUndefined()
  })
})

describe("loadReleaseConfig", () => {
  async function createRoot(files: Record<string, string>) {
    const root = await mkdtemp(path.join(tmpdir(), "underpin-config-"))

    for (const [file, content] of Object.entries(files)) {
      await writeFile(path.join(root, file), content)
    }

    return root
  }

  it("should read underpin.release.json", async () => {
    const root = await createRoot({ "underpin.release.json": '{ "packages": ["sdk"] }' })

    expect(await loadReleaseConfig(root)).toEqual({ packages: ["sdk"] })
  })

  it("should fall back to the legacy kodeks.release.json", async () => {
    const root = await createRoot({ "kodeks.release.json": '{ "packages": ["legacy"] }' })

    expect(await resolveConfigFile(root)).toBe("kodeks.release.json")
    expect(await loadReleaseConfig(root)).toEqual({ packages: ["legacy"] })
  })

  it("should prefer underpin.release.json when both files exist", async () => {
    const root = await createRoot({
      "underpin.release.json": '{ "packages": ["sdk"] }',
      "kodeks.release.json": '{ "packages": ["legacy"] }',
    })

    expect(await loadReleaseConfig(root)).toEqual({ packages: ["sdk"] })
  })

  it("should name the legacy file in a validation error", async () => {
    const root = await createRoot({ "kodeks.release.json": '{ "packages": "sdk" }' })

    await expect(loadReleaseConfig(root)).rejects.toThrow(
      'kodeks.release.json: "packages" must be an array of strings.',
    )
  })

  it("should return an empty config without either file", async () => {
    const root = await createRoot({})

    expect(await resolveConfigFile(root)).toBe("underpin.release.json")
    expect(await loadReleaseConfig(root)).toEqual({})
  })
})
