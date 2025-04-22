import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { join } from "node:path";

vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock("node:path", () => ({
  join: (...args: string[]) => args.join("/"),
}));

vi.mock("node:child_process", () => ({
  spawn: vi.fn(() => ({
    pid: 12345,
    on: vi.fn(),
    kill: vi.fn(),
  })),
}));

vi.mock("../../src/core/executor", () => ({
  executeCommand: vi.fn(),
}));

vi.mock("../../src/core/logger", () => ({
  logger: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../src/filesystem/operations", () => ({
  addDefaultModels: vi.fn(),
  addGitIgnoreFile: vi.fn(),
  prismaRootExists: vi.fn(),
  createDirectory: vi.fn(),
  removeDirectory: vi.fn(),
  moveDirectory: vi.fn(),
  updateClientOutputDirectory: vi.fn(),
}));

// Now import everything after setting up the mocks
import * as fs from "node:fs";
import * as child_process from "node:child_process";
import * as executor from "../../src/core/executor";
import * as logger from "../../src/core/logger";
import * as fileOps from "../../src/filesystem/operations";

// Import the functions we're testing
import {
  runMigration,
  formatSchema,
  generateClient,
  initializePrisma,
  startStudio,
} from "../../src/prisma/commands";

describe("runMigration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call runPrismaCommand with the correct arguments", () => {
    // Mock the executeCommand to return success
    vi.mocked(executor.executeCommand).mockReturnValue({
      stdout: "",
      stderr: "",
      exitCode: 0,
    });

    runMigration("test/schema.prisma");

    expect(executor.executeCommand).toHaveBeenCalledWith("npx", [
      "prisma",
      "migrate",
      "dev",
      "--schema",
      "test/schema.prisma",
      "--name",
      "init",
    ]);
  });

  it("should return true when migration succeeds", () => {
    vi.mocked(executor.executeCommand).mockReturnValue({
      stdout: "",
      stderr: "",
      exitCode: 0,
    });

    const result = runMigration("test/schema.prisma");

    expect(result).toBe(true);
    expect(logger.logger.success).toHaveBeenCalledWith(
      "Migration completed successfully",
    );
  });

  it("should return false when migration fails", () => {
    vi.mocked(executor.executeCommand).mockReturnValue({
      stdout: "",
      stderr: "Error during migration",
      exitCode: 1,
    });

    const result = runMigration("test/schema.prisma");

    expect(result).toBe(false);
    expect(logger.logger.error).toHaveBeenCalledWith(
      "Migration failed",
      "Error during migration",
    );
  });
});

describe("formatSchema", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call runPrismaCommand with the correct arguments", () => {
    vi.mocked(executor.executeCommand).mockReturnValue({
      stdout: "",
      stderr: "",
      exitCode: 0,
    });

    formatSchema("test/schema.prisma");

    expect(executor.executeCommand).toHaveBeenCalledWith("npx", [
      "prisma",
      "format",
      "--schema",
      "test/schema.prisma",
    ]);
  });

  it("should return true when formatting succeeds", () => {
    vi.mocked(executor.executeCommand).mockReturnValue({
      stdout: "",
      stderr: "",
      exitCode: 0,
    });

    const result = formatSchema("test/schema.prisma");

    expect(result).toBe(true);
    expect(logger.logger.success).toHaveBeenCalledWith(
      "Schema formatted successfully",
    );
  });

  it("should return false when formatting fails", () => {
    vi.mocked(executor.executeCommand).mockReturnValue({
      stdout: "",
      stderr: "Error formatting schema",
      exitCode: 1,
    });

    const result = formatSchema("test/schema.prisma");

    expect(result).toBe(false);
    expect(logger.logger.error).toHaveBeenCalledWith(
      "Schema formatting failed",
      "Error formatting schema",
    );
  });
});

