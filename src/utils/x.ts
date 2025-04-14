import { spawnSync, SpawnSyncOptions } from "node:child_process";

interface ExecOptions extends SpawnSyncOptions {}

interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export function x(
  command: string,
  args: string[] = [],
  options: ExecOptions = {}
): ExecResult {
  const result = spawnSync(command, args, {
    ...options,
    encoding: "utf8",
    stdio: "pipe",
  });

  return {
    stdout: result.stdout ? result.stdout.toString().trim() : "",
    stderr: result.stderr ? result.stderr.toString().trim() : "",
    exitCode: result.status,
  };
}
