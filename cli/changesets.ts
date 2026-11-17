import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { formatJson } from "./json.ts"

interface InitOptions {
  force: boolean
  repo?: string // GitHub repository, as `owner/name`, that changelog entries link to.
}

const CHANGELOG = "@dirstack/kodeks/changesets-changelog"

// Changesets config has no `extends`, so this template is written into each repository.
// `privatePackages` keeps every private workspace package out of versioning without a
// hand-kept `ignore` list. Without a repo, the changelog writes entries without links or
// commit hashes, which would point at a private monorepo.
const CHANGESETS_CONFIG = {
  $schema: "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  changelog: CHANGELOG,
  commit: false,
  fixed: [],
  linked: [],
  access: "public",
  baseBranch: "main",
  updateInternalDependencies: "patch",
  ignore: [],
  privatePackages: { version: false, tag: false },
}

export async function initChangesets(root: string, options: InitOptions): Promise<string> {
  const { force, repo } = options
  const configPath = path.join(root, ".changeset", "config.json")

  if (repo !== undefined && !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    throw new Error(`Invalid --repo "${repo}". Use owner/name.`)
  }

  const config = { ...CHANGESETS_CONFIG, changelog: repo ? [CHANGELOG, { repo }] : CHANGELOG }

  await mkdir(path.dirname(configPath), { recursive: true })

  try {
    await writeFile(configPath, formatJson(config), { flag: force ? "w" : "wx" })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error
    throw new Error(
      `${path.relative(root, configPath)} already exists. Pass --force to replace it.`,
    )
  }

  return configPath
}
