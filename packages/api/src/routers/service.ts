/**
 * Service Router (Domain 5: Arsitektur Layanan)
 * Ref: Source 76, 140 - Service Catalog & Traceability
 *
 * Key features:
 * - Full traceability: Service → Process → App → Data → Infra
 * - Orphan prevention (Service must have parent Process and App)
 * - G2C/G2B/G2G/G2E filtering
 *
 * Access:
 * - SUPER_ADMIN: Full CRUD
 * - OPERATOR: CRUD for own OPD
 * - AUDITOR: Read only
 * - LEADER: Read only
 */

import prisma from "@simapbe/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  adminProcedure,
  operatorProcedure,
  protectedProcedure,
  router,
} from "../index";

// ============================================
// Input Schemas (Matching Prisma Schema)
// ============================================

const serviceTypeEnum = z.enum(["G2C", "G2B", "G2G", "G2E"]);

const createServiceSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(30)
    .regex(/^SVC-[A-Z0-9-]+$/, "Code must follow format: SVC-XXXX"),
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  type: serviceTypeEnum.default("G2C"),
  url: z.string().url().optional(),
  isActive: z.boolean().default(true),
  // Required links for Keterpaduan (Integration)
  probisId: z.cuid({
    message: "Business Process ID is required per SPBE regulation",
  }),
  appId: z.cuid({
    message: "Application ID is required per SPBE regulation",
  }),
});

const updateServiceSchema = z.object({
  id: z.cuid(),
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  type: serviceTypeEnum.optional(),
  url: z.string().url().optional(),
  isActive: z.boolean().optional(),
  probisId: z.cuid().optional(),
  appId: z.cuid().optional(),
});

// ============================================
// Service Router
// ============================================

