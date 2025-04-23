import { describe, beforeEach, it, expect, vi, afterEach } from "vitest";
import { join } from "node:path";

vi.mock("../src/filesystem/operations.ts", () => ({
  prismaRootExists: vi.fn(),
  migrationsDirectoryExists: vi.fn(),
}));

vi.mock("../src/prisma/commands", () => ({
  initializePrisma: vi.fn().mockReturnValue(true),
  formatSchema: vi.fn().mockReturnValue(true),
  runMigration: vi.fn().mockReturnValue(true),
  generateClient: vi.fn().mockReturnValue(true),
  startStudio: vi.fn().mockReturnValue(true),
}));

const originalArgv = process.argv;
const originalPpid = process.ppid;

describe("withNextPrisma", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
    process.argv = [...originalArgv];
  });

  afterEach(() => {
    process.argv = originalArgv;
    Object.defineProperty(process, "ppid", { value: originalPpid });
  });

  it("should return the provided NextConfig object", async () => {
    const { withNextPrisma } = await import("../src/index");
    const config = { reactStrictMode: true };

    const result = withNextPrisma(config);

    expect(result).toEqual(config);
    expect(result.reactStrictMode).toBe(true);
  });

  it("should return an empty object if no config is provided", async () => {
    const { withNextPrisma } = await import("../src/index");

    const result = withNextPrisma();

    expect(result).toEqual({});
  });

  it("should not call setupPrisma if command is not 'dev'", async () => {
    // Mock argv to simulate a non-dev command
    process.argv = ["node", "script.js", "build"];

    // Use a spy to check if setupPrisma is called
    const { withNextPrisma, setupPrisma } = await import("../src/index");
    const setupPrismaSpy = vi.spyOn({ setupPrisma }, "setupPrisma");

    withNextPrisma();

    expect(setupPrismaSpy).not.toHaveBeenCalled();
  });

  it("should call setupPrisma if command is 'dev' and ppid is not 1", async () => {
    process.argv = ["node", "script.js", "dev"];
    Object.defineProperty(process, "ppid", { value: 123 });

    const { prismaRootExists, migrationsDirectoryExists } = await import(
      "../src/filesystem/operations"
    );
    const {
      initializePrisma,
      formatSchema,
      runMigration,
      generateClient,
      startStudio: startStudioMock,
    } = await import("../src/prisma/commands");

    vi.mocked(prismaRootExists).mockReturnValue(false);
    vi.mocked(migrationsDirectoryExists).mockReturnValue(false);

    const { withNextPrisma } = await import("../src/index");

    withNextPrisma(
      {},
      {
        prismaRoot: "test-prisma",
        dbProvider: "postgres",
        runMigration: true,
        startStudio: false,
      },
    );

    expect(initializePrisma).toHaveBeenCalledWith("test-prisma", "postgres");
    expect(formatSchema).toHaveBeenCalledWith(
      join("test-prisma", "schema.prisma"),
    );
    expect(runMigration).toHaveBeenCalledWith(
      join("test-prisma", "schema.prisma"),
    );
    expect(generateClient).toHaveBeenCalledWith(
      join("test-prisma", "schema.prisma"),
    );
    expect(startStudioMock).not.toHaveBeenCalled();
  });

  it("should not call setupPrisma if ppid is 1", async () => {
    process.argv = ["node", "script.js", "dev"];
    Object.defineProperty(process, "ppid", { value: 1 });

    const indexModule = await import("../src/index");

    const setupPrismaSpy = vi.spyOn(indexModule, "setupPrisma");

    indexModule.withNextPrisma();

    expect(setupPrismaSpy).not.toHaveBeenCalled();
  });

  it("should use default options if not provided", async () => {
    process.argv = ["node", "script.js", "dev"];
    Object.defineProperty(process, "ppid", { value: 123 });

    const { prismaRootExists, migrationsDirectoryExists } = await import(
      "../src/filesystem/operations"
    );
    const {
      initializePrisma,
      formatSchema,
      runMigration,
      generateClient,
      startStudio: startStudioMock,
    } = await import("../src/prisma/commands");

    vi.mocked(prismaRootExists).mockReturnValue(false);
    vi.mocked(migrationsDirectoryExists).mockReturnValue(false);

    const { withNextPrisma } = await import("../src/index");

    withNextPrisma();

    expect(initializePrisma).toHaveBeenCalledWith("prisma", "sqlite");
    expect(formatSchema).toHaveBeenCalledWith(join("prisma", "schema.prisma"));
    expect(runMigration).toHaveBeenCalledWith(join("prisma", "schema.prisma"));
    expect(generateClient).toHaveBeenCalledWith(
      join("prisma", "schema.prisma"),
    );
    expect(startStudioMock).not.toHaveBeenCalled();
  });
});

