import { describe, beforeEach, it, expect, vi, afterEach } from "vitest";
import { join } from "node:path";

// Mock dependencies
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

describe("withNextPrisma", () => {
  let mockWebpackConfig;
  let mockWebpackContext;
  let originalConsoleLog;

  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();

    originalConsoleLog = console.log;
    console.log = vi.fn();

    mockWebpackConfig = { module: { rules: [] } };
    mockWebpackContext = {
      dev: true,
      isServer: true,
      defaultLoaders: {},
      buildId: "test-build-id",
    };
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  it("should return a valid NextConfig object", async () => {
    const { withNextPrisma } = await import("../src/index");
    const result = withNextPrisma();

    expect(result).toBeTypeOf("object");
    expect(result.webpack).toBeTypeOf("function");
  });

  it("should preserve the original NextConfig object properties", async () => {
    const { withNextPrisma } = await import("../src/index");
    const originalConfig = {
      reactStrictMode: true,
      distDir: "custom-build",
      custom: "value",
    };

    const result = withNextPrisma(originalConfig);

    expect(result.reactStrictMode).toBe(true);
    expect(result.distDir).toBe("custom-build");
    expect(result.custom).toBe("value");
    expect(result.webpack).toBeTypeOf("function");
  });

  it("should define the webpack key as function if none is given", async () => {
    const { withNextPrisma } = await import("../src/index");
    const config = withNextPrisma({});

    expect(config.webpack).toBeTypeOf("function");

    const webpackResult = config.webpack!(
      mockWebpackConfig,
      mockWebpackContext,
    );
    expect(webpackResult).toEqual(mockWebpackConfig);
  });

  describe("webpack function behavior", () => {
    it("should call the original webpack function if provided", async () => {
      const originalWebpack = vi.fn().mockImplementation((config) => {
        config.modified = true;
        return config;
      });

      const { withNextPrisma } = await import("../src/index");
      const config = withNextPrisma({ webpack: originalWebpack });

      const result = config.webpack!(mockWebpackConfig, mockWebpackContext);

      expect(originalWebpack).toHaveBeenCalledWith(
        mockWebpackConfig,
        mockWebpackContext,
      );
      expect(result.modified).toBe(true);
    });

    it("should NOT call setupPrisma if isServer is false", async () => {
      const { withNextPrisma, setupPrisma } = await import("../src/index");
      const setupPrismaSpy = vi.spyOn({ setupPrisma }, "setupPrisma");

      const config = withNextPrisma();

      config.webpack!(mockWebpackConfig, {
        ...mockWebpackContext,
        isServer: false,
      });

      expect(setupPrismaSpy).not.toHaveBeenCalled();
    });

    it("should call setupPrisma if dev and isServer are true", async () => {
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

      const { withNextPrisma } = await import("../src/index");

      vi.mocked(prismaRootExists).mockReturnValue(false);
      vi.mocked(migrationsDirectoryExists).mockReturnValue(false);

      const config = withNextPrisma(
        {},
        {
          runMigration: true,
          prismaRoot: "test-prisma",
          dbProvider: "postgres",
          startStudio: false,
        },
      );

      config.webpack!(mockWebpackConfig, mockWebpackContext);

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
      expect(startStudio).not.toHaveBeenCalled();
    });
  });
});

describe("setupPrisma", () => {
  let mockWebpackConfig;
  let mockWebpackContext;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();

    mockWebpackConfig = { module: { rules: [] } };
    mockWebpackContext = {
      dev: true,
      isServer: true,
      defaultLoaders: {},
      buildId: "test-build-id",
    };
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

  it("should use default prismaRoot and dbProvider if not specified", async () => {
    const { prismaRootExists, migrationsDirectoryExists } = await import(
      "../src/filesystem/operations"
    );
    const { initializePrisma, formatSchema, runMigration, generateClient } =
      await import("../src/prisma/commands");

    vi.mocked(prismaRootExists).mockReturnValue(false);
    vi.mocked(migrationsDirectoryExists).mockReturnValue(false);

    const { withNextPrisma } = await import("../src/index");
    const config = withNextPrisma();

    config.webpack!(mockWebpackConfig, mockWebpackContext);

    expect(initializePrisma).toHaveBeenCalledWith("prisma", "sqlite");
    expect(formatSchema).toHaveBeenCalledWith(join("prisma", "schema.prisma"));
    expect(runMigration).toHaveBeenCalledWith(join("prisma", "schema.prisma"));
    expect(generateClient).toHaveBeenCalledWith(
      join("prisma", "schema.prisma"),
    );
  });
});
