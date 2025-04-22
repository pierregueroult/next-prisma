import { describe, it, expect } from "vitest";
import CommandError from "../../src/errors/command-error";

describe("CommandError", () => {
  const command = "echo";
  const args = ["Hello"];
  const stdout = "Hello";
  const stderr = "";
  const exitCode = 1;

  const error = new CommandError(command, args, stdout, stderr, exitCode);

  it("should set the name to 'CommandError'", () => {
    expect(error.name).toBe("CommandError");
  });

  it("should format the message correctly", () => {
    expect(error.message).toBe("Command failed: echo Hello");
  });

  it("should store stdout, stderr, and exitCode", () => {
    expect(error.stdout).toBe(stdout);
    expect(error.stderr).toBe(stderr);
    expect(error.exitCode).toBe(exitCode);
  });

  it("should have the correct prototype", () => {
    expect(error).toBeInstanceOf(CommandError);
    expect(error).toBeInstanceOf(Error);
    expect(Object.getPrototypeOf(error)).toBe(CommandError.prototype);
  });
});
