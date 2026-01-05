/**
 * Planning Router (Peta Rencana SPBE)
 * Ref: Source 47, 48, 66, 83 - Peta Rencana SPBE
 *
 * Manages:
 * - 5-year SPBE strategic planning (2025-2029)
 * - Budget alignment with RKA-PD
 * - Gap analysis (As-Is vs To-Be)
 *
 * Access:
 * - SUPER_ADMIN: Full CRUD
 * - OPERATOR: Read only (view roadmap)
 * - LEADER: Read + approve workflow (future)
 */

import prisma from "@simapbe/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../index";

// ============================================
// Input Schemas (Matching Prisma Schema)
// ============================================

const planStatusEnum = z.enum([
  "PLANNED",
  "BUDGETED",
  "ONGOING",
  "COMPLETED",
  "DELAYED",
]);

const domainLayerEnum = z.enum([
  "PROSES_BISNIS",
  "DATA",
  "LAYANAN",
  "APLIKASI",
  "INFRASTRUKTUR",
  "KEAMANAN",
]);

const createPlanSchema = z.object({
  planCode: z
    .string()
    .min(3)
    .regex(/^PLAN-[A-Z0-9-]+$/, "Code must follow format: PLAN-XXXX"),
  year: z.number().min(2020).max(2035),
  quarter: z.number().int().min(1).max(4).optional(),
  initiativeName: z
    .string()
    .min(5, "Initiative name must be at least 5 characters"),
  description: z.string().optional(),
  domain: domainLayerEnum,
  priority: z.number().int().min(1).max(5).default(3),
  budget: z.number().min(0).optional(),
  budgetCode: z.string().optional(),
  fundingSource: z.string().optional(),
  status: planStatusEnum.default("PLANNED"),
  isGap: z.boolean().default(false),
  gapDescription: z.string().optional(),
});

const updatePlanSchema = z.object({
  id: z.cuid(),
  quarter: z.number().int().min(1).max(4).optional(),
  initiativeName: z.string().min(5).optional(),
  description: z.string().optional(),
  domain: domainLayerEnum.optional(),
  priority: z.number().int().min(1).max(5).optional(),
  budget: z.number().min(0).optional(),
  budgetCode: z.string().optional(),
  fundingSource: z.string().optional(),
  status: planStatusEnum.optional(),
  progressPercent: z.number().int().min(0).max(100).optional(),
  isGap: z.boolean().optional(),
  gapDescription: z.string().optional(),
});

// ============================================
// Planning Router
// ============================================

