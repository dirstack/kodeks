import { readFile } from "node:fs/promises"

export async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T
}

export function formatJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`
}
