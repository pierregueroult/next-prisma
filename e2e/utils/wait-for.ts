import { request } from "node:http";

export function waitFor(url: string, port: string, timeout: number = 10000) {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const options = {
        hostname: url,
        port: port,
        path: "/",
        method: "GET",
      };

      const req = request(options, (res) => {
        if (res.statusCode === 200) resolve("ok");
        else retry();
      });
      req.on("error", retry);
      req.end();
    };

    const retry = () => {
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for ${url}:${port}`));
      } else {
        setTimeout(check, 500);
      }
    };

    check();
  });
}
