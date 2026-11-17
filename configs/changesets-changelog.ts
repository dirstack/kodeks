// A Changesets changelog that writes each entry as plain text. The default and GitHub
// changelogs add commit hashes or pull request links, which point at the private
// monorepo when the packages are published from a public mirror. With a `repo` option, as
// in a public repository, each entry links to the commit that added its changeset.

interface Changeset {
  summary: string
  commit?: string
}

interface ChangelogOptions {
  repo?: string // GitHub repository, as `owner/name`.
}

interface DependencyRelease {
  name: string
  newVersion: string
}

function getCommitLink(commit: string | undefined, options: ChangelogOptions | null | undefined) {
  if (!commit || !options?.repo) return ""

  return ` ([${commit.slice(0, 7)}](https://github.com/${options.repo}/commit/${commit}))`
}

async function getReleaseLine(
  changeset: Changeset,
  _type?: unknown,
  options?: ChangelogOptions | null,
): Promise<string> {
  const [firstLine = "", ...otherLines] = changeset.summary.split("\n").map(line => line.trimEnd())
  const link = getCommitLink(changeset.commit, options)

  return [`- ${firstLine}${link}`, ...otherLines.map(line => (line ? `  ${line}` : line))].join(
    "\n",
  )
}

async function getDependencyReleaseLine(
  changesets: Changeset[],
  dependenciesUpdated: DependencyRelease[],
): Promise<string> {
  if (!changesets.length || !dependenciesUpdated.length) return ""

  return [
    "- Updated dependencies",
    ...dependenciesUpdated.map(dependency => `  - ${dependency.name}@${dependency.newVersion}`),
  ].join("\n")
}

export default { getReleaseLine, getDependencyReleaseLine }
