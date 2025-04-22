import { describe, it, vi, afterEach, expect } from "vitest";
import {
  statSync,
  existsSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  readdirSync,
  renameSync,
  readFileSync,
} from "fs";
import {
  pathExists,
  FileType,
  directoryExists,
  fileExists,
  migrationsDirectoryExists,
  prismaRootExists,
  prismaSchemaExists,
  createDirectory,
  createMigrationsDirectory,
  createEmptySchema,
  removeDirectory,
  moveDirectory,
  addDefaultModels,
  updateClientOutputDirectory,
  addGitIgnoreFile,
} from "../../src/filesystem/operations";

vi.mock("fs");

describe("pathExists", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should return true if the path exists and is a file", () => {
    vi.mocked(statSync).mockReturnValueOnce({
      isFile: () => true,
      isDirectory: () => false,
    } as unknown as ReturnType<typeof statSync>);

    const result = pathExists("some-file.txt", FileType.FILE);
    expect(result).toBe(true);
  });

  it("should return true if the path exists and is a directory", () => {
    vi.mocked(statSync).mockReturnValueOnce({
      isFile: () => false,
      isDirectory: () => true,
    } as unknown as ReturnType<typeof statSync>);

    const result = pathExists("some-folder", FileType.DIRECTORY);
    expect(result).toBe(true);
  });

  it("should return false if the path does not exist", () => {
    const err = new Error("Not found") as NodeJS.ErrnoException;
    err.code = "ENOENT";

    vi.mocked(statSync).mockImplementationOnce(() => {
      throw err;
    });

    const result = pathExists("nonexistent", FileType.FILE);
    expect(result).toBe(false);
  });

  it("should throw an error if statSync fails with another error", () => {
    const err = new Error("Permission denied") as NodeJS.ErrnoException;
    err.code = "EACCES";

    vi.mocked(statSync).mockImplementationOnce(() => {
      throw err;
    });

    expect(() => pathExists("restricted", FileType.FILE)).toThrow(
      "Permission denied",
    );
  });
});

describe("directoryExists", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should return true if the directory exists", () => {
    vi.mocked(statSync).mockReturnValueOnce({
      isFile: () => false,
      isDirectory: () => true,
    } as unknown as ReturnType<typeof statSync>);

    const result = directoryExists("/path/to/directory");
    expect(result).toBe(true);
    expect(statSync).toHaveBeenCalledWith("/path/to/directory");
  });

  it("should return false if the path exists but is not a directory", () => {
    vi.mocked(statSync).mockReturnValueOnce({
      isFile: () => true,
      isDirectory: () => false,
    } as unknown as ReturnType<typeof statSync>);

    const result = directoryExists("/path/to/file.txt");
    expect(result).toBe(false);
  });

  it("should return false if the directory does not exist", () => {
    const err = new Error("Not found") as NodeJS.ErrnoException;
    err.code = "ENOENT";

    vi.mocked(statSync).mockImplementationOnce(() => {
      throw err;
    });

    const result = directoryExists("/nonexistent/directory");
    expect(result).toBe(false);
  });
});

describe("fileExists", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should return true if the file exists", () => {
    vi.mocked(statSync).mockReturnValueOnce({
      isFile: () => true,
      isDirectory: () => false,
    } as unknown as ReturnType<typeof statSync>);

    const result = fileExists("/path/to/file.txt");
    expect(result).toBe(true);
    expect(statSync).toHaveBeenCalledWith("/path/to/file.txt");
  });

  it("should return false if the path exists but is not a file", () => {
    vi.mocked(statSync).mockReturnValueOnce({
      isFile: () => false,
      isDirectory: () => true,
    } as unknown as ReturnType<typeof statSync>);

    const result = fileExists("/path/to/directory");
    expect(result).toBe(false);
  });

  it("should return false if the file does not exist", () => {
    const err = new Error("Not found") as NodeJS.ErrnoException;
    err.code = "ENOENT";

    vi.mocked(statSync).mockImplementationOnce(() => {
      throw err;
    });

    const result = fileExists("/nonexistent/file.txt");
    expect(result).toBe(false);
  });

  it("should propagate other errors", () => {
    const err = new Error("Permission denied") as NodeJS.ErrnoException;
    err.code = "EACCES";

    vi.mocked(statSync).mockImplementationOnce(() => {
      throw err;
    });

    expect(() => fileExists("/restricted/file.txt")).toThrow(
      "Permission denied",
    );
  });
});

