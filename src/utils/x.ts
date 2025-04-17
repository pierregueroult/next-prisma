import {
  spawn,
  spawnSync,
  type SpawnOptions,
  type SpawnSyncOptions,
  type ChildProcess,
} from "node:child_process";

interface ExecOptions {
  background?: boolean;
  throwOnError?: boolean;
  nodeOptions?: SpawnOptions & SpawnSyncOptions;
}

interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  process?: ChildProcess;
}

export function x(
  command: string,
  args: string[] = [],
  options: ExecOptions = {}
): ExecResult {
  const {
    background = false,
    throwOnError = false,
    nodeOptions = {},
  } = options;

  if (background) {
    const child = spawn(command, args, {
      stdio: "ignore",
      detached: true,
      ...nodeOptions,
    });

    return {
      stdout: "",
      stderr: "",
      exitCode: null,
      process: child,
    };
  }

  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: "pipe",
    ...nodeOptions,
  });

  if (throwOnError && result.status !== 0) {
    const err = new Error(`Command failed: ${command} ${args.join(" ")}`);
    (err as any).stdout = result.stdout;
    (err as any).stderr = result.stderr;
    (err as any).exitCode = result.status;
    throw err;
  }

  return {
    stdout: normalizeOutput(result.stdout),
    stderr: normalizeOutput(result.stderr),
    exitCode: result.status,
  };
}

function normalizeOutput(output: unknown): string {
  if (!output) return "";
  const stringOutput = typeof output === "string" ? output : String(output);
  return stringOutput.trim();
}