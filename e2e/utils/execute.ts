import { spawn, type ChildProcess } from "child_process";

export async function executeCommand(
  command: string,
  args: string[] = [],
  options: { cwd?: string; stdio?: "inherit" | "pipe" | "ignore" } = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: options.stdio || "inherit",
      shell: process.platform === "win32",
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `Command "${command} ${args.join(" ")}" exited with code ${code}`,
          ),
        );
      }
    });

    child.on("error", reject);
  });
}

export function runCommandInBackground(
  command: string,
  args: string[] = [],
  options: { cwd?: string; stdio?: "inherit" | "pipe" | "ignore" } = {},
): ChildProcess {
  const child = spawn(command, args, {
    cwd: options.cwd,
    stdio: options.stdio || "ignore",
    detached: true,
    shell: process.platform === "win32",
  });

  child.unref();

  // Gestion globale pour SIGINT / SIGTERM
  const cleanup = () => {
    if (child.pid) {
      try {
        process.kill(-child.pid, "SIGKILL");
        console.log(`[cleanup] Killed process group: ${child.pid}`);
      } catch {
        // prevent error if process is already dead
      }
    }
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("exit", cleanup);

  return child;
}
