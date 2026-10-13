import { describe, expect, it } from "bun:test"
import { mkdir, mkdtemp, readdir, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { runCommand } from "./command.ts"
import { listExtraFiles, listSyncFiles, parseExtra, syncPublic } from "./sync-public.ts"

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
    "packages/sdk/.env": "API_SECRET=do-not-publish\n",
    "mirror/README.md": "# Acme\n",
    "mirror/.env": "API_SECRET=do-not-publish\n",
    ".gitignore": ".env\n",
  })

  runCommand("git", ["init", "--quiet"], { cwd: root })

  return root
}

async function listTree(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { recursive: true, withFileTypes: true })

  return entries
    .filter(entry => entry.isFile())
    .map(entry => path.relative(directory, path.join(entry.parentPath, entry.name)))
    .sort()
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

  it("should skip files git ignores", async () => {
    const root = await createMonorepo()
    const files = await listSyncFiles(root, "packages", ["sdk"])

    expect(files).not.toContain("packages/sdk/.env")
    expect(files).toContain("packages/sdk/src/index.ts")
  })

  it("should throw when the monorepo is not a git repository", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "kodeks-plain-"))
    await writeTree(root, { "packages/sdk/.env": "API_SECRET=do-not-publish\n" })

    await expect(listSyncFiles(root, "packages", ["sdk"])).rejects.toThrow("git ls-files failed")
  })

  it("should throw when a package directory is missing", async () => {
    const root = await createMonorepo()

    await expect(listSyncFiles(root, "packages", ["browser"])).rejects.toThrow(
      "Package directory packages/browser not found.",
    )
  })
})

describe("listExtraFiles", () => {
  it("should expand a directory and skip the files git ignores", async () => {
    const root = await createMonorepo()
    const files = await listExtraFiles(root, [parseExtra("mirror:.")])

    expect(files).toEqual([{ source: "mirror/README.md", destination: "README.md" }])
  })

  it("should map a single file to its destination", async () => {
    const root = await createMonorepo()
    const files = await listExtraFiles(root, [parseExtra("./mirror/README.md:docs/README.md")])

    expect(files).toEqual([{ source: "mirror/README.md", destination: "docs/README.md" }])
  })

  it("should throw when an extra file is ignored by git", async () => {
    const root = await createMonorepo()

    await expect(listExtraFiles(root, [parseExtra("mirror/.env:.env")])).rejects.toThrow(
      "Extra mirror/.env is ignored by git",
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
  it("should mirror packages, root files and the publish config, but no ignored file", async () => {
    const root = await createMonorepo()
    const target = await mkdtemp(path.join(tmpdir(), "kodeks-mirror-"))
    await writeTree(target, { "packages/removed/index.ts": "stale\n" })

    await syncPublic({
      root,
      target,
      packagesDir: "packages",
      packages: ["sdk", "tsconfig"],
      licenseFrom: "packages/sdk/LICENSE",
      releaseTag: "version",
      extra: [parseExtra("mirror:.")],
      exclude: [],
    })

    const config = JSON.parse(await readFile(path.join(target, "kodeks.release.json"), "utf8"))

    expect(config).toEqual({ packages: ["sdk"], releaseTag: "version" })
    expect(await readFile(path.join(target, "LICENSE"), "utf8")).toBe("MIT\n")
    expect(await readFile(path.join(target, "README.md"), "utf8")).toBe("# Acme\n")
    expect(await listTree(target)).toEqual([
      ".gitignore",
      "LICENSE",
      "README.md",
      "kodeks.release.json",
      "packages/sdk/.npmignore",
      "packages/sdk/LICENSE",
      "packages/sdk/package.json",
      "packages/sdk/src/index.ts",
      "packages/tsconfig/base.json",
      "packages/tsconfig/package.json",
    ])
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
