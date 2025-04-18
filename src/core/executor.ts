import {
  spawn,
  spawnSync,
  type SpawnOptions,
  type SpawnSyncOptions,
  type ChildProcess,
} from "node:child_process";
import CommandError from "../errors/command-error";

interface ExecutionOptions {
  background?: boolean;
  failOnError?: boolean;
  processOptions?: SpawnOptions & SpawnSyncOptions;
}

interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  process?: ChildProcess;
}

export function executeCommand(
  command: string,
  args: string[] = [],
  options: ExecutionOptions = {},
): ExecutionResult {
  const {
    background = false,
    failOnError = false,
    processOptions = {},
  } = options;

  if (background) {
    const childProcess = spawn(command, args, {
      stdio: "ignore",
      detached: true,
      ...processOptions,
    });

    return {
      stdout: "",
      stderr: "",
      exitCode: null,
      process: childProcess,
    };
  }

  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: "pipe",
    ...processOptions,
  });

  if (failOnError && result.status !== 0) {
    throw new CommandError(
      command,
      args,
      formatOutput(result.stdout),
      formatOutput(result.stderr),
      result.status ?? -1,
    );
  }

  return {
    stdout: formatOutput(result.stdout),
    stderr: formatOutput(result.stderr),
    exitCode: result.status,
  };
}

function formatOutput(output: unknown): string {
  if (!output) return "";
  const stringOutput = typeof output === "string" ? output : String(output);
  return stringOutput.trim();
}
