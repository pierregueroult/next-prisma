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

enum FileType {
  FILE = "file",
  DIRECTORY = "directory",
}

function pathExists(path: string, type: FileType): boolean {
  try {
    const stats = statSync(path);
    return type === FileType.FILE ? stats.isFile() : stats.isDirectory();
  } catch (err: any) {
    if (err.code === "ENOENT") return false;
    throw err;
  }
}

function buildPrismaPath(rootDir: string, filename: string): string {
  return join(rootDir, filename);
}

function directoryExists(path: string): boolean {
  return pathExists(path, FileType.DIRECTORY);
}

function fileExists(path: string): boolean {
  return pathExists(path, FileType.FILE);
}

export function migrationsDirectoryExists(
  rootDir: string,
  migrationsDir: string = "migrations",
): boolean {
  return directoryExists(buildPrismaPath(rootDir, migrationsDir));
}

export function prismaRootExists(rootDir: string): boolean {
  return directoryExists(rootDir);
}

export function prismaSchemaExists(
  rootDir: string,
  schemaFile: string = "schema.prisma",
): boolean {
  return fileExists(buildPrismaPath(rootDir, schemaFile));
}

export function createDirectory(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

export function createMigrationsDirectory(
  rootDir: string,
  migrationsDir: string = "migrations",
): void {
  createDirectory(buildPrismaPath(rootDir, migrationsDir));
}

export function createEmptySchema(
  rootDir: string,
  schemaFile: string = "schema.prisma",
): void {
  const schemaPath = buildPrismaPath(rootDir, schemaFile);
  writeFileSync(schemaPath, "", { flag: "wx" });
}

export function removeDirectory(path: string): void {
  if (existsSync(path)) {
    rmSync(path, { recursive: true });
  }
}

export function moveDirectory(sourceDir: string, targetDir: string): void {
  if (!existsSync(sourceDir)) {
    throw new Error(`Source directory doesn't exist: ${sourceDir}`);
  }

  createDirectory(targetDir);
  const entries = readdirSync(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = join(sourceDir, entry.name);
    const targetPath = join(targetDir, entry.name);

    if (entry.isDirectory()) {
      createDirectory(targetPath);
      moveDirectory(sourcePath, targetPath);
      removeDirectory(sourcePath);
    } else {
      renameSync(sourcePath, targetPath);
    }
  }
}

export function addDefaultModels(
  rootDir: string,
  schemaFile: string = "schema.prisma",
): void {
  const schemaPath = buildPrismaPath(rootDir, schemaFile);
  const defaultModels = `\
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
}`;

  writeFileSync(schemaPath, defaultModels, { flag: "a" });
}

export function updateClientOutputDirectory(
  rootDir: string,
  schemaFile: string = "schema.prisma",
  outputDir: string = "client",
): void {
  const schemaPath = buildPrismaPath(rootDir, schemaFile);

  if (!existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }

  const schemaContent = fileExists(schemaPath)
    ? readFileSync(schemaPath, "utf-8")
    : "";

  const generatorPattern =
    /generator client \{\s*provider\s*=\s*"prisma-client-js"\s*(?:output\s*=\s*".*?"\s*)?\}/g;
  const updatedGenerator = `generator client {
  provider = "prisma-client-js"
  output   = "./${outputDir}"
}`;

  const updatedContent = schemaContent.match(generatorPattern)
    ? schemaContent.replace(generatorPattern, updatedGenerator)
    : schemaContent + "\n" + updatedGenerator;

  writeFileSync(schemaPath, updatedContent, { encoding: "utf-8" });
}

export function addGitIgnoreFile(
  rootDir: string,
  clientDir: string = "client",
): void {
  const gitIgnorePath = buildPrismaPath(rootDir, ".gitignore");
  const gitignoreContent = `\
# Ignore the client folder
${clientDir}
# Ignore the migrations lock file
migrations/migration_lock.toml
`;

  try {
    writeFileSync(gitIgnorePath, gitignoreContent, { flag: "wx" });
  } catch (err: any) {
    if (err.code !== "EEXIST") {
      throw err;
    }
  }
}
