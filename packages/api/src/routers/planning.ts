import prisma, { PlanStatus } from "@simapbe/db";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";

// Zod schemas for Planning
const planCreateSchema = z.object({
  year: z.number().int().min(2024).max(2035),
  initiativeName: z.string().min(1),
  domain: z.string().min(1), // Layanan, Aplikasi, Data, Infrastruktur, Keamanan
  description: z.string().optional(),
  budget: z.number().positive().optional(),
  status: z.enum(PlanStatus).default(PlanStatus.PLANNED),
});

const planUpdateSchema = planCreateSchema.partial().extend({
  id: z.string(),
});

export const planningRouter = router({
  // Get all SPBE Plans
  list: publicProcedure.query(async () => {
    return await prisma.spbePlan.findMany({
      orderBy: [{ year: "asc" }, { domain: "asc" }],
    });
  }),

  // Get plans by year
  byYear: publicProcedure
    .input(z.object({ year: z.number() }))
    .query(async ({ input }) => {
      return await prisma.spbePlan.findMany({
        where: { year: input.year },
        orderBy: { domain: "asc" },
      });
    }),

  // Get plans by status
  byStatus: publicProcedure
    .input(z.object({ status: z.enum(PlanStatus) }))
    .query(async ({ input }) => {
      return await prisma.spbePlan.findMany({
        where: { status: input.status },
        orderBy: [{ year: "asc" }, { domain: "asc" }],
      });
    }),

  // Get roadmap summary (for Gantt chart)
  roadmapSummary: publicProcedure.query(async () => {
    const plans = await prisma.spbePlan.findMany({
      orderBy: [{ year: "asc" }, { domain: "asc" }],
    });

    // Group by year
    const byYear = plans.reduce(
      (acc, plan) => {
        const year = plan.year.toString();
        if (!acc[year]) {
          acc[year] = { year: plan.year, plans: [], totalBudget: 0 };
        }
        acc[year].plans.push(plan);
        acc[year].totalBudget += Number(plan.budget) || 0;
        return acc;
      },
      {} as Record<
        string,
        { year: number; plans: typeof plans; totalBudget: number }
      >
    );

    return Object.values(byYear);
  }),

  // Gap Analysis - find services without apps
  gapAnalysis: publicProcedure.query(async () => {
    const orphanedServices = await prisma.service.findMany({
      where: { OR: [{ appId: null }, { probisId: null }] },
      include: { businessProcess: true, application: true },
    });

    const appsWithoutData = await prisma.application.findMany({
      where: { usedData: { none: {} } },
      include: { opd: true },
    });

    const unauditedApps = await prisma.application.findMany({
      where: { securityAudits: { none: {} } },
      include: { opd: true },
    });

    return {
      orphanedServices,
      appsWithoutData,
      unauditedApps,
      summary: {
        orphanedServicesCount: orphanedServices.length,
        appsWithoutDataCount: appsWithoutData.length,
        unauditedAppsCount: unauditedApps.length,
      },
    };
  }),

  // Create plan
  create: protectedProcedure
    .input(planCreateSchema)
    .mutation(async ({ input }) => {
      return await prisma.spbePlan.create({
        data: {
          ...input,
          budget: input.budget ? input.budget : null,
        },
      });
    }),

  // Update plan
  update: protectedProcedure
    .input(planUpdateSchema)
    .mutation(async ({ input }) => {
      const { id, budget, ...rest } = input;
      return await prisma.spbePlan.update({
        where: { id },
        data: {
          ...rest,
          budget: budget !== undefined ? budget : undefined,
        },
      });
    }),

  // Delete plan
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.spbePlan.delete({
        where: { id: input.id },
      });
    }),

  // ===== AUDIT LOGS =====

  // Get audit logs
  auditLogs: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().int().positive().default(50),
          entity: z.string().optional(),
          userId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return await prisma.auditLog.findMany({
        where: {
          entity: input?.entity,
          userId: input?.userId,
        },
        orderBy: { timestamp: "desc" },
        take: input?.limit || 50,
        include: { user: { select: { name: true, email: true } } },
      });
    }),
});
