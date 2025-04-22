import { describe, it, expect, vi } from "vitest";
import { executeCommand } from "../../src/core/executor";
import CommandError from "../../src/errors/command-error";
import {
  spawnSync as nodeSpawnSync,
  type SpawnSyncReturns,
} from "node:child_process";

describe("executeCommand", () => {
  it("should run the command in background mode and return a child process", () => {
    const result = executeCommand("node", ["-e", "console.log('hello')"], {
      background: true,
    });

    expect(result.process).toBeDefined();
    expect(result.exitCode).toBeNull();
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe("");
  });

  it("should run the command in foreground and return stdout, stderr, exitCode", () => {
    const result = executeCommand("node", ["-e", "console.log('hello')"]);
    expect(result.stdout).toBe("hello");
    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(0);
  });

  it("should apply processOptions correctly", () => {
    const result = executeCommand(
      "node",
      ["-e", "console.log(process.cwd())"],
      {
        processOptions: { cwd: "/" },
      },
    );

    expect(result.stdout).toBe("/");
  });

  it("should throw CommandError when failOnError is true and exitCode !== 0", () => {
    expect(() => {
      executeCommand("node", ["-e", "process.exit(1)"], {
        failOnError: true,
      });
    }).toThrow(CommandError);
  });

  it("should return empty stdout and stderr if outputs are null", () => {
    const spawnSync = nodeSpawnSync;

    const mock = vi.spyOn({ spawnSync }, "spawnSync").mockReturnValue({
      stdout: Buffer.from(""),
      stderr: Buffer.from(""),
      status: 0,
      pid: 1234,
      output: [],
      signal: null,
      error: undefined,
    } satisfies SpawnSyncReturns<Buffer>);

    const result = executeCommand("echo", []);

    expect(result.stdout).toBe("");
    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(0);

    mock.mockRestore();
  });
});

describe("formatOutput", async () => {
  const { formatOutput } = await import("../../src/core/executor");

  it("should return empty string for null or undefined", () => {
    expect(formatOutput(null)).toBe("");
    expect(formatOutput(undefined)).toBe("");
  });

  it("should trim string output", () => {
    expect(formatOutput("  hello world \n")).toBe("hello world");
  });

  it("should convert and trim Buffer output", () => {
    const buffer = Buffer.from("  buffer content \n");
    expect(formatOutput(buffer)).toBe("buffer content");
  });
});