describe("migrationsDirectoryExists", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should return true if the migrations directory exists", () => {
    vi.mocked(statSync).mockReturnValueOnce({
      isFile: () => false,
      isDirectory: () => true,
    } as unknown as ReturnType<typeof statSync>);

    const result = migrationsDirectoryExists("/root/dir");
    expect(result).toBe(true);
    expect(statSync).toHaveBeenCalledWith("/root/dir/migrations");
  });

  it("should return false if the migrations directory does not exist", () => {
    const err = new Error("Not found") as NodeJS.ErrnoException;
    err.code = "ENOENT";

    vi.mocked(statSync).mockImplementationOnce(() => {
      throw err;
    });

    const result = migrationsDirectoryExists("/root/dir");
    expect(result).toBe(false);
  });

  it("should use custom migrations directory name if provided", () => {
    vi.mocked(statSync).mockReturnValueOnce({
      isFile: () => false,
      isDirectory: () => true,
    } as unknown as ReturnType<typeof statSync>);

    const result = migrationsDirectoryExists("/root/dir", "custom-migrations");
    expect(result).toBe(true);
    expect(statSync).toHaveBeenCalledWith("/root/dir/custom-migrations");
  });
});

describe("prismaRootExists", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should return true if the root directory exists", () => {
    vi.mocked(statSync).mockReturnValueOnce({
      isFile: () => false,
      isDirectory: () => true,
    } as unknown as ReturnType<typeof statSync>);

    const result = prismaRootExists("/root/dir");
    expect(result).toBe(true);
    expect(statSync).toHaveBeenCalledWith("/root/dir");
  });

  it("should return false if the root directory does not exist", () => {
    const err = new Error("Not found") as NodeJS.ErrnoException;
    err.code = "ENOENT";

    vi.mocked(statSync).mockImplementationOnce(() => {
      throw err;
    });

    const result = prismaRootExists("/nonexistent/dir");
    expect(result).toBe(false);
  });
});

describe("prismaSchemaExists", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should return true if the schema file exists", () => {
    vi.mocked(statSync).mockReturnValueOnce({
      isFile: () => true,
      isDirectory: () => false,
    } as unknown as ReturnType<typeof statSync>);

    const result = prismaSchemaExists("/root/dir");
    expect(result).toBe(true);
    expect(statSync).toHaveBeenCalledWith("/root/dir/schema.prisma");
  });

  it("should return false if the schema file does not exist", () => {
    const err = new Error("Not found") as NodeJS.ErrnoException;
    err.code = "ENOENT";

    vi.mocked(statSync).mockImplementationOnce(() => {
      throw err;
    });

    const result = prismaSchemaExists("/root/dir");
    expect(result).toBe(false);
  });

  it("should use custom schema filename if provided", () => {
    vi.mocked(statSync).mockReturnValueOnce({
      isFile: () => true,
      isDirectory: () => false,
    } as unknown as ReturnType<typeof statSync>);

    const result = prismaSchemaExists("/root/dir", "custom.prisma");
    expect(result).toBe(true);
    expect(statSync).toHaveBeenCalledWith("/root/dir/custom.prisma");
  });
});

describe("createDirectory", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should create the directory if it does not exist", () => {
    vi.mocked(existsSync).mockReturnValueOnce(false);

    createDirectory("/new/dir");

    expect(existsSync).toHaveBeenCalledWith("/new/dir");
    expect(mkdirSync).toHaveBeenCalledWith("/new/dir", { recursive: true });
  });

  it("should do nothing if the directory already exists", () => {
    vi.mocked(existsSync).mockReturnValueOnce(true);

    createDirectory("/existing/dir");

    expect(existsSync).toHaveBeenCalledWith("/existing/dir");
    expect(mkdirSync).not.toHaveBeenCalled();
  });
});

