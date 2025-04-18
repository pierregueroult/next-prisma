class CommandError extends Error {
  stdout: string;
  stderr: string;
  exitCode: number;

  constructor(
    command: string,
    args: string[],
    stdout: string,
    stderr: string,
    exitCode: number,
  ) {
    const message = `Command failed: ${command} ${args.join(" ")}`;
    super(message);
    this.name = "CommandError";
    this.stdout = stdout;
    this.stderr = stderr;
    this.exitCode = exitCode;

    Object.setPrototypeOf(this, CommandError.prototype);
  }
}

export default CommandError;
