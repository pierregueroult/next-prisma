import chalk from "chalk";

type LogLevel = "info" | "success" | "warn" | "error";

const LOG_ICONS: Record<LogLevel, string> = {
  info: chalk.blue("ℹ"),
  success: chalk.green("✓"),
  warn: chalk.yellow("⚠"),
  error: chalk.red("✖"),
};

export class Logger {
  private readonly context: string;

  constructor(context: string) {
    this.context = context;
  }

  private logMessage(level: LogLevel, message: string, details: string[] = []) {
    const displayWidth = process.stdout.columns || 100;
    const icon = LOG_ICONS[level];
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const formattedTime = chalk.gray(timestamp);
    const formattedContext = chalk.gray(this.context);
    const displayMessage = `${icon} ${message}`;

    const paddingSize = Math.max(
      1,
      displayWidth -
        displayMessage.length -
        formattedTime.length -
        formattedContext.length +
        25,
    );
    const padding = " ".repeat(paddingSize);

    console.log(
      ` ${displayMessage}${padding}${formattedContext} ${formattedTime}`,
    );

    if (details.length > 0) {
      console.log(...details.map((detail) => chalk.gray(detail)));
    }
  }

  info(message: string, ...details: string[]) {
    this.logMessage("info", message, details);
  }

  success(message: string, ...details: string[]) {
    this.logMessage("success", message, details);
  }

  warn(message: string, ...details: string[]) {
    this.logMessage("warn", message, details);
  }

  error(message: string, ...details: string[]) {
    this.logMessage("error", message, details);
  }
}

export const logger = new Logger("@pgdev/next-prisma");