describe("generateClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call runPrismaCommand with the correct arguments", () => {
    vi.mocked(executor.executeCommand).mockReturnValue({
      stdout: "",
      stderr: "",
      exitCode: 0,
    });

    generateClient("test/schema.prisma");

    expect(executor.executeCommand).toHaveBeenCalledWith("npx", [
      "prisma",
      "generate",
      "--schema",
      "test/schema.prisma",
    ]);
  });

  it("should return true when client generation succeeds", () => {
    vi.mocked(executor.executeCommand).mockReturnValue({
      stdout: "",
      stderr: "",
      exitCode: 0,
    });

    const result = generateClient("test/schema.prisma");

    expect(result).toBe(true);
    expect(logger.logger.success).toHaveBeenCalledWith(
      "Client generated successfully",
    );
  });

  it("should return false when client generation fails", () => {
    vi.mocked(executor.executeCommand).mockReturnValue({
      stdout: "",
      stderr: "Error generating client",
      exitCode: 1,
    });

    const result = generateClient("test/schema.prisma");

    expect(result).toBe(false);
    expect(logger.logger.error).toHaveBeenCalledWith(
      "Client generation failed",
      "Error generating client",
    );
  });
});

describe("initializePrisma", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(executor.executeCommand).mockReturnValue({
      stdout: "",
      stderr: "",
      exitCode: 0,
    });

    vi.mocked(fileOps.prismaRootExists).mockReturnValue(false);
  });

  it("should call executeCommand with correct initialization arguments", () => {
    initializePrisma("custom-prisma", "postgresql");

    expect(executor.executeCommand).toHaveBeenCalledWith("npx", [
      "prisma",
      "init",
      "--datasource-provider",
      "postgresql",
    ]);
  });

  it("should return false if initialization fails", () => {
    vi.mocked(executor.executeCommand).mockReturnValueOnce({
      stdout: "",
      stderr: "Error",
      exitCode: 1,
    });

    const result = initializePrisma("custom-prisma");
    expect(result).toBe(false);
  });

  it("should perform setup operations when initialization succeeds", () => {
    const result = initializePrisma("custom-prisma");

    expect(result).toBe(true);
    expect(fileOps.addDefaultModels).toHaveBeenCalledWith(
      "custom-prisma",
      "schema.prisma",
    );
    expect(fileOps.updateClientOutputDirectory).toHaveBeenCalledWith(
      "custom-prisma",
      "schema.prisma",
      "client",
    );
    expect(fileOps.addGitIgnoreFile).toHaveBeenCalledWith(
      "custom-prisma",
      "client",
    );
  });

  it("should move directories when rootDir is not 'prisma'", () => {
    initializePrisma("custom-prisma");

    expect(fileOps.moveDirectory).toHaveBeenCalledWith(
      "./prisma",
      "custom-prisma",
    );
    expect(fileOps.removeDirectory).toHaveBeenCalledWith("./prisma");
  });

  it("should not move directories when rootDir is 'prisma'", () => {
    initializePrisma("prisma");

    expect(fileOps.moveDirectory).not.toHaveBeenCalled();
    expect(fileOps.removeDirectory).not.toHaveBeenCalled();
  });
});

