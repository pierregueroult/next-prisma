import { x } from "../utils/x";
import { logger } from "../utils/logger";
import {
  addBasicModelsToSchema,
  addGitIgnoreInPrismaRoot,
  checkIfPrismaRootExistsSync,
  createFolder,
  deleteFolder,
  moveDir,
  updateOutputDirectoryInSchema,
} from "../utils/fs";

const TODO = "TODO";

export const prismaMigrate = (prismaSchemaPath: string) => {
  const { stderr, exitCode } = x("npx", [
    "prisma",
    "migrate",
    "dev",
    "--schema",
    prismaSchemaPath,
    "--name",
    "init",
  ]);

  if (exitCode !== 0) {
    logger.error("Failed to run Prisma migrate", stderr);
    return false;
  }

  logger.success("Prisma migrate ran successfully");

  return true;
};

export const prismaFormat = (prismaSchemaPath: string) => {
  const { stderr, exitCode } = x("npx", [
    "prisma",
    "format",
    "--schema",
    prismaSchemaPath,
  ]);

  if (exitCode !== 0) {
    logger.error("Failed to format Prisma schema", stderr);
    return false;
  }

  logger.success("Prisma schema formatted successfully");

  return true;
};

export const prismaInit = (
  prismaRoot: string,
  provider: string = "sqlite"
): boolean => {
  const { stderr, exitCode } = x("npx", [
    "prisma",
    "init",
    "--datasource-provider",
    provider,
  ]);

  if (exitCode !== 0) {
    logger.error("Failed to initialize Prisma", stderr);
    return false;
  }

  logger.success("Prisma initialized successfully");

  if (prismaRoot !== "prisma") {
    const prismaRootExists = checkIfPrismaRootExistsSync(prismaRoot);
    if (!prismaRootExists) {
      createFolder(prismaRoot);
    }

    moveDir("./prisma", prismaRoot);
    addGitIgnoreInPrismaRoot(prismaRoot, "client");
    deleteFolder("./prisma");

    logger.success(TODO);
  }

  addBasicModelsToSchema(prismaRoot, "schema.prisma");
  updateOutputDirectoryInSchema(prismaRoot, "schema.prisma", "client");

  return true;
};

export const prismaGenerateClient = (prismaSchemaPath: string) => {
  const { stderr, exitCode } = x("npx", [
    "prisma",
    "generate",
    "--schema",
    prismaSchemaPath,
  ]);

  if (exitCode !== 0) {
    logger.error("Failed to generate Prisma client", stderr);
    return false;
  }

  logger.success("Prisma client generated successfully");

  return true;
};
