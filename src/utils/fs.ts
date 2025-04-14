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

function checkIfFolderExistsSync(path: string): boolean {
  try {
    const stats = statSync(path);
    return stats.isDirectory();
  } catch (err: any) {
    if (err.code === "ENOENT") return false;
    throw err;
  }
}

function checkIfFileExistsSync(path: string): boolean {
  try {
    const stats = statSync(path);
    return stats.isFile();
  } catch (err: any) {
    if (err.code === "ENOENT") return false;
    throw err;
  }
}

export function checkIfMigrationsFolderExistsSync(
  prismaRoot: string,
  migrationsFolderName: string = "migrations"
): boolean {
  const migrationsPath = `${prismaRoot}/${migrationsFolderName}`;
  return checkIfFolderExistsSync(migrationsPath);
}

export function checkIfPrismaRootExistsSync(prismaRoot: string): boolean {
  return checkIfFolderExistsSync(prismaRoot);
}

export function checkIfPrismaSchemaExistsSync(
  prismaRoot: string,
  schemaFileName: string = "schema.prisma"
): boolean {
  const schemaPath = `${prismaRoot}/${schemaFileName}`;
  return checkIfFileExistsSync(schemaPath);
}

export function createMigrationsFolder(
  prismaRoot: string,
  migrationsFolderName: string = "migrations"
): void {
  const migrationsPath = `${prismaRoot}/${migrationsFolderName}`;
  mkdirSync(migrationsPath, { recursive: true });
}

export function createPrismaSchema(
  prismaRoot: string,
  schemaFileName: string = "schema.prisma"
): void {
  const schemaPath = `${prismaRoot}/${schemaFileName}`;
  writeFileSync(schemaPath, "", { flag: "wx" });
}

export function moveDir(sourceDir: string, targetDir: string): void {
  if (!existsSync(sourceDir)) {
    throw new Error(`Le répertoire source n'existe pas: ${sourceDir}`);
  }

  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  const entries = readdirSync(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = join(sourceDir, entry.name);
    const targetPath = join(targetDir, entry.name);

    if (entry.isDirectory()) {
      if (!existsSync(targetPath)) {
        mkdirSync(targetPath, { recursive: true });
      }

      moveDir(sourcePath, targetPath);
      rmSync(sourcePath, { recursive: true });
    } else {
      renameSync(sourcePath, targetPath);
    }
  }
}

export function addBasicModelsToSchema(
  prismaRoot: string,
  schemaFileName: string = "schema.prisma"
): void {
  const schemaPath = `${prismaRoot}/${schemaFileName}`;
  const additionalContent = `\
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

  writeFileSync(schemaPath, additionalContent, { flag: "a" });
}

export function updateOutputDirectoryInSchema(
  prismaRoot: string,
  schemaFileName: string = "schema.prisma",
  outputDir: string = "client"
): void {
  const schemaPath = `${prismaRoot}/${schemaFileName}`;

  if (!existsSync(schemaPath)) {
    throw new Error(`Schema file does not exist: ${schemaPath}`);
  }

  const schemaContent = statSync(schemaPath).isFile()
    ? readFileSync(schemaPath, "utf-8")
    : "";

  const updatedContent = schemaContent.replace(
    /generator client \{\s*provider\s*=\s*"prisma-client-js"\s*output\s*=\s*".*?"\s*\}/g,
    `generator client {
  provider = "prisma-client-js"
  output   = "./${outputDir}"
}`
  );

  writeFileSync(schemaPath, updatedContent, { encoding: "utf-8" });
}

export function createFolder(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

export function deleteFolder(path: string): void {
  if (existsSync(path)) {
    rmSync(path, { recursive: true });
  }
}

export function addGitIgnoreInPrismaRoot(
  prismaRoot: string,
  clientFolderName: string = "client"
): void {
  const gitIgnorePath = `${prismaRoot}/.gitignore`;
  const content = `\
# Ignore the client folder
${clientFolderName}
# Ignore the migrations lock file
migrations/migration_lock.toml
`;
  writeFileSync(gitIgnorePath, content, { flag: "wx" });
}
