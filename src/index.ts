import type { NextConfig } from "next";
import type { PrismaConfig } from "./types/config";
import { join } from "node:path";
import {
  migrationsDirectoryExists,
  prismaRootExists,
} from "./filesystem/operations";
import {
  formatSchema,
  generateClient,
  initializePrisma,
  runMigration,
  startStudio,
} from "./prisma/commands";

let prismaInitialized = false;

export function withNextPrisma(
  config: Partial<NextConfig> = {},
  {
    runMigration = true,
    prismaRoot = "prisma",
    dbProvider = "sqlite",
    startStudio = false,
  }: Partial<PrismaConfig> = {},
): Partial<NextConfig> {
  const [command] = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));

  if (command === "dev" && !prismaInitialized && process.ppid !== 1) {
    setupPrisma(prismaRoot, dbProvider, runMigration, startStudio);
  }

  return config;
}

export function setupPrisma(
  rootDir: string,
  dbProvider: string,
  shouldRunMigration: boolean,
  enableStudio: boolean,
  ignoreAlreadysInitialized = false, // for testing purposes only
): void {
  if (prismaInitialized && !ignoreAlreadysInitialized) {
    return;
  }

  const schemaPath = join(rootDir, "schema.prisma");
  const rootExists = prismaRootExists(rootDir);
  const migrationsExist = migrationsDirectoryExists(rootDir);

  if (!rootExists) {
    initializePrisma(rootDir, dbProvider);
    formatSchema(schemaPath);
  }

  if (!migrationsExist && shouldRunMigration) {
    runMigration(schemaPath);
  }

  generateClient(schemaPath);

  if (enableStudio) {
    startStudio(schemaPath);
  }

  prismaInitialized = true;
}