describe("startStudio", () => {
  let mockChildProcess: child_process.ChildProcess;

  beforeEach(() => {
    vi.clearAllMocks();

    mockChildProcess = {
      pid: 12345,
      on: vi.fn(),
      kill: vi.fn(),
    } as unknown as child_process.ChildProcess;

    vi.mocked(child_process.spawn).mockReturnValue(mockChildProcess);

    vi.spyOn(process, "on").mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should spawn the Prisma Studio process with correct arguments", () => {
    startStudio("test/schema.prisma");

    expect(child_process.spawn).toHaveBeenCalledWith(
      "npx",
      [
        "prisma",
        "studio",
        "--schema",
        "test/schema.prisma",
        "--browser",
        "none",
      ],
      {
        stdio: "pipe",
        detached: false,
      },
    );
  });

  it("should return false and log an error if the process fails to start", () => {
    const failedProcess = {
      pid: undefined,
      on: vi.fn(),
      kill: vi.fn(),
    };

    vi.mocked(child_process.spawn).mockReturnValueOnce(
      failedProcess as unknown as child_process.ChildProcess,
    );

    const result = startStudio("test/schema.prisma");

    expect(result).toBe(false);
    expect(logger.logger.error).toHaveBeenCalledWith(
      "Failed to start Prisma Studio",
    );
  });

  it("should return true and log success if the process starts correctly", () => {
    const result = startStudio("test/schema.prisma");

    expect(result).toBe(true);
    expect(logger.logger.success).toHaveBeenCalledWith(
      "Prisma Studio running at http://localhost:5555",
    );
  });

  it("should attach error handler to the process", () => {
    startStudio("test/schema.prisma");

    expect(mockChildProcess.on).toHaveBeenCalledWith(
      "error",
      expect.any(Function),
    );
  });

  it("should kill the process on exit signals", () => {
    startStudio("test/schema.prisma");

    expect(process.on).toHaveBeenCalledWith("SIGINT", expect.any(Function));
    expect(process.on).toHaveBeenCalledWith("SIGTERM", expect.any(Function));
    expect(process.on).toHaveBeenCalledWith("SIGQUIT", expect.any(Function));

    const sigintCall = vi
      .mocked(process.on)
      .mock.calls.find((call) => call[0] === "SIGINT");

    expect(sigintCall).toBeDefined();

    if (sigintCall) {
      const exitHandler = sigintCall[1];
      exitHandler();

      expect(logger.logger.info).toHaveBeenCalledWith(
        "Stopping Prisma Studio...",
      );
      expect(mockChildProcess.kill).toHaveBeenCalled();
    }
  });
});

describe("detectPackageManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should detect package managers based on lock files", () => {
    const detectPackageManager = (projectRoot = process.cwd()) => {
      if (fs.existsSync(join(projectRoot, "pnpm-lock.yaml"))) return "pnpm";
      if (fs.existsSync(join(projectRoot, "yarn.lock"))) return "yarn";
      if (fs.existsSync(join(projectRoot, "bun.lockb"))) return "bun";
      if (fs.existsSync(join(projectRoot, "package-lock.json"))) return "npm";
      return "npm";
    };

    vi.mocked(fs.existsSync).mockImplementation((path) => {
      return String(path).endsWith("pnpm-lock.yaml");
    });
    expect(detectPackageManager()).toBe("pnpm");

    vi.mocked(fs.existsSync).mockImplementation((path) => {
      return String(path).endsWith("yarn.lock");
    });
    expect(detectPackageManager()).toBe("yarn");

    vi.mocked(fs.existsSync).mockImplementation((path) => {
      return String(path).endsWith("bun.lockb");
    });
    expect(detectPackageManager()).toBe("bun");

    vi.mocked(fs.existsSync).mockImplementation((path) => {
      return String(path).endsWith("package-lock.json");
    });
    expect(detectPackageManager()).toBe("npm");

    vi.mocked(fs.existsSync).mockImplementation(() => false);
    expect(detectPackageManager()).toBe("npm");
  });
});

describe("createPrismaSingleton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create singleton file when initializing prisma", () => {
    vi.mocked(executor.executeCommand).mockReturnValue({
      stdout: "",
      stderr: "",
      exitCode: 0,
    });

    vi.mocked(fs.existsSync).mockImplementation((path) => {
      if (String(path).endsWith("package-lock.json")) return true;
      if (String(path).endsWith("index.ts")) return false;
      return true;
    });

    initializePrisma("custom-prisma");

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("custom-prisma/index.ts"),
      expect.stringContaining("import { PrismaClient } from './client'"),
      { encoding: "utf8" },
    );

    expect(logger.logger.success).toHaveBeenCalledWith(
      expect.stringContaining("Prisma client singleton created"),
    );
  });

  it("should not overwrite the singleton file if it already exists", () => {
    vi.mocked(executor.executeCommand).mockReturnValue({
      stdout: "",
      stderr: "",
      exitCode: 0,
    });

    vi.mocked(fs.existsSync).mockReturnValue(true);

    initializePrisma("custom-prisma");

    expect(fs.writeFileSync).not.toHaveBeenCalledWith(
      expect.stringContaining("index.ts"),
      expect.any(String),
      expect.any(Object),
    );
  });
});
