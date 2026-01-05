import { protectedProcedure, publicProcedure, router } from "../index";
import { appRouter as applicationRouter } from "./app";
import { dataRouter } from "./data";
import { infraRouter } from "./infra";
import { opdRouter } from "./opd";
import { planningRouter } from "./planning";
import { probisRouter } from "./probis";
import { securityRouter } from "./security";
import { serviceRouter } from "./service";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),

  // Domain Routers (6 SPBE Domains)
  opd: opdRouter, // Organization
  probis: probisRouter, // Domain 1: Business Process
  data: dataRouter, // Domain 2: Data Standards
  app: applicationRouter, // Domain 3: Applications
  infra: infraRouter, // Domain 4: Infrastructure
  service: serviceRouter, // Domain 5: Services
  security: securityRouter, // Domain 6: Security & Risk

  // Planning Module
  planning: planningRouter,
});

export type AppRouter = typeof appRouter;
