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
  config: NextConfig = {},
  {
    runMigration = true,
    prismaRoot = "prisma",
    dbProvider = "sqlite",
    startStudio = false,
  }: Partial<PrismaConfig> = {},
): NextConfig {
  return {
    ...config,
    webpack: (webpackConfig, { dev, isServer, ...options }) => {
      if (dev && isServer) {
        setupPrisma(prismaRoot, dbProvider, runMigration, startStudio);
      }

      if (typeof config.webpack === "function") {
        return config.webpack(webpackConfig, { dev, isServer, ...options });
      }
      return webpackConfig;
    },
  };
}

function setupPrisma(
  rootDir: string,
  dbProvider: string,
  shouldRunMigration: boolean,
  enableStudio: boolean,
): void {
  if (prismaInitialized) {
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
