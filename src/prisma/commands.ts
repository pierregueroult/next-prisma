import { join } from "node:path";
import { existsSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { executeCommand } from "../core/executor";
import { logger } from "../core/logger";
import {
  addDefaultModels,
  addGitIgnoreFile,
  prismaRootExists,
  createDirectory,
  removeDirectory,
  moveDirectory,
  updateClientOutputDirectory,
} from "../filesystem/operations";

function runPrismaCommand(command: string, args: string[], successMessage: string, errorMessage: string): boolean {
  const { stderr, exitCode } = executeCommand("npx", ["prisma", command, ...args]);

  if (exitCode !== 0) {
    logger.error(errorMessage, stderr);
    return false;
  }

  logger.success(successMessage);
  return true;
}

export function runMigration(schemaPath: string): boolean {
  return runPrismaCommand(
    "migrate",
    ["dev", "--schema", schemaPath, "--name", "init"],
    "Migration completed successfully",
    "Migration failed"
  );
}

export function formatSchema(schemaPath: string): boolean {
  return runPrismaCommand(
    "format",
    ["--schema", schemaPath],
    "Schema formatted successfully",
    "Schema formatting failed"
  );
}

export function generateClient(schemaPath: string): boolean {
  return runPrismaCommand(
    "generate",
    ["--schema", schemaPath],
    "Client generated successfully",
    "Client generation failed"
  );
}

export function initializePrisma(rootDir: string, dbProvider: string = "sqlite"): boolean {
  if (
    !runPrismaCommand(
      "init",
      ["--datasource-provider", dbProvider],
      "Prisma initialized successfully",
      "Prisma initialization failed"
    )
  ) {
    return false;
  }

  if (rootDir !== "prisma") {
    setupCustomRootDirectory(rootDir);
  }

  addDefaultModels(rootDir, "schema.prisma");
  updateClientOutputDirectory(rootDir, "schema.prisma", "client");
  addGitIgnoreFile(rootDir, "client");
  addPrismaDependency();
  createPrismaSingleton(rootDir, "client");

  return true;
}

let studioProcess: ReturnType<typeof spawn> | null = null;

export function startStudio(schemaPath: string): boolean {
  logger.info("Starting Prisma Studio...");

  studioProcess = spawn("npx", ["prisma", "studio", "--schema", schemaPath, "--browser", "none"], {
    stdio: "pipe",
    detached: false,
  });

  if (!studioProcess.pid) {
    logger.error("Failed to start Prisma Studio");
    return false;
  }

  studioProcess.on("error", (err) => {
    logger.error("Prisma Studio error:", err.message);
  });

  process.on("exit", () => {
    studioProcess?.kill();
  });

  ["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal) => {
    process.on(signal, () => {
      logger.info("Stopping Prisma Studio...");
      studioProcess?.kill();
    });
  });

  logger.success("Prisma Studio running at http://localhost:5555");
  return true;
}

function setupCustomRootDirectory(rootDir: string): void {
  const rootExists = prismaRootExists(rootDir);
  if (!rootExists) {
    createDirectory(rootDir);
  }

  moveDirectory("./prisma", rootDir);
  removeDirectory("./prisma");

  logger.success(`Prisma files moved to: ${rootDir}`);
}

function addPrismaDependency() {
  const packageManager = detectPackageManager();

  let installCommand = "";
  switch (packageManager) {
    case "npm":
      installCommand = "npm install prisma --save-dev";
      break;
    case "yarn":
      installCommand = "yarn add prisma --dev";
      break;
    case "pnpm":
      installCommand = "pnpm add prisma --save-dev";
      break;
    case "bun":
      installCommand = "bun add prisma --dev";
      break;
    default:
      logger.error("Unsupported package manager");
      return false;
  }

  logger.info(`Adding Prisma dependency using ${packageManager}...`);

  const { stderr, exitCode } = executeCommand(installCommand.split(" ")[0], installCommand.split(" ").slice(1));

  if (exitCode !== 0) {
    logger.error("Failed to add Prisma dependency", stderr);
    return false;
  }

  logger.success("Prisma dependency added successfully");
  return true;
}

function detectPackageManager(projectRoot: string = process.cwd()): "npm" | "yarn" | "pnpm" | "bun" {
  if (existsSync(join(projectRoot, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(projectRoot, "yarn.lock"))) return "yarn";
  if (existsSync(join(projectRoot, "bun.lockb"))) return "bun";
  if (existsSync(join(projectRoot, "package-lock.json"))) return "npm";
  return "npm";
}

function createPrismaSingleton(rootDir: string, clientDir: string = "client") {
  const indexPath = join(rootDir, "index.ts");

  logger.info(`Creating Prisma client singleton in ${indexPath}...`);

  if (!existsSync(indexPath)) {
    const content = `
import { PrismaClient } from './${clientDir}'

const prisma = new PrismaClient()

const globalForPrisma = global as unknown as { prisma: typeof prisma };

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
`;

    writeFileSync(indexPath, content.trim(), { encoding: "utf8" });
  }

  logger.success(`Prisma client singleton created in ${indexPath}`);
}
