import { generateTempDirPath, getStarterFixturePath } from "./utils/filesystem";
import { executeCommand, runCommandInBackground } from "./utils/execute";
import { waitFor } from "./utils/wait-for";
import { fetchPage, isResponding } from "./utils/fetch";

import type { ChildProcess } from "node:child_process";
import { mkdir, rm, cp } from "node:fs/promises";
import { join } from "node:path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("Next.js Plugin E2E", () => {
  let tempDir: string;
  let nextProcess: ChildProcess | null = null;

  beforeEach(async () => {
    tempDir = generateTempDirPath();
    await mkdir(tempDir, { recursive: true });
    await cp(getStarterFixturePath(), tempDir, {
      recursive: true,
      force: true,
      filter: (src: string) => {
        return !src.includes("node_modules");
      },
    });
    await executeCommand("pnpm", ["install"], {
      cwd: tempDir,
      stdio: "inherit",
    });
  }, 120_000);

  afterEach(async () => {
    if (nextProcess && nextProcess.pid) {
      try {
        process.kill(-nextProcess.pid, "SIGKILL");
      } catch {
        // Ignore error
      }
    }

    await rm(join(tempDir, ".next"), {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 200,
    });
    await rm(tempDir, { recursive: true, force: true });
  }, 120_000);

  it("should be able to start development server", async () => {
    nextProcess = runCommandInBackground(
      "pnpm",
      ["run", "dev", "--port", "3002"],
      {
        cwd: tempDir,
        stdio: "inherit",
      },
    );

    await waitFor("localhost", "3002", 60000);
    const response = await fetchPage("http://localhost:3002");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/html/);
  }, 120_000);

  it("should be able to start development server with --turbo", async () => {
    nextProcess = runCommandInBackground(
      "pnpm",
      ["run", "dev", "--turbo", "--port", "3002"],
      {
        cwd: tempDir,
        stdio: "inherit",
      },
    );

    await waitFor("localhost", "3002", 60000);
    const response = await fetchPage("http://localhost:3002");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/html/);
  }, 120_000);

  it("should be able to start production server", async () => {
    await executeCommand("pnpm", ["run", "build"], {
      cwd: tempDir,
      stdio: "inherit",
    });

    nextProcess = runCommandInBackground(
      "pnpm",
      ["run", "start", "--port", "3002"],
      {
        cwd: tempDir,
        stdio: "inherit",
      },
    );

    await waitFor("localhost", "3002", 60000);

    const response = await fetchPage("http://localhost:3002");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/html/);
  }, 120_000);

  describe("🧱 Production ready (next build)", () => {
    beforeEach(async () => {
      await executeCommand("pnpm", ["run", "build"], {
        cwd: tempDir,
        stdio: "inherit",
      });

      nextProcess = runCommandInBackground(
        "pnpm",
        ["run", "start", "--port", "3002"],
        {
          cwd: tempDir,
          stdio: "inherit",
        },
      );
    }, 120_000);

    it("should display the default page", async () => {
      const response = await fetchPage("http://localhost:3002");
      const text = await response.text();
      expect(response.status).toBe(200);
      expect(text).toContain(
        "Get started by editing <code>src/app/page.tsx</code>.",
      );
    }, 120_000);

    it("should not start the prisma studio", async () => {
      expect(await isResponding(5555)).toBe(false);
    }, 120_000);
  });

  describe("🧪 Development ready (next dev)", () => {
    beforeEach(async () => {
      nextProcess = runCommandInBackground(
        "pnpm",
        ["run", "dev", "--port", "3002"],
        {
          cwd: tempDir,
          stdio: "inherit",
        },
      );

      await waitFor("localhost", "3002", 60000);
    }, 120_000);

    it("should display the default page", async () => {
      const response = await fetchPage("http://localhost:3002");
      const text = await response.text();
      expect(response.status).toBe(200);
      expect(text).toContain(
        "Get started by editing <code>src/app/page.tsx</code>.",
      );
    }, 120_000);

    it("should start the prisma studio", async () => {
      expect(await isResponding(5555)).toBe(true);
    }, 120_000);
  });

  describe("🚀 Turbopack Development (next dev --turbo)", () => {
    beforeEach(async () => {
      nextProcess = runCommandInBackground(
        "pnpm",
        ["run", "dev", "--turbo", "--port", "3002"],
        {
          cwd: tempDir,
          stdio: "inherit",
        },
      );

      await waitFor("localhost", "3002", 60000);
    }, 120_000);

    it("should display the default page with Turbopack", async () => {
      const response = await fetchPage("http://localhost:3002");
      const text = await response.text();
      expect(response.status).toBe(200);
      expect(text).toContain(
        "Get started by editing <code>src/app/page.tsx</code>.",
      );
    }, 120_000);

    it("should start the prisma studio with Turbopack", async () => {
      expect(await isResponding(5555)).toBe(true);
    }, 120_000);
  });
});
