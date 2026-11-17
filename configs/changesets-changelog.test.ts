import { describe, expect, it } from "bun:test"
import changelog from "./changesets-changelog.ts"

describe("getReleaseLine", () => {
  it("should write the summary without a commit hash or link", async () => {
    expect(await changelog.getReleaseLine({ summary: "Add a tierId placement option." })).toBe(
      "- Add a tierId placement option.",
    )
  })

  it("should link the commit when a repository is configured", async () => {
    const line = await changelog.getReleaseLine(
      { summary: "Add a tierId placement option.", commit: "abc1234def5678" },
      "minor",
      { repo: "acme/sdk" },
    )

    expect(line).toBe(
      "- Add a tierId placement option. ([abc1234](https://github.com/acme/sdk/commit/abc1234def5678))",
    )
  })

  it("should leave out the commit without a repository", async () => {
    const line = await changelog.getReleaseLine({ summary: "Fix tracking.", commit: "abc1234" })

    expect(line).toBe("- Fix tracking.")
  })

  it("should indent the lines after the first one", async () => {
    const line = await changelog.getReleaseLine({
      summary: "Rename weightGte to weight.\n\nThe range filter accepts gte and lt.",
    })

    expect(line).toBe("- Rename weightGte to weight.\n\n  The range filter accepts gte and lt.")
  })
})

describe("getDependencyReleaseLine", () => {
  it("should list the updated dependencies", async () => {
    const line = await changelog.getDependencyReleaseLine(
      [{ summary: "Fix tracking." }],
      [{ name: "@acme/sdk", newVersion: "1.2.1" }],
    )

    expect(line).toBe("- Updated dependencies\n  - @acme/sdk@1.2.1")
  })

  it("should write nothing when no dependency changed", async () => {
    expect(await changelog.getDependencyReleaseLine([], [])).toBe("")
  })
})
