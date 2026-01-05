import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@simapbe/env/server";

import { PrismaClient } from "../prisma/generated/client";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Re-export enums for use in API routers
export {
  AppStatus,
  AppType,
  AuditStatus,
  DataClass,
  DataRelation,
  InfraType,
  PlanStatus,
  PlatformType,
  RiskLevel,
  ServiceType,
  UserRole,
} from "../prisma/generated/enums";

export default prisma;
