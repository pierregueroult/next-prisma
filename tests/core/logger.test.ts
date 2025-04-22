import { describe, it, vi, beforeEach, afterEach, expect } from "vitest";
import { Logger } from "../../src/core/logger";

describe("Logger", () => {
  let mockConsoleLog: ReturnType<typeof vi.spyOn>;
  let logger: Logger;

  beforeEach(() => {
    mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    logger = new Logger("test-context");
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
  });

  it("should log an info message with context and timestamp", () => {
    logger.info("This is an info message");

    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining("ℹ This is an info message"),
    );

    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining("test-context"),
    );
  });

  it("should log a success message with context and timestamp", () => {
    logger.success("Operation successful");

    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining("✓ Operation successful"),
    );

    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining("test-context"),
    );
  });

  it("should log a warn message with context and timestamp", () => {
    logger.warn("This is a warning");

    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining("⚠ This is a warning"),
    );

    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining("test-context"),
    );
  });

  it("should log an error message with context and timestamp", () => {
    logger.error("An error occurred");

    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining("✖ An error occurred"),
    );

    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining("test-context"),
    );
  });

  it("should print additional details in gray if provided", () => {
    logger.info("Info with details", "Detail line 1", "Detail line 2");

    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining("ℹ Info with details"),
    );

    const secondCallArgs = mockConsoleLog.mock.calls[1];

    expect(secondCallArgs).toEqual([
      expect.stringContaining("Detail line 1"),
      expect.stringContaining("Detail line 2"),
    ]);
  });
});
