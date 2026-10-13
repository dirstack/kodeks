import { GITHUB_API_URL } from "./env.ts"

export interface GitHubClient {
  repository: string // Repository slug, as `owner/name`.
  token: string
}

export interface GitHubRelease {
  tag: string
  notes: string
  prerelease: boolean
}

// Accepts the SSH and HTTPS remote forms GitHub hands out.
export function parseGitHubRepository(remoteUrl: string): string | undefined {
  const match = remoteUrl.trim().match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?\/?$/)

  return match?.[1]
}

async function requestGitHub(client: GitHubClient, method: string, route: string, body?: unknown) {
  return fetch(`${GITHUB_API_URL}/repos/${client.repository}${route}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${client.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

export async function hasGitHubRelease(client: GitHubClient, tag: string): Promise<boolean> {
  const response = await requestGitHub(client, "GET", `/releases/tags/${encodeURIComponent(tag)}`)

  if (response.status === 404) return false
  if (response.ok) return true

  throw new Error(
    `GitHub API returned ${response.status} for release ${tag}: ${await response.text()}`,
  )
}

export async function hasGitHubCommit(client: GitHubClient, sha: string): Promise<boolean> {
  const response = await requestGitHub(client, "GET", `/commits/${encodeURIComponent(sha)}`)

  if (response.status === 404 || response.status === 422) return false
  if (response.ok) return true

  throw new Error(
    `GitHub API returned ${response.status} for commit ${sha}: ${await response.text()}`,
  )
}

// Creating the release also creates its tag on `commit` when the tag does not exist yet.
export async function createGitHubRelease(
  client: GitHubClient,
  release: GitHubRelease,
  commit: string,
): Promise<void> {
  const response = await requestGitHub(client, "POST", "/releases", {
    tag_name: release.tag,
    target_commitish: commit,
    name: release.tag,
    body: release.notes,
    prerelease: release.prerelease,
  })

  if (!response.ok) {
    throw new Error(
      `GitHub API returned ${response.status} creating release ${release.tag}: ${await response.text()}`,
    )
  }
}
