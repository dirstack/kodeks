import { describe, expect, it } from "bun:test"
import { parseList, parseReleaseConfig } from "./config.ts"

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
      'kodeks.release.json: "packages" must be an array of strings.',
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
