import { describe, expect, it } from "bun:test"
import { mkdtemp, readFile, writeFile, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import {
  generateDistManifest,
  preparePackage,
  resolveWorkspaceRange,
  rewriteExport,
} from "./prepare-package.ts"

const sdkManifest = {
  name: "@acme/sdk",
  version: "0.9.0",
  private: false,
  license: "MIT",
  files: ["dist"],
  type: "module",
  main: "./src/index.ts",
  module: "./src/index.ts",
  types: "./src/index.ts",
  exports: { ".": "./src/index.ts" },
  publishConfig: { access: "public", directory: "dist" },
  scripts: { build: "tsdown && kodeks prepare-package" },
  dependencies: {},
  devDependencies: { typescript: "^6.0.3" },
}

describe("rewriteExport", () => {
  it("should point a TypeScript entry at the built JavaScript and declarations", () => {
    expect(rewriteExport("./src/index.ts")).toEqual({
      types: "./index.d.ts",
      import: "./index.js",
    })
  })

  it("should rewrite a TSX entry the same way", () => {
    expect(rewriteExport("./src/index.tsx")).toEqual({
      types: "./index.d.ts",
      import: "./index.js",
    })
  })

  it("should append extensions to a directory wildcard", () => {
    expect(rewriteExport("./src/components/*")).toEqual({
      types: "./components/*.d.ts",
      import: "./components/*.js",
    })
  })

  it("should replace the extension of a file wildcard", () => {
    expect(rewriteExport("./src/icons/*.tsx")).toEqual({
      types: "./icons/*.d.ts",
      import: "./icons/*.js",
    })
  })

  it("should keep a stylesheet as a plain path relative to dist", () => {
    expect(rewriteExport("./dist/styles.css")).toBe("./styles.css")
  })

  it("should leave conditions that point at published files unchanged", () => {
    const conditional = { import: "./index.js", require: "./index.cjs" }
    expect(rewriteExport(conditional)).toEqual(conditional)
  })

  it("should rewrite each source condition to its own types and import pair", () => {
    expect(
      rewriteExport({ "react-server": "./src/next/server.ts", default: "./src/next/index.ts" }),
    ).toEqual({
      "react-server": { types: "./next/server.d.ts", import: "./next/server.js" },
      default: { types: "./next/index.d.ts", import: "./next/index.js" },
    })
  })

  it("should rewrite source conditions next to a types condition to built files", () => {
    expect(rewriteExport({ types: "./src/index.ts", import: "./src/index.ts" })).toEqual({
      types: "./index.d.ts",
      import: "./index.js",
    })
  })

  it("should rewrite nested conditions", () => {
    expect(rewriteExport({ node: { "react-server": "./src/server.tsx" } })).toEqual({
      node: { "react-server": { types: "./server.d.ts", import: "./server.js" } },
    })
  })
})

describe("resolveWorkspaceRange", () => {
  it("should pin workspace:* to the exact version", () => {
    expect(resolveWorkspaceRange("workspace:*", "1.4.0")).toBe("1.4.0")
  })

  it("should keep the caret of workspace:^", () => {
    expect(resolveWorkspaceRange("workspace:^", "1.4.0")).toBe("^1.4.0")
  })

  it("should keep the tilde of workspace:~", () => {
    expect(resolveWorkspaceRange("workspace:~", "1.4.0")).toBe("~1.4.0")
  })

  it("should drop the protocol from an explicit range", () => {
    expect(resolveWorkspaceRange("workspace:^1.2.0", "1.4.0")).toBe("^1.2.0")
  })
})

describe("generateDistManifest", () => {
  it("should rewrite entry points and drop development-only fields", () => {
    expect(generateDistManifest(sdkManifest, new Map())).toEqual({
      name: "@acme/sdk",
      version: "0.9.0",
      private: false,
      license: "MIT",
      type: "module",
      main: "./index.js",
      module: "./index.js",
      types: "./index.d.ts",
      exports: { ".": { types: "./index.d.ts", import: "./index.js" } },
      publishConfig: { access: "public" },
      dependencies: {},
    })
  })

  it("should keep the key order of the source manifest", () => {
    const keys = Object.keys(generateDistManifest(sdkManifest, new Map()))
    expect(keys).toEqual([
      "name",
      "version",
      "private",
      "license",
      "type",
      "main",
      "module",
      "types",
      "exports",
      "publishConfig",
      "dependencies",
    ])
  })

  it("should resolve workspace dependencies and peer dependencies", () => {
    const manifest = generateDistManifest(
      {
        name: "@acme/react",
        version: "0.9.0",
        exports: { ".": "./src/index.tsx" },
        dependencies: { "@acme/sdk": "workspace:*", clsx: "^2.1.1" },
        peerDependencies: { "@acme/embeds": "workspace:^", react: ">=18 <20" },
      },
      new Map([
        ["@acme/sdk", "0.9.0"],
        ["@acme/embeds", "0.9.0"],
      ]),
    )

    expect(manifest.dependencies).toEqual({ "@acme/sdk": "0.9.0", clsx: "^2.1.1" })
    expect(manifest.peerDependencies).toEqual({ "@acme/embeds": "^0.9.0", react: ">=18 <20" })
  })

  it("should point main and types at the root export's built files", () => {
    const manifest = generateDistManifest(
      { name: "@acme/cli", exports: { ".": "./src/main.ts", "./config": "./src/config.ts" } },
      new Map(),
    )

    expect([manifest.main, manifest.module, manifest.types]).toEqual([
      "./main.js",
      "./main.js",
      "./main.d.ts",
    ])
  })

  it("should follow the default condition of a conditional root export", () => {
    const manifest = generateDistManifest(
      {
        name: "@acme/next",
        exports: { ".": { "react-server": "./src/server.ts", default: "./src/client.ts" } },
      },
      new Map(),
    )

    expect([manifest.main, manifest.types]).toEqual(["./client.js", "./client.d.ts"])
  })

  it("should drop main, module and types when there is no root export", () => {
    const manifest = generateDistManifest(
      {
        name: "@acme/icons",
        main: "./src/index.ts",
        types: "./src/index.ts",
        exports: { "./*": "./src/icons/*.tsx" },
      },
      new Map(),
    )

    expect(["main", "module", "types"].filter(key => key in manifest)).toEqual([])
  })

  it("should rewrite a source main and add no exports when the package has none", () => {
    const manifest = generateDistManifest(
      { name: "@acme/legacy", main: "./src/index.ts" },
      new Map(),
    )

    expect(manifest).toEqual({
      name: "@acme/legacy",
      main: "./index.js",
      module: "./index.js",
      types: "./index.d.ts",
    })
  })

  it("should keep a main that already points at a published file", () => {
    const manifest = generateDistManifest({ name: "@acme/legacy", main: "./index.cjs" }, new Map())

    expect(manifest).toEqual({ name: "@acme/legacy", main: "./index.cjs" })
  })

  it("should rewrite exports given as root conditions", () => {
    const manifest = generateDistManifest(
      { name: "@acme/sdk", exports: { types: "./src/index.ts", import: "./src/index.ts" } },
      new Map(),
    )

    expect(manifest.exports).toEqual({ types: "./index.d.ts", import: "./index.js" })
    expect(manifest.main).toBe("./index.js")
  })

  it("should omit publishConfig when only the directory hint was set", () => {
    const manifest = generateDistManifest(
      { name: "@acme/sdk", version: "1.0.0", publishConfig: { directory: "dist" } },
      new Map(),
    )

    expect("publishConfig" in manifest).toBe(false)
  })

  it("should throw when a workspace dependency has no sibling package", () => {
    expect(() =>
      generateDistManifest(
        { name: "@acme/react", dependencies: { "@acme/missing": "workspace:*" } },
        new Map(),
      ),
    ).toThrow('Cannot resolve "@acme/missing"')
  })
})

describe("preparePackage", () => {
  it("should write dist/package.json with sibling versions and copy README and LICENSE", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "kodeks-prepare-"))
    const sdkDirectory = path.join(root, "sdk")
    const reactDirectory = path.join(root, "react")

    await mkdir(sdkDirectory)
    await mkdir(reactDirectory)
    await writeFile(path.join(sdkDirectory, "package.json"), JSON.stringify(sdkManifest))
    await writeFile(
      path.join(reactDirectory, "package.json"),
      JSON.stringify({
        name: "@acme/react",
        version: "0.9.0",
        exports: { ".": "./src/index.tsx" },
        dependencies: { "@acme/sdk": "workspace:*" },
      }),
    )
    await writeFile(path.join(reactDirectory, "README.md"), "# React\n")
    await writeFile(path.join(reactDirectory, "LICENSE"), "MIT\n")

    const manifestPath = await preparePackage(reactDirectory)
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"))

    expect(manifestPath).toBe(path.join(reactDirectory, "dist", "package.json"))
    expect(manifest.dependencies).toEqual({ "@acme/sdk": "0.9.0" })
    expect(await readFile(path.join(reactDirectory, "dist", "README.md"), "utf8")).toBe("# React\n")
    expect(await readFile(path.join(reactDirectory, "dist", "LICENSE"), "utf8")).toBe("MIT\n")
  })
})
