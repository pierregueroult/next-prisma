import chalk from "chalk";

type LogType = "info" | "success" | "warn" | "error";

const ICONS: Record<LogType, string> = {
  info: chalk.blue("ℹ"),
  success: chalk.green("✓"),
  warn: chalk.yellow("⚠"),
  error: chalk.red("✖"),
};

class Logger {
  _context: string;

  constructor(context: string) {
    this._context = context;
  }

  log(type: LogType, message: string, ...args: string[]) {
    const MAX_WIDTH = process.stdout.columns || 100;

    const icon = ICONS[type];

    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const timeStr = chalk.gray(now);
    const context = chalk.gray(this._context);

    const line = `${icon} ${message}`;
    const paddingLength = Math.max(
      1,
      MAX_WIDTH - line.length - timeStr.length - context.length + 25,
    );
    const padding = " ".repeat(paddingLength);

    console.log(` ${line}${padding}${context} ${timeStr}`);
    if (args.length > 0) {
      console.log(...args.map((arg) => chalk.gray(arg)));
    }
  }

  info(msg: string, ...args: string[]) {
    this.log("info", msg, ...args);
  }

  success(msg: string, ...args: string[]) {
    this.log("success", msg, ...args);
  }

  warn(msg: string, ...args: string[]) {
    this.log("warn", msg, ...args);
  }

  error(msg: string, ...args: string[]) {
    this.log("error", msg, ...args);
  }
}

const logger = new Logger("@pgdev/next-prisma");

export { logger };
