import { get } from "node:http";

export async function fetchPage(
  url: string,
  retry: number = 3,
): Promise<Response> {
  let attempts = 0;
  let lastError: Error | null = null;

  while (attempts < retry) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      return response;
    } catch (error) {
      attempts++;
      lastError = error as Error;
      console.warn(`Attempt ${attempts} failed: ${error.message}`);

      if (attempts >= retry) {
        throw lastError;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error("All retries failed.");
}

export function isResponding(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = get({ hostname: "localhost", port, timeout: 1000 }, () => {
      req.destroy();
      resolve(true);
    });

    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}
