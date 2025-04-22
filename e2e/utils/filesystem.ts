import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function generateTempDirPath(): string {
  return path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "fixture",
    `test-e2e-${randomUUID()}`,
  );
}

export function getStarterFixturePath(): string {
  return path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "fixture",
    "starter",
  );
}
