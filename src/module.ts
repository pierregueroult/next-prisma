import type { NextConfig } from "next";
import { Options } from "./types/options";
import {
  checkIfMigrationsFolderExistsSync,
  checkIfPrismaRootExistsSync,
} from "./utils/fs";
import {
  prismaFormat,
  prismaGenerateClient,
  prismaInit,
  prismaMigrate,
} from "./functions/workflows";

export const withNextPrisma = (
  config: NextConfig = {},
  { runMigration = true, prismaRoot = "prisma", provider = "sqlite" }: Partial<Options> = {}
): NextConfig => {
  return {
    ...config,
    webpack: (webpackConfig, { isServer, dev }) => {
      if (isServer && dev) {
        const prismaRootExists = checkIfPrismaRootExistsSync(prismaRoot);
        const prismaMigrationsFolderExists =
          checkIfMigrationsFolderExistsSync(prismaRoot);

        if (!prismaRootExists) {
          prismaInit(prismaRoot, provider);
          prismaFormat(`${prismaRoot}/schema.prisma`);
        }

        if (!prismaMigrationsFolderExists && runMigration) {
          prismaMigrate(
            `${prismaRoot}/schema.prisma`
          );
        }

        prismaGenerateClient(`${prismaRoot}/schema.prisma`);
      }
      return webpackConfig;
    },
  };
};