describe("setupPrisma", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
  });

  it("should initialize, format, migrate (if enabled), and generate when root does not exist", async () => {
    const { prismaRootExists, migrationsDirectoryExists } = await import(
      "../src/filesystem/operations"
    );
    const {
      initializePrisma,
      formatSchema,
      runMigration,
      generateClient,
      startStudio,
    } = await import("../src/prisma/commands");

    vi.mocked(prismaRootExists).mockReturnValue(false);
    vi.mocked(migrationsDirectoryExists).mockReturnValue(false);

    const { setupPrisma } = await import("../src/index");

    setupPrisma("prisma", "sqlite", true, false, true);

    expect(initializePrisma).toHaveBeenCalledWith("prisma", "sqlite");
    expect(formatSchema).toHaveBeenCalledWith(join("prisma", "schema.prisma"));
    expect(runMigration).toHaveBeenCalledWith(join("prisma", "schema.prisma"));
    expect(generateClient).toHaveBeenCalledWith(
      join("prisma", "schema.prisma"),
    );
    expect(startStudio).not.toHaveBeenCalled();
  });

  it("should initialize, format, NOT migrate (if disabled), and generate when root does not exist", async () => {
    const { prismaRootExists, migrationsDirectoryExists } = await import(
      "../src/filesystem/operations"
    );
    const { initializePrisma, formatSchema, runMigration, generateClient } =
      await import("../src/prisma/commands");

    vi.mocked(prismaRootExists).mockReturnValue(false);
    vi.mocked(migrationsDirectoryExists).mockReturnValue(false);

    const { setupPrisma } = await import("../src/index");

    setupPrisma("prisma", "sqlite", false, false, true);

    expect(initializePrisma).toHaveBeenCalledWith("prisma", "sqlite");
    expect(formatSchema).toHaveBeenCalledWith(join("prisma", "schema.prisma"));
    expect(runMigration).not.toHaveBeenCalled();
    expect(generateClient).toHaveBeenCalledWith(
      join("prisma", "schema.prisma"),
    );
  });

  it("should migrate (if enabled) and generate when root exists but migrations do not", async () => {
    const { prismaRootExists, migrationsDirectoryExists } = await import(
      "../src/filesystem/operations"
    );
    const { initializePrisma, formatSchema, runMigration, generateClient } =
      await import("../src/prisma/commands");

    vi.mocked(prismaRootExists).mockReturnValue(true);
    vi.mocked(migrationsDirectoryExists).mockReturnValue(false);

    const { setupPrisma } = await import("../src/index");

    setupPrisma("prisma", "sqlite", true, false, true);

    expect(initializePrisma).not.toHaveBeenCalled();
    expect(formatSchema).not.toHaveBeenCalled();
    expect(runMigration).toHaveBeenCalledWith(join("prisma", "schema.prisma"));
    expect(generateClient).toHaveBeenCalledWith(
      join("prisma", "schema.prisma"),
    );
  });

  it("should NOT migrate (if disabled) and generate when root exists but migrations do not", async () => {
    const { prismaRootExists, migrationsDirectoryExists } = await import(
      "../src/filesystem/operations"
    );
    const { initializePrisma, formatSchema, runMigration, generateClient } =
      await import("../src/prisma/commands");

    vi.mocked(prismaRootExists).mockReturnValue(true);
    vi.mocked(migrationsDirectoryExists).mockReturnValue(false);

    const { setupPrisma } = await import("../src/index");

    setupPrisma("prisma", "sqlite", false, false, true);

    expect(initializePrisma).not.toHaveBeenCalled();
    expect(formatSchema).not.toHaveBeenCalled();
    expect(runMigration).not.toHaveBeenCalled();
    expect(generateClient).toHaveBeenCalledWith(
      join("prisma", "schema.prisma"),
    );
  });

  it("should only generate client when root and migrations exist and migration is enabled", async () => {
    const { prismaRootExists, migrationsDirectoryExists } = await import(
      "../src/filesystem/operations"
    );
    const { initializePrisma, formatSchema, runMigration, generateClient } =
      await import("../src/prisma/commands");

    vi.mocked(prismaRootExists).mockReturnValue(true);
    vi.mocked(migrationsDirectoryExists).mockReturnValue(true);

    const { setupPrisma } = await import("../src/index");

    setupPrisma("prisma", "sqlite", true, false, true);

    expect(initializePrisma).not.toHaveBeenCalled();
    expect(formatSchema).not.toHaveBeenCalled();
    expect(runMigration).not.toHaveBeenCalled();
    expect(generateClient).toHaveBeenCalledWith(
      join("prisma", "schema.prisma"),
    );
  });

  it("should start studio when enabled", async () => {
    const { prismaRootExists, migrationsDirectoryExists } = await import(
      "../src/filesystem/operations"
    );
    const { startStudio, generateClient } = await import(
      "../src/prisma/commands"
    );

    vi.mocked(prismaRootExists).mockReturnValue(true);
    vi.mocked(migrationsDirectoryExists).mockReturnValue(true);

    const { setupPrisma } = await import("../src/index");

    setupPrisma("prisma", "sqlite", true, true, true);

    expect(startStudio).toHaveBeenCalledWith(join("prisma", "schema.prisma"));
    expect(generateClient).toHaveBeenCalledWith(
      join("prisma", "schema.prisma"),
    );
  });

  it("should NOT start studio when disabled", async () => {
    const { prismaRootExists, migrationsDirectoryExists } = await import(
      "../src/filesystem/operations"
    );
    const { startStudio, generateClient } = await import(
      "../src/prisma/commands"
    );

    vi.mocked(prismaRootExists).mockReturnValue(true);
    vi.mocked(migrationsDirectoryExists).mockReturnValue(true);

    const { setupPrisma } = await import("../src/index");

    setupPrisma("prisma", "sqlite", true, false, true);

    expect(startStudio).not.toHaveBeenCalled();
    expect(generateClient).toHaveBeenCalledWith(
      join("prisma", "schema.prisma"),
    );
  });

  it("should not run setup again if prismaInitialized is true", async () => {
    const { prismaRootExists } = await import("../src/filesystem/operations");
    const { initializePrisma, generateClient } = await import(
      "../src/prisma/commands"
    );

    vi.mocked(prismaRootExists).mockReturnValue(false);

    const { setupPrisma } = await import("../src/index");

    setupPrisma("prisma", "sqlite", false, false, false);
    expect(initializePrisma).toHaveBeenCalledTimes(1);
    expect(generateClient).toHaveBeenCalledTimes(1);

    vi.resetAllMocks();

    setupPrisma("prisma", "sqlite", false, false, false);
    expect(initializePrisma).not.toHaveBeenCalled();
    expect(generateClient).not.toHaveBeenCalled();
  });
});
