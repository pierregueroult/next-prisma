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

/**
 * Wraps a Next.js configuration object with Prisma integration.
 *
 * This function automatically initializes Prisma during Next.js development,
 * setting up the schema, running migrations, generating the client, and
 * optionally starting Prisma Studio.
 *
 * @param {Partial<NextConfig>} config - The Next.js configuration object to extend.
 * @param {Partial<PrismaConfig>} options - Prisma configuration options.
 * @param {boolean} [options.runMigration=true] - Whether to automatically run migrations when needed.
 * @param {string} [options.prismaRoot="prisma"] - The root directory where Prisma files are stored.
 * @param {string} [options.dbProvider="sqlite"] - The database provider to use with Prisma.
 * @param {boolean} [options.startStudio=false] - Whether to start Prisma Studio alongside Next.js.
 *
 * @returns {Partial<NextConfig>} The original Next.js configuration object.
 *
 * @example
 * // next.config.ts
 * import { withNextPrisma } from "@pglabs/next-prisma";
 *
 * const nextConfig = {
 *   reactStrictMode: true,
 * };
 *
 * export default withNextPrisma(nextConfig, {
 *   prismaRoot: "prisma",
 *   dbProvider: "postgresql",
 *   runMigration: true,
 *   startStudio: true,
 * });
 */
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
