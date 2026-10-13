import { describe, expect, it } from "bun:test"
import { parseGitHubRepository } from "./github.ts"

describe("parseGitHubRepository", () => {
  it("should read an SSH remote", () => {
    expect(parseGitHubRepository("git@github.com:acme/acme-js.git\n")).toBe("acme/acme-js")
  })

  it("should read an HTTPS remote", () => {
    expect(parseGitHubRepository("https://github.com/acme/acme-js.git")).toBe("acme/acme-js")
  })

  it("should read an HTTPS remote without the .git suffix", () => {
    expect(parseGitHubRepository("https://github.com/acme/acme.js")).toBe("acme/acme.js")
  })

  it("should return undefined for a non-GitHub remote", () => {
    expect(parseGitHubRepository("git@gitlab.com:acme/acme-js.git")).toBeUndefined()
  })
})