export const serviceRouter = router({
  /**
   * List services with filtering (Public catalog)
   */
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          type: serviceTypeEnum.optional(),
          isActive: z.boolean().optional(),
          hasApp: z.boolean().optional(),
          hasProbis: z.boolean().optional(),
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const {
        search,
        type,
        isActive,
        hasApp,
        hasProbis,
        limit = 50,
        cursor,
      } = input ?? {};

      const items = await prisma.service.findMany({
        where: {
          ...(search && {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { code: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }),
          ...(type && { type }),
          ...(isActive !== undefined && { isActive }),
          ...(hasApp && { appId: { not: null } }),
          ...(hasApp === false && { appId: null }),
          ...(hasProbis && { probisId: { not: null } }),
          ...(hasProbis === false && { probisId: null }),
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { name: "asc" },
        include: {
          businessProcess: {
            select: { id: true, kodeProbismet: true, name: true, level: true },
          },
          application: {
            select: {
              id: true,
              code: true,
              name: true,
              status: true,
              opd: {
                select: { id: true, code: true, name: true, acronym: true },
              },
            },
          },
        },
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
   * Get single service with full details
   */
  getById: protectedProcedure
    .input(z.object({ id: z.cuid() }))
    .query(async ({ input }) => {
      const service = await prisma.service.findUnique({
        where: { id: input.id },
        include: {
          businessProcess: true,
          application: {
            include: {
              opd: true,
              usedData: {
                include: {
                  data: true,
                },
              },
              infrastructure: {
                include: {
                  infra: true,
                },
              },
            },
          },
        },
      });

      if (!service) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service not found",
        });
      }

      return service;
    }),

  /**
   * Full traceability for a specific service
   * Ref: Source 151 - Peta Rencana Gap Analysis
   *
   * Returns complete dependency graph:
   * Service → Process → App → Data → Infra → Security
   */
  traceability: protectedProcedure
    .input(z.object({ id: z.cuid() }))
    .query(async ({ input }) => {
      const service = await prisma.service.findUnique({
        where: { id: input.id },
        include: {
          businessProcess: {
            include: {
              parent: true,
              children: true,
            },
          },
          application: {
            include: {
              opd: true,
              usedData: {
                include: {
                  data: true,
                },
              },
              infrastructure: {
                include: {
                  infra: true,
                },
              },
              securityAudits: {
                orderBy: { auditDate: "desc" },
                take: 1,
              },
            },
          },
        },
      });

      if (!service) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service not found",
        });
      }

      // Build traceability summary
      const hasProcess = !!service.businessProcess;
      const hasApp = !!service.application;
      const hasData = (service.application?.usedData?.length || 0) > 0;
      const hasInfra = (service.application?.infrastructure?.length || 0) > 0;
      const hasSecurity =
        (service.application?.securityAudits?.length || 0) > 0;

      const completeness = {
        process: hasProcess,
        app: hasApp,
        data: hasData,
        infra: hasInfra,
        security: hasSecurity,
        score:
          [hasProcess, hasApp, hasData, hasInfra, hasSecurity].filter(Boolean)
            .length * 20,
      };

      // Identify gaps for Peta Rencana
      const gaps: string[] = [];
      if (!hasProcess) gaps.push("Missing Business Process link");
      if (!hasApp) gaps.push("Missing Application link");
      if (!hasData) gaps.push("No Data Standards linked to Application");
      if (!hasInfra) gaps.push("No Infrastructure linked to Application");
      if (!hasSecurity) gaps.push("No Security Audit on record");

      return {
        service,
        completeness,
        gaps,
        isFullyIntegrated: completeness.score === 100,
      };
    }),

  /**
   * Create new service
   * Enforces linking to Business Process and Application (Keterpaduan)
   */
  create: operatorProcedure
    .input(createServiceSchema)
    .mutation(async ({ input, ctx }) => {
      // Check code uniqueness
      const existing = await prisma.service.findUnique({
        where: { code: input.code },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Service with code "${input.code}" already exists`,
        });
      }

      // Validate Business Process exists
      const probis = await prisma.businessProcess.findUnique({
        where: { id: input.probisId },
      });

      if (!probis) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Business Process not found. Every service must be linked to a business process.",
        });
      }

      // Validate Application exists and check access
      const app = await prisma.application.findUnique({
        where: { id: input.appId },
      });

      if (!app) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Application not found. Every service must be linked to an application.",
        });
      }

      // Operators can only link to their own OPD's apps
      if (ctx.user.role === "OPERATOR" && app.opdId !== ctx.user.opdId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You can only create services linked to your OPD's applications",
        });
      }

      const service = await prisma.service.create({
        data: input,
        include: {
          businessProcess: true,
          application: {
            include: { opd: true },
          },
        },
      });

      return service;
    }),

  /**
   * Update service
   */
  update: operatorProcedure
    .input(updateServiceSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      const existing = await prisma.service.findUnique({
        where: { id },
        include: { application: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service not found",
        });
      }

      // Operators can only update services linked to their OPD's apps
      if (
        ctx.user.role === "OPERATOR" &&
        existing.application?.opdId !== ctx.user.opdId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You can only update services linked to your OPD's applications",
        });
      }

      // If changing app link, validate new app
      if (data.appId && data.appId !== existing.appId) {
        const newApp = await prisma.application.findUnique({
          where: { id: data.appId },
        });

        if (!newApp) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "New application not found",
          });
        }

        if (ctx.user.role === "OPERATOR" && newApp.opdId !== ctx.user.opdId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Cannot link to application from another OPD",
          });
        }
      }

      // If changing probis link, validate it exists
      if (data.probisId) {
        const probis = await prisma.businessProcess.findUnique({
          where: { id: data.probisId },
        });

        if (!probis) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Business Process not found",
          });
        }
      }

      const service = await prisma.service.update({
        where: { id },
        data,
        include: {
          businessProcess: true,
          application: { include: { opd: true } },
        },
      });

      return service;
    }),

  /**
   * Delete service
   */
  delete: adminProcedure
    .input(z.object({ id: z.cuid() }))
    .mutation(async ({ input }) => {
      const { id } = input;

      const existing = await prisma.service.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service not found",
        });
      }

      await prisma.service.delete({
        where: { id },
      });

      return { success: true, deletedId: id };
    }),

  /**
   * Get orphan services (missing Process or App links)
   * Used for gap analysis in Peta Rencana
   */
  getOrphans: protectedProcedure.query(async () => {
    const orphans = await prisma.service.findMany({
      where: {
        OR: [{ probisId: null }, { appId: null }],
      },
      include: {
        businessProcess: {
          select: { id: true, kodeProbismet: true, name: true },
        },
        application: {
          select: { id: true, code: true, name: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return orphans.map((s) => ({
      ...s,
      missingProcess: !s.probisId,
      missingApp: !s.appId,
    }));
  }),

  /**
   * Get services by type (G2C, G2B, G2G, G2E)
   */
  getByType: protectedProcedure.query(async () => {
    const byType = await prisma.service.groupBy({
      by: ["type"],
      _count: { _all: true },
    });

    return byType.map((t) => ({
      type: t.type,
      count: t._count._all,
    }));
  }),

  /**
   * Get integration status overview
   * Shows how many services are fully integrated vs have gaps
   */
  getIntegrationStatus: protectedProcedure.query(async () => {
    const total = await prisma.service.count();

    const withProcess = await prisma.service.count({
      where: { probisId: { not: null } },
    });

    const withApp = await prisma.service.count({
      where: { appId: { not: null } },
    });

    const fullyLinked = await prisma.service.count({
      where: {
        probisId: { not: null },
        appId: { not: null },
      },
    });

    const orphans = await prisma.service.count({
      where: {
        OR: [{ probisId: null }, { appId: null }],
      },
    });

    return {
      total,
      withProcess,
      withApp,
      fullyLinked,
      orphans,
      integrationRate: total > 0 ? Math.round((fullyLinked / total) * 100) : 0,
    };
  }),

  /**
   * Get statistics
   */
  getStats: protectedProcedure.query(async () => {
    const total = await prisma.service.count();
    const active = await prisma.service.count({ where: { isActive: true } });

    const byType = await prisma.service.groupBy({
      by: ["type"],
      _count: { _all: true },
    });

    return {
      total,
      active,
      inactive: total - active,
      byType: byType.map((t) => ({ type: t.type, count: t._count._all })),
    };
  }),
});
