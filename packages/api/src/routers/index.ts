/**
 * SIMAPBE API Router
 * Ref: Perpres 132/2022 - 6 Domain Arsitektur SPBE
 *
 * Router structure follows the SPBE architecture domains:
 * - opd: Organization management (tenancy)
 * - probis: Domain 1 - Business Process
 * - data: Domain 2 - Data Architecture
 * - app: Domain 3 - Application (Moratorium Check)
 * - infra: Domain 4 - Infrastructure (PDN Migration)
 * - service: Domain 5 - Service (Traceability)
 * - security: Domain 6 - Security (Risk + Audit)
 * - planning: Peta Rencana (Gap Analysis)
 */

import { protectedProcedure, publicProcedure, router } from "../index";
import { appRouter as applicationRouter } from "./application";
import { dataRouter } from "./data";
import { infraRouter } from "./infrastructure";
import { opdRouter } from "./opd";
import { planningRouter } from "./planning";
import { probisRouter } from "./probis";
import { securityRouter } from "./security";
import { serviceRouter } from "./service";
import { userRouter } from "./user";

export const appRouter = router({
  // Health check
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),

  // Session/user info
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.user,
    };
  }),

  // Organization management (tenancy)
  opd: opdRouter,

  // Domain 1: Business Process (Proses Bisnis)
  probis: probisRouter,

  // Domain 2: Data Architecture (Satu Data)
  data: dataRouter,

  // Domain 3: Application (Moratorium Check)
  app: applicationRouter,

  // Domain 4: Infrastructure (PDN/Local)
  infra: infraRouter,

  // Domain 5: Service (Full Traceability)
  service: serviceRouter,

  // Domain 6: Security (Risk + Audit)
  security: securityRouter,

  // Planning Module (Peta Rencana + Gap Analysis)
  planning: planningRouter,

  // User Management (RBAC)
  user: userRouter,
});

export type AppRouter = typeof appRouter;
