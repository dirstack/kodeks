import { spawnSync } from "node:child_process"

interface CommandResult {
  status: number
  stdout: string
  stderr: string
}

interface CommandOptions {
  cwd?: string
  inherit?: boolean // Stream output to the terminal instead of capturing it.
}

export function runCommand(
  command: string,
  args: string[],
  options: CommandOptions = {},
): CommandResult {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
    stdio: options.inherit ? "inherit" : "pipe",
  })

  if (result.error) throw result.error

  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  }
}