describe("createMigrationsDirectory", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should create the migrations directory inside the given rootDir", () => {
    vi.mocked(existsSync).mockReturnValueOnce(false);

    createMigrationsDirectory("/root/dir");

    expect(existsSync).toHaveBeenCalledWith("/root/dir/migrations");
    expect(mkdirSync).toHaveBeenCalledWith("/root/dir/migrations", {
      recursive: true,
    });
  });

  it("should use custom migrations directory name if provided", () => {
    vi.mocked(existsSync).mockReturnValueOnce(false);

    createMigrationsDirectory("/root/dir", "custom-migrations");

    expect(existsSync).toHaveBeenCalledWith("/root/dir/custom-migrations");
    expect(mkdirSync).toHaveBeenCalledWith("/root/dir/custom-migrations", {
      recursive: true,
    });
  });
});

describe("createEmptySchema", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should create an empty schema file if it doesn't exist", () => {
    createEmptySchema("/root/dir");

    expect(writeFileSync).toHaveBeenCalledWith("/root/dir/schema.prisma", "", {
      flag: "wx",
    });
  });

  it("should use custom schema filename if provided", () => {
    createEmptySchema("/root/dir", "custom.prisma");

    expect(writeFileSync).toHaveBeenCalledWith("/root/dir/custom.prisma", "", {
      flag: "wx",
    });
  });
});

describe("removeDirectory", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should remove the directory if it exists", () => {
    vi.mocked(existsSync).mockReturnValueOnce(true);

    removeDirectory("/existing/dir");

    expect(existsSync).toHaveBeenCalledWith("/existing/dir");
    expect(rmSync).toHaveBeenCalledWith("/existing/dir", { recursive: true });
  });

  it("should do nothing if the directory does not exist", () => {
    vi.mocked(existsSync).mockReturnValueOnce(false);

    removeDirectory("/nonexistent/dir");

    expect(existsSync).toHaveBeenCalledWith("/nonexistent/dir");
    expect(rmSync).not.toHaveBeenCalled();
  });
});

describe("moveDirectory", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should throw if source directory does not exist", () => {
    vi.mocked(existsSync).mockReturnValueOnce(false);

    expect(() => moveDirectory("/nonexistent/dir", "/target/dir")).toThrow(
      "Source directory doesn't exist: /nonexistent/dir",
    );

    expect(existsSync).toHaveBeenCalledWith("/nonexistent/dir");
  });

  it("should move all files and subdirectories to the target directory", () => {
    vi.mocked(existsSync).mockImplementation(() => true);

    const mockEntries = [
      { name: "file1.txt", isDirectory: () => false },
      { name: "subdir", isDirectory: () => true },
    ] as unknown as ReturnType<typeof readdirSync>;

    // First call for the main directory
    vi.mocked(readdirSync).mockReturnValueOnce(mockEntries);

    // Second call for the subdirectory
    vi.mocked(readdirSync).mockReturnValueOnce([]);

    moveDirectory("/source/dir", "/target/dir");

    expect(existsSync).toHaveBeenCalledWith("/source/dir");
    expect(readdirSync).toHaveBeenCalledWith("/source/dir", {
      withFileTypes: true,
    });

    // For the file
    expect(renameSync).toHaveBeenCalledWith(
      "/source/dir/file1.txt",
      "/target/dir/file1.txt",
    );
  });
});

