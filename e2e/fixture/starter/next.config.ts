import type { NextConfig } from "next";
import { withNextPrisma } from "@pglabs/next-prisma";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextPrisma(nextConfig, {
  runMigration: true,
  startStudio: true,
});
