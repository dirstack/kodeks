import { describe, expect, it } from "bun:test"
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { runCommand } from "./command.ts"
import { listSyncFiles, parseExtra, syncPublic } from "./sync-public.ts"

async function writeTree(root: string, files: Record<string, string>) {
  for (const [file, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true })
    await writeFile(path.join(root, file), content)
  }
}

async function createMonorepo() {
  const root = await mkdtemp(path.join(tmpdir(), "kodeks-sync-"))

  await writeTree(root, {
    "packages/sdk/package.json": JSON.stringify({ name: "@acme/sdk", version: "1.0.0" }),
    "packages/sdk/src/index.ts": "export {}\n",
    "packages/sdk/.npmignore": "src\n",
    "packages/sdk/dist/index.js": "built\n",
    "packages/sdk/node_modules/typescript/index.js": "dependency\n",
    "packages/sdk/.turbo/turbo-build.log": "log\n",
    "packages/sdk/src/nested/dist/keep.ts": "nested build output\n",
    "packages/tsconfig/package.json": JSON.stringify({ name: "@acme/tsconfig", private: true }),
    "packages/tsconfig/base.json": "{}\n",
    "packages/api/package.json": JSON.stringify({ name: "@acme/api", private: true }),
    "packages/sdk/LICENSE": "MIT\n",
    "mirror/README.md": "# Acme\n",
  })

  return root
}

describe("listSyncFiles", () => {
  it("should list only the requested packages", async () => {
    const root = await createMonorepo()
    const files = await listSyncFiles(root, "packages", ["sdk", "tsconfig"])

    expect(files).toEqual([
      "packages/sdk/.npmignore",
      "packages/sdk/LICENSE",
      "packages/sdk/package.json",
      "packages/sdk/src/index.ts",
      "packages/tsconfig/base.json",
      "packages/tsconfig/package.json",
    ])
  })

  it("should skip extra excluded names at any depth", async () => {
    const root = await createMonorepo()
    const files = await listSyncFiles(root, "packages", ["sdk"], ["dist", "LICENSE"])

    expect(files).toContain("packages/sdk/.turbo/turbo-build.log")
    expect(files).not.toContain("packages/sdk/LICENSE")
  })

  it("should skip files git ignores when the monorepo is a git repository", async () => {
    const root = await createMonorepo()
    await writeTree(root, {
      ".gitignore": ".env\n",
      "packages/sdk/.env": "API_SECRET=do-not-publish\n",
    })
    runCommand("git", ["init", "--quiet"], { cwd: root })

    const files = await listSyncFiles(root, "packages", ["sdk"])

    expect(files).not.toContain("packages/sdk/.env")
    expect(files).toContain("packages/sdk/src/index.ts")
  })

  it("should throw when a package directory is missing", async () => {
    const root = await createMonorepo()

    await expect(listSyncFiles(root, "packages", ["browser"])).rejects.toThrow(
      "Package directory packages/browser not found.",
    )
  })
})

describe("parseExtra", () => {
  it("should keep the relative path of a bare source", () => {
    expect(parseExtra("CONTRIBUTING.md")).toEqual({
      source: "CONTRIBUTING.md",
      destination: "CONTRIBUTING.md",
    })
  })

  it("should split a source and destination", () => {
    expect(parseExtra("mirror/README.md:README.md")).toEqual({
      source: "mirror/README.md",
      destination: "README.md",
    })
  })

  it("should reject a destination outside the mirror", () => {
    expect(() => parseExtra("mirror/README.md:../README.md")).toThrow("must stay inside")
  })
})

describe("syncPublic", () => {
  it("should mirror packages, root files and the publish config", async () => {
    const root = await createMonorepo()
    const target = await mkdtemp(path.join(tmpdir(), "kodeks-mirror-"))
    await writeTree(target, { "packages/removed/index.ts": "stale\n" })

    await syncPublic({
      root,
      target,
      packagesDir: "packages",
      packages: ["sdk", "tsconfig"],
      licenseFrom: "packages/sdk/LICENSE",
      extra: [parseExtra("mirror:.")],
      exclude: [],
    })

    const config = JSON.parse(await readFile(path.join(target, "kodeks.release.json"), "utf8"))

    expect(config).toEqual({ packages: ["sdk"] })
    expect(await readFile(path.join(target, "LICENSE"), "utf8")).toBe("MIT\n")
    expect(await readFile(path.join(target, "README.md"), "utf8")).toBe("# Acme\n")
    expect(await listSyncFiles(target, "packages", ["sdk", "tsconfig"])).toHaveLength(6)
    await expect(listSyncFiles(target, "packages", ["removed"])).rejects.toThrow("not found")
  })

  it.each([".", "..", "packages/.."])(
    "should refuse the packages directory %p, which would delete the target",
    async packagesDir => {
      const root = await createMonorepo()
      const target = await mkdtemp(path.join(tmpdir(), "kodeks-mirror-"))
      await writeTree(target, { "README.md": "# Mirror\n" })

      await expect(
        syncPublic({ root, target, packagesDir, packages: ["sdk"], extra: [], exclude: [] }),
      ).rejects.toThrow("must be a subdirectory path")
      expect(await readFile(path.join(target, "README.md"), "utf8")).toBe("# Mirror\n")
    },
  )

  it("should refuse a package name that leaves the packages directory", async () => {
    const root = await createMonorepo()
    const target = await mkdtemp(path.join(tmpdir(), "kodeks-mirror-"))

    await expect(
      syncPublic({
        root,
        target,
        packagesDir: "packages",
        packages: ["../apps"],
        extra: [],
        exclude: [],
      }),
    ).rejects.toThrow("must be a subdirectory path")
  })

  it("should refuse a target that contains the monorepo", async () => {
    const root = await createMonorepo()

    await expect(
      syncPublic({
        root,
        target: root,
        packagesDir: "packages",
        packages: ["sdk"],
        extra: [],
        exclude: [],
      }),
    ).rejects.toThrow("must not contain the monorepo")
  })
})
