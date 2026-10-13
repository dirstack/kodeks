import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { formatJson } from "./json.ts"

// Changesets config has no `extends`, so this template is written into each repository.
// `privatePackages` keeps every private workspace package out of versioning without a
// hand-kept `ignore` list, and the changelog writes entries without links or commit hashes,
// which would point at the private monorepo.
const CHANGESETS_CONFIG = {
  $schema: "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  changelog: "@dirstack/kodeks/changesets-changelog",
  commit: false,
  fixed: [],
  linked: [],
  access: "public",
  baseBranch: "main",
  updateInternalDependencies: "patch",
  ignore: [],
  privatePackages: { version: false, tag: false },
}

export async function initChangesets(root: string, force: boolean): Promise<string> {
  const configPath = path.join(root, ".changeset", "config.json")

  await mkdir(path.dirname(configPath), { recursive: true })

  try {
    await writeFile(configPath, formatJson(CHANGESETS_CONFIG), { flag: force ? "w" : "wx" })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error
    throw new Error(
      `${path.relative(root, configPath)} already exists. Pass --force to replace it.`,
    )
  }

  return configPath
}
