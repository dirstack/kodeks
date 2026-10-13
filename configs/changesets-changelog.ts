// A Changesets changelog that writes each entry as plain text. The default and GitHub
// changelogs add commit hashes or pull request links, which point at the private
// monorepo when the packages are published from a public mirror.

interface Changeset {
  summary: string
}

interface DependencyRelease {
  name: string
  newVersion: string
}

async function getReleaseLine(changeset: Changeset): Promise<string> {
  const [firstLine = "", ...otherLines] = changeset.summary.split("\n").map(line => line.trimEnd())

  return [`- ${firstLine}`, ...otherLines.map(line => (line ? `  ${line}` : line))].join("\n")
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