export const planningRouter = router({
  /**
   * List plans with filtering
   */
  list: protectedProcedure
    .input(
      z
        .object({
          year: z.number().optional(),
          domain: domainLayerEnum.optional(),
          status: planStatusEnum.optional(),
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const { year, domain, status, limit = 50, cursor } = input ?? {};

      const items = await prisma.spbePlan.findMany({
        where: {
          ...(year && { year }),
          ...(domain && { domain }),
          ...(status && { status }),
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: [{ year: "asc" }, { priority: "asc" }, { createdAt: "desc" }],
      });

      let nextCursor: string | undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items,
        nextCursor,
      };
    }),

  /**
   * Get plan by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.cuid() }))
    .query(async ({ input }) => {
      const plan = await prisma.spbePlan.findUnique({
        where: { id: input.id },
      });

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan not found",
        });
      }

      return plan;
    }),

  /**
   * Get plan by code
   */
  getByCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const plan = await prisma.spbePlan.findUnique({
        where: { planCode: input.code },
      });

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan not found",
        });
      }

      return plan;
    }),

  /**
   * Create new plan
   */
  create: adminProcedure.input(createPlanSchema).mutation(async ({ input }) => {
    // Check planCode uniqueness
    const existingCode = await prisma.spbePlan.findUnique({
      where: { planCode: input.planCode },
    });

    if (existingCode) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Plan with code "${input.planCode}" already exists`,
      });
    }

    const plan = await prisma.spbePlan.create({
      data: input,
    });

    return plan;
  }),

  /**
   * Update plan
   */
  update: adminProcedure.input(updatePlanSchema).mutation(async ({ input }) => {
    const { id, ...data } = input;

    const existing = await prisma.spbePlan.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Plan not found",
      });
    }

    const plan = await prisma.spbePlan.update({
      where: { id },
      data,
    });

    return plan;
  }),

  /**
   * Delete plan
   */
  delete: adminProcedure
    .input(z.object({ id: z.cuid() }))
    .mutation(async ({ input }) => {
      const existing = await prisma.spbePlan.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan not found",
        });
      }

      await prisma.spbePlan.delete({
        where: { id: input.id },
      });

      return { success: true, deletedId: input.id };
    }),

  /**
   * Update plan status
   */
  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.cuid(),
        status: planStatusEnum,
      })
    )
    .mutation(async ({ input }) => {
      const existing = await prisma.spbePlan.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Plan not found",
        });
      }

      const plan = await prisma.spbePlan.update({
        where: { id: input.id },
        data: { status: input.status },
      });

      return plan;
    }),

  // ============================================
  // ROADMAP & TIMELINE VIEWS
  // ============================================

  /**
   * Get 5-year roadmap data
   * Returns plans grouped by year for Gantt chart display
   */
  getRoadmap: protectedProcedure
    .input(
      z
        .object({
          startYear: z.number().default(2025),
          endYear: z.number().default(2029),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const { startYear = 2025, endYear = 2029 } = input ?? {};

      const plans = await prisma.spbePlan.findMany({
        where: {
          year: {
            gte: startYear,
            lte: endYear,
          },
        },
        orderBy: [{ year: "asc" }, { priority: "asc" }],
      });

      // Group by year
      const grouped: Record<number, typeof plans> = {};
      for (let y = startYear; y <= endYear; y++) {
        grouped[y] = [];
      }

      for (const plan of plans) {
        const yearGroup = grouped[plan.year];
        if (yearGroup) {
          yearGroup.push(plan);
        }
      }

      return {
        years: Object.keys(grouped).map(Number),
        byYear: grouped,
        total: plans.length,
      };
    }),

  /**
   * Get plans by domain for architecture alignment
   */
  getByDomain: protectedProcedure.query(async () => {
    const plans = await prisma.spbePlan.findMany({
      orderBy: { priority: "asc" },
    });

    const domains = [
      "PROSES_BISNIS",
      "DATA",
      "LAYANAN",
      "APLIKASI",
      "INFRASTRUKTUR",
      "KEAMANAN",
    ] as const;

    const grouped: Record<string, typeof plans> = {};
    for (const domain of domains) {
      grouped[domain] = plans.filter((p) => p.domain === domain);
    }

    return {
      domains: domains.map((d) => ({
        domain: d,
        count: grouped[d]?.length ?? 0,
        plans: grouped[d] ?? [],
      })),
      total: plans.length,
    };
  }),

  // ============================================
  // BUDGET ANALYSIS
  // ============================================

  /**
   * Get budget summary per year
   */
  getBudgetSummary: protectedProcedure
    .input(z.object({ year: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const where = input?.year ? { year: input.year } : {};

      const plans = await prisma.spbePlan.findMany({
        where,
        select: {
          id: true,
          year: true,
          domain: true,
          budget: true,
          status: true,
        },
      });

      // Calculate totals
      const totalBudget = plans.reduce(
        (sum, p) => sum + (p.budget?.toNumber() ?? 0),
        0
      );

      // Group by year
      const byYear: Record<number, { budget: number; count: number }> = {};
      for (const plan of plans) {
        if (!byYear[plan.year]) {
          byYear[plan.year] = { budget: 0, count: 0 };
        }
        const yearGroup = byYear[plan.year];
        if (yearGroup) {
          yearGroup.budget += plan.budget?.toNumber() ?? 0;
          yearGroup.count++;
        }
      }

      // Group by domain
      const byDomain: Record<string, { budget: number; count: number }> = {};
      for (const plan of plans) {
        if (!byDomain[plan.domain]) {
          byDomain[plan.domain] = { budget: 0, count: 0 };
        }
        const domainGroup = byDomain[plan.domain];
        if (domainGroup) {
          domainGroup.budget += plan.budget?.toNumber() ?? 0;
          domainGroup.count++;
        }
      }

      return {
        totalBudget,
        byYear: Object.entries(byYear).map(([year, data]) => ({
          year: Number.parseInt(year),
          ...data,
        })),
        byDomain: Object.entries(byDomain).map(([domain, data]) => ({
          domain,
          ...data,
        })),
      };
    }),

  // ============================================
  // GAP ANALYSIS
  // Ref: Source 47 - As-Is vs To-Be Architecture
  // ============================================

  /**
   * Get gap analysis data
   * Analyzes current state vs planned state
   */
  getGapAnalysis: protectedProcedure.query(async () => {
    // Get current counts by entity
    const [appCount, infraCount, serviceCount, probisCount, dataCount] =
      await Promise.all([
        prisma.application.count({ where: { status: "ACTIVE" } }),
        prisma.infrastructure.count({ where: { isActive: true } }),
        prisma.service.count({ where: { isActive: true } }),
        prisma.businessProcess.count(),
        prisma.dataStandard.count({ where: { isValidated: true } }),
      ]);

    // Get planned additions by domain
    const plannedItems = await prisma.spbePlan.findMany({
      where: {
        status: { in: ["PLANNED", "BUDGETED", "ONGOING"] },
      },
      select: {
        domain: true,
      },
    });

    const plannedByDomain: Record<string, number> = {
      PROSES_BISNIS: 0,
      DATA: 0,
      LAYANAN: 0,
      APLIKASI: 0,
      INFRASTRUKTUR: 0,
      KEAMANAN: 0,
    };

    for (const plan of plannedItems) {
      const currentCount = plannedByDomain[plan.domain];
      if (currentCount !== undefined) {
        plannedByDomain[plan.domain] = currentCount + 1;
      }
    }

    // Identify gaps
    // An app without a linked service is a gap
    const appsWithoutService = await prisma.application.count({
      where: {
        status: "ACTIVE",
        services: { none: {} },
      },
    });

    // Services without linked business process
    const servicesWithoutProbis = await prisma.service.count({
      where: {
        isActive: true,
        probisId: null,
      },
    });

    // Apps without security audit in last year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const appsWithRecentAudit = await prisma.application.count({
      where: {
        status: "ACTIVE",
        securityAudits: {
          some: {
            auditDate: { gte: oneYearAgo },
          },
        },
      },
    });

    return {
      currentState: {
        applications: appCount,
        infrastructure: infraCount,
        services: serviceCount,
        businessProcesses: probisCount,
        dataStandards: dataCount,
      },
      planned: plannedByDomain,
      gaps: {
        appsWithoutService,
        servicesWithoutProbis,
        appsWithoutRecentAudit: appCount - appsWithRecentAudit,
      },
      recommendations: [
        ...(appsWithoutService > 0
          ? [`${appsWithoutService} applications need to be linked to services`]
          : []),
        ...(servicesWithoutProbis > 0
          ? [`${servicesWithoutProbis} services need linked business processes`]
          : []),
        ...(appCount - appsWithRecentAudit > 0
          ? [
              `${appCount - appsWithRecentAudit} applications need security audits`,
            ]
          : []),
      ],
    };
  }),

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Get planning statistics
   */
  getStats: protectedProcedure.query(async () => {
    const [total, planned, budgeted, ongoing, completed, delayed] =
      await Promise.all([
        prisma.spbePlan.count(),
        prisma.spbePlan.count({ where: { status: "PLANNED" } }),
        prisma.spbePlan.count({ where: { status: "BUDGETED" } }),
        prisma.spbePlan.count({ where: { status: "ONGOING" } }),
        prisma.spbePlan.count({ where: { status: "COMPLETED" } }),
        prisma.spbePlan.count({ where: { status: "DELAYED" } }),
      ]);

    // Get budget totals
    const budgetAgg = await prisma.spbePlan.aggregate({
      _sum: {
        budget: true,
      },
    });

    // Current year stats
    const currentYear = new Date().getFullYear();
    const currentYearStats = await prisma.spbePlan.aggregate({
      where: { year: currentYear },
      _count: { _all: true },
      _sum: { budget: true },
    });

    return {
      byStatus: {
        total,
        planned,
        budgeted,
        ongoing,
        completed,
        delayed,
      },
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      totalBudget: budgetAgg._sum?.budget?.toNumber() ?? 0,
      currentYear: {
        year: currentYear,
        count: currentYearStats._count?._all ?? 0,
        budget: currentYearStats._sum?.budget?.toNumber() ?? 0,
      },
    };
  }),
});