describe("addDefaultModels", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should append the default models to the schema file", () => {
    const expectedModels = `\
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

    addDefaultModels("/root/dir");

    expect(writeFileSync).toHaveBeenCalledWith(
      "/root/dir/schema.prisma",
      expectedModels,
      { flag: "a" },
    );
  });

  it("should use custom schema filename if provided", () => {
    addDefaultModels("/root/dir", "custom.prisma");

    expect(writeFileSync).toHaveBeenCalledWith(
      "/root/dir/custom.prisma",
      expect.any(String),
      { flag: "a" },
    );
  });
});

describe("updateClientOutputDirectory", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should throw if schema file does not exist", () => {
    vi.mocked(existsSync).mockReturnValueOnce(false);

    expect(() => updateClientOutputDirectory("/root/dir")).toThrow(
      "Schema file not found: /root/dir/schema.prisma",
    );

    expect(existsSync).toHaveBeenCalledWith("/root/dir/schema.prisma");
  });

  it("should update existing generator block", () => {
    vi.mocked(existsSync).mockReturnValueOnce(true);
    vi.mocked(statSync).mockReturnValueOnce({
      isFile: () => true,
      isDirectory: () => false,
    } as unknown as ReturnType<typeof statSync>);

    const mockSchema = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id Int @id @default(autoincrement())
}
`;

    vi.mocked(readFileSync).mockReturnValueOnce(mockSchema);

    updateClientOutputDirectory("/root/dir");

    expect(existsSync).toHaveBeenCalledWith("/root/dir/schema.prisma");
    expect(readFileSync).toHaveBeenCalledWith(
      "/root/dir/schema.prisma",
      "utf-8",
    );
    expect(writeFileSync).toHaveBeenCalledWith(
      "/root/dir/schema.prisma",
      expect.stringContaining('output   = "./client"'),
      { encoding: "utf-8" },
    );
  });

  it("should append generator block if none exists", () => {
    vi.mocked(existsSync).mockReturnValueOnce(true);
    vi.mocked(statSync).mockReturnValueOnce({
      isFile: () => true,
      isDirectory: () => false,
    } as unknown as ReturnType<typeof statSync>);

    const mockSchema = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id Int @id @default(autoincrement())
}
`;

    vi.mocked(readFileSync).mockReturnValueOnce(mockSchema);

    updateClientOutputDirectory("/root/dir");

    expect(writeFileSync).toHaveBeenCalledWith(
      "/root/dir/schema.prisma",
      expect.stringContaining(
        mockSchema +
          "\n" +
          `generator client {
  provider = "prisma-client-js"
  output   = "./client"
}`,
      ),
      { encoding: "utf-8" },
    );
  });

  it("should use custom schema filename and output directory if provided", () => {
    vi.mocked(existsSync).mockReturnValueOnce(true);
    vi.mocked(statSync).mockReturnValueOnce({
      isFile: () => true,
      isDirectory: () => false,
    } as unknown as ReturnType<typeof statSync>);
    vi.mocked(readFileSync).mockReturnValueOnce("");

    updateClientOutputDirectory("/root/dir", "custom.prisma", "custom-client");

    expect(existsSync).toHaveBeenCalledWith("/root/dir/custom.prisma");
    expect(writeFileSync).toHaveBeenCalledWith(
      "/root/dir/custom.prisma",
      expect.stringContaining("./custom-client"),
      { encoding: "utf-8" },
    );
  });
});

describe("addGitIgnoreFile", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should create a .gitignore file with correct content", () => {
    addGitIgnoreFile("/root/dir");

    const expectedContent = `\
# Ignore the client folder
client
# Ignore the migrations lock file
migrations/migration_lock.toml
`;

    expect(writeFileSync).toHaveBeenCalledWith(
      "/root/dir/.gitignore",
      expectedContent,
      { flag: "wx" },
    );
  });

  it("should use custom client directory name if provided", () => {
    addGitIgnoreFile("/root/dir", "custom-client");

    const expectedContent = `\
# Ignore the client folder
custom-client
# Ignore the migrations lock file
migrations/migration_lock.toml
`;

    expect(writeFileSync).toHaveBeenCalledWith(
      "/root/dir/.gitignore",
      expectedContent,
      { flag: "wx" },
    );
  });

  it("should not overwrite the file if it already exists", () => {
    const err = new Error("File exists") as NodeJS.ErrnoException;
    err.code = "EEXIST";

    vi.mocked(writeFileSync).mockImplementationOnce(() => {
      throw err;
    });

    // Should not throw
    expect(() => addGitIgnoreFile("/root/dir")).not.toThrow();

    expect(writeFileSync).toHaveBeenCalledWith(
      "/root/dir/.gitignore",
      expect.any(String),
      { flag: "wx" },
    );
  });

  it("should propagate other errors", () => {
    const err = new Error("Permission denied") as NodeJS.ErrnoException;
    err.code = "EACCES";

    vi.mocked(writeFileSync).mockImplementationOnce(() => {
      throw err;
    });

    expect(() => addGitIgnoreFile("/root/dir")).toThrow("Permission denied");
  });
});
