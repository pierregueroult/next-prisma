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

/**
 * Exécute une commande Prisma et gère la sortie de façon uniforme
 * @param command La commande Prisma à exécuter
 * @param args Arguments pour la commande
 * @param successMessage Message à afficher en cas de succès
 * @param errorMessage Message de base pour l'erreur
 * @returns true si la commande s'exécute avec succès, false sinon
 */
const executePrismaCommand = (
  command: string,
  args: string[],
  successMessage: string,
  errorMessage: string
): boolean => {
  const { stderr, exitCode } = x("npx", ["prisma", command, ...args]);
  
  if (exitCode !== 0) {
    logger.error(errorMessage, stderr);
    return false;
  }
  
  logger.success(successMessage);
  return true;
};

/**
 * Lance une migration Prisma
 */
export const prismaMigrate = (prismaSchemaPath: string): boolean => 
  executePrismaCommand(
    "migrate",
    ["dev", "--schema", prismaSchemaPath, "--name", "init"],
    "Prisma migrate ran successfully",
    "Failed to run Prisma migrate"
  );

/**
 * Formate le schéma Prisma
 */
export const prismaFormat = (prismaSchemaPath: string): boolean => 
  executePrismaCommand(
    "format",
    ["--schema", prismaSchemaPath],
    "Prisma schema formatted successfully",
    "Failed to format Prisma schema"
  );

/**
 * Génère le client Prisma
 */
export const prismaGenerateClient = (prismaSchemaPath: string): boolean => 
  executePrismaCommand(
    "generate",
    ["--schema", prismaSchemaPath],
    "Prisma client generated successfully",
    "Failed to generate Prisma client"
  );

/**
 * Initialise Prisma avec configuration du dossier racine et du provider
 */
export const prismaInit = (
  prismaRoot: string,
  provider: string = "sqlite"
): boolean => {
  if (!executePrismaCommand(
    "init",
    ["--datasource-provider", provider],
    "Prisma initialized successfully",
    "Failed to initialize Prisma"
  )) {
    return false;
  }

  // Si le chemin n'est pas le dossier prisma standard, déplacer les fichiers
  if (prismaRoot !== "prisma") {
    handleCustomPrismaRoot(prismaRoot);
  }

  // Ajouter les modèles de base et configurer le schéma
  addBasicModelsToSchema(prismaRoot, "schema.prisma");
  updateOutputDirectoryInSchema(prismaRoot, "schema.prisma", "client");
  addGitIgnoreInPrismaRoot(prismaRoot, "client");

  return true;
};

/**
 * Gère le déplacement des fichiers Prisma vers un répertoire personnalisé
 */
const handleCustomPrismaRoot = (prismaRoot: string): void => {
  const prismaRootExists = checkIfPrismaRootExistsSync(prismaRoot);
  if (!prismaRootExists) {
    createFolder(prismaRoot);
  }

  moveDir("./prisma", prismaRoot);
  deleteFolder("./prisma");
  
  logger.success(`Prisma files moved to custom directory: ${prismaRoot}`);
};