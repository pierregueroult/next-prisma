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
import { join } from "node:path";

/**
 * Crée une configuration Prisma pour Next.js
 * @param config Configuration Next.js existante
 * @param options Options pour la configuration Prisma
 * @returns Configuration Next.js étendue avec Prisma
 */
export const withNextPrisma = (
  config: NextConfig = {},
  { 
    runMigration = true, 
    prismaRoot = "prisma", 
    provider = "sqlite" 
  }: Partial<Options> = {}
): NextConfig => {
  return {
    ...config,
    webpack: (webpackConfig, { isServer, dev, ...rest }) => {
      // Exécuter les actions Prisma uniquement en mode développement côté serveur
      if (isServer && dev) {
        setupPrismaEnvironment(prismaRoot, provider, runMigration);
      }

      // Préserver la configuration webpack existante s'il y en a une
      if (typeof config.webpack === 'function') {
        return config.webpack(webpackConfig, { isServer, dev, ...rest });
      }

      return webpackConfig;
    },
  };
};

/**
 * Configure l'environnement Prisma
 * @param prismaRoot Dossier racine de Prisma
 * @param provider Fournisseur de base de données
 * @param runMigration Si true, exécute les migrations
 */
function setupPrismaEnvironment(
  prismaRoot: string,
  provider: string,
  runMigration: boolean
): void {
  const schemaPath = join(prismaRoot, "schema.prisma");
  const prismaRootExists = checkIfPrismaRootExistsSync(prismaRoot);
  const prismaMigrationsFolderExists = checkIfMigrationsFolderExistsSync(prismaRoot);

  // Initialiser Prisma si le dossier racine n'existe pas
  if (!prismaRootExists) {
    prismaInit(prismaRoot, provider);
    prismaFormat(schemaPath);
  }

  // Exécuter les migrations si nécessaire
  if (!prismaMigrationsFolderExists && runMigration) {
    prismaMigrate(schemaPath);
  }

  // Toujours générer le client Prisma
  prismaGenerateClient(schemaPath);
}