import {
  statSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  readdirSync,
  rmSync,
  readFileSync,
  renameSync,
} from "node:fs";
import { join } from "node:path";

/**
 * Types de vérifications de fichiers
 */
enum FileCheckType {
  FILE = 'file',
  DIRECTORY = 'directory'
}

/**
 * Vérifie l'existence d'un élément dans le système de fichiers
 * @param path Chemin à vérifier
 * @param type Type d'élément à vérifier (fichier ou dossier)
 * @returns true si l'élément existe et est du type spécifié, false sinon
 */
function checkPathExistsSync(path: string, type: FileCheckType): boolean {
  try {
    const stats = statSync(path);
    return type === FileCheckType.FILE ? stats.isFile() : stats.isDirectory();
  } catch (err: any) {
    if (err.code === "ENOENT") return false;
    throw err;
  }
}

/**
 * Génère un chemin de fichier complet pour Prisma
 * @param prismaRoot Dossier racine de Prisma
 * @param fileName Nom du fichier
 * @returns Chemin complet
 */
function getPrismaPath(prismaRoot: string, fileName: string): string {
  return join(prismaRoot, fileName);
}

/**
 * Vérifie si un dossier existe
 */
function checkIfFolderExistsSync(path: string): boolean {
  return checkPathExistsSync(path, FileCheckType.DIRECTORY);
}

/**
 * Vérifie si un fichier existe
 */
function checkIfFileExistsSync(path: string): boolean {
  return checkPathExistsSync(path, FileCheckType.FILE);
}

/**
 * Vérifie si le dossier migrations existe
 */
export function checkIfMigrationsFolderExistsSync(
  prismaRoot: string,
  migrationsFolderName: string = "migrations"
): boolean {
  return checkIfFolderExistsSync(getPrismaPath(prismaRoot, migrationsFolderName));
}

/**
 * Vérifie si la racine Prisma existe
 */
export function checkIfPrismaRootExistsSync(prismaRoot: string): boolean {
  return checkIfFolderExistsSync(prismaRoot);
}

/**
 * Vérifie si le schéma Prisma existe
 */
export function checkIfPrismaSchemaExistsSync(
  prismaRoot: string,
  schemaFileName: string = "schema.prisma"
): boolean {
  return checkIfFileExistsSync(getPrismaPath(prismaRoot, schemaFileName));
}

/**
 * Crée un dossier s'il n'existe pas déjà
 */
export function createFolder(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

/**
 * Crée le dossier de migrations
 */
export function createMigrationsFolder(
  prismaRoot: string,
  migrationsFolderName: string = "migrations"
): void {
  createFolder(getPrismaPath(prismaRoot, migrationsFolderName));
}

/**
 * Crée un schéma Prisma vide
 */
export function createPrismaSchema(
  prismaRoot: string,
  schemaFileName: string = "schema.prisma"
): void {
  const schemaPath = getPrismaPath(prismaRoot, schemaFileName);
  writeFileSync(schemaPath, "", { flag: "wx" });
}

/**
 * Supprime un dossier s'il existe
 */
export function deleteFolder(path: string): void {
  if (existsSync(path)) {
    rmSync(path, { recursive: true });
  }
}

/**
 * Déplace récursivement un répertoire vers une destination
 */
export function moveDir(sourceDir: string, targetDir: string): void {
  if (!existsSync(sourceDir)) {
    throw new Error(`Le répertoire source n'existe pas: ${sourceDir}`);
  }

  createFolder(targetDir);

  const entries = readdirSync(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = join(sourceDir, entry.name);
    const targetPath = join(targetDir, entry.name);

    if (entry.isDirectory()) {
      createFolder(targetPath);
      moveDir(sourcePath, targetPath);
      deleteFolder(sourcePath);
    } else {
      renameSync(sourcePath, targetPath);
    }
  }
}

/**
 * Ajoute des modèles de base au schéma Prisma
 */
export function addBasicModelsToSchema(
  prismaRoot: string,
  schemaFileName: string = "schema.prisma"
): void {
  const schemaPath = getPrismaPath(prismaRoot, schemaFileName);
  const basicModels = `\
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int     @id @default(autoincrement())
  title     String
  content   String?
  published Boolean @default(false)
  author    User    @relation(fields: [authorId], references: [id])
  authorId  Int
}
`;

  writeFileSync(schemaPath, basicModels, { flag: "a" });
}

/**
 * Met à jour le répertoire de sortie dans le schéma Prisma
 */
export function updateOutputDirectoryInSchema(
  prismaRoot: string,
  schemaFileName: string = "schema.prisma",
  outputDir: string = "client"
): void {
  const schemaPath = getPrismaPath(prismaRoot, schemaFileName);

  if (!existsSync(schemaPath)) {
    throw new Error(`Schema file does not exist: ${schemaPath}`);
  }

  const schemaContent = checkIfFileExistsSync(schemaPath)
    ? readFileSync(schemaPath, "utf-8")
    : "";

  const generatorRegex = /generator client \{\s*provider\s*=\s*"prisma-client-js"\s*(?:output\s*=\s*".*?"\s*)?\}/g;
  const newGenerator = `generator client {
  provider = "prisma-client-js"
  output   = "./${outputDir}"
}`;

  // Si la section generator existe, la remplacer, sinon ajouter la nouvelle
  const updatedContent = schemaContent.match(generatorRegex)
    ? schemaContent.replace(generatorRegex, newGenerator)
    : schemaContent + "\n" + newGenerator;

  writeFileSync(schemaPath, updatedContent, { encoding: "utf-8" });
}

/**
 * Ajoute un fichier .gitignore dans le dossier racine de Prisma
 */
export function addGitIgnoreInPrismaRoot(
  prismaRoot: string,
  clientFolderName: string = "client"
): void {
  const gitIgnorePath = getPrismaPath(prismaRoot, ".gitignore");
  const gitignoreContent = `\
# Ignore the client folder
${clientFolderName}
# Ignore the migrations lock file
migrations/migration_lock.toml
`;

  try {
    writeFileSync(gitIgnorePath, gitignoreContent, { flag: "wx" });
  } catch (err: any) {
    // Ignorer l'erreur si le fichier existe déjà
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
}