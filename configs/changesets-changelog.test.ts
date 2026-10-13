import { describe, expect, it } from "bun:test"
import changelog from "./changesets-changelog.ts"

describe("getReleaseLine", () => {
  it("should write the summary without a commit hash or link", async () => {
    expect(await changelog.getReleaseLine({ summary: "Add a tierId placement option." })).toBe(
      "- Add a tierId placement option.",
    )
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
