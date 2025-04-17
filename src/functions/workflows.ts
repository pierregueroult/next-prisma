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
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

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
  errorMessage: string,
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
    "Failed to run Prisma migrate",
  );

/**
 * Formate le schéma Prisma
 */
export const prismaFormat = (prismaSchemaPath: string): boolean =>
  executePrismaCommand(
    "format",
    ["--schema", prismaSchemaPath],
    "Prisma schema formatted successfully",
    "Failed to format Prisma schema",
  );

/**
 * Génère le client Prisma
 */
export const prismaGenerateClient = (prismaSchemaPath: string): boolean =>
  executePrismaCommand(
    "generate",
    ["--schema", prismaSchemaPath],
    "Prisma client generated successfully",
    "Failed to generate Prisma client",
  );

/**
 * Initialise Prisma avec configuration du dossier racine et du provider
 */
export const prismaInit = (
  prismaRoot: string,
  provider: string = "sqlite",
): boolean => {
  if (
    !executePrismaCommand(
      "init",
      ["--datasource-provider", provider],
      "Prisma initialized successfully",
      "Failed to initialize Prisma",
    )
  ) {
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
  addPrismaToDependencies();
  addLibraryToInitPrismaSingletonInstance(prismaRoot, "client");

  return true;
};

// Variable module-scope pour stocker le processus
let prismaProcess: ReturnType<typeof spawn> | null = null;

export const prismaStudio = (schemaPath: string): boolean => {
  logger.info("Starting Prisma Studio...");

  // Utiliser spawn directement
  prismaProcess = spawn(
    "npx",
    ["prisma", "studio", "--schema", schemaPath, "--browser", "none"],
    {
      stdio: "pipe",
      detached: false,
    },
  );

  if (!prismaProcess.pid) {
    logger.error("Failed to start Prisma Studio");
    return false;
  }

  // Configurer la gestion des erreurs
  prismaProcess.on("error", (err) => {
    logger.error("Prisma Studio error:", err.message);
  });

  // Configurer le nettoyage automatique
  process.on("exit", () => {
    prismaProcess?.kill();
  });

  ["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal) => {
    process.on(signal, () => {
      logger.info(`Stopping Prisma Studio...`);
      prismaProcess?.kill();
    });
  });

  logger.success("Prisma Studio is running on http://localhost:5555");
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

const addPrismaToDependencies = () => {
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

  logger.info(`Adding Prisma to dependencies using ${packageManager}...`);

  const { stderr, exitCode } = x(
    installCommand.split(" ")[0],
    installCommand.split(" ").slice(1),
  );

  if (exitCode !== 0) {
    logger.error("Failed to add Prisma to dependencies", stderr);
    return false;
  }

  logger.success("Prisma added to dependencies successfully");
  return true;
};

function detectPackageManager(
  projectRoot: string = process.cwd(),
): "npm" | "yarn" | "pnpm" | "bun" {
  if (existsSync(join(projectRoot, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(projectRoot, "yarn.lock"))) return "yarn";
  if (existsSync(join(projectRoot, "bun.lockb"))) return "bun";
  if (existsSync(join(projectRoot, "package-lock.json"))) return "npm";
  return "npm";
}

function addLibraryToInitPrismaSingletonInstance(
  prismaRoot: string,
  clientFolderName: string = "client",
) {
  const indexPath = join(prismaRoot, "index.ts");

  logger.info(`Creating Prisma singleton instance in ${indexPath}...`);

  if (!existsSync(indexPath)) {
    const content = `
import { PrismaClient } from './${clientFolderName}'

const prisma = new PrismaClient()

const globalForPrisma = global as unknown as { prisma: typeof prisma };

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
`;

    writeFileSync(indexPath, content.trim(), { encoding: "utf8" });
  }

  logger.success(
    `Prisma singleton instance created successfully in ${indexPath}`,
  );
}
