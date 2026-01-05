import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@simapbe/env/server";

import { PrismaClient } from "../prisma/generated/client";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

// Enable query logging in development to catch N+1 regressions
const isDev = process.env.NODE_ENV === "development";

const prisma = new PrismaClient({
  adapter,
  log: isDev
    ? [
        { level: "query", emit: "stdout" },
        { level: "warn", emit: "stdout" },
        { level: "error", emit: "stdout" },
      ]
    : [{ level: "error", emit: "stdout" }],
});

export default prisma;

// Re-export Prisma types and enums for use in other packages
export * from "../prisma/generated/enums";
// Re-export types from prismaNamespace that are needed externally
// This is needed for TypeScript project references (composite: true)
export type * from "../prisma/generated/internal/prismaNamespace";
export * from "../prisma/generated/models";
