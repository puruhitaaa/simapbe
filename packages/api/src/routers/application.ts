/**
 * Application Router (Domain 3: Arsitektur Aplikasi)
 * Ref: Perpres 95/2018 - Moratorium Pembangunan Aplikasi
 *
 * Key feature: Moratorium Check (checkDuplication)
 * Before registering a new app, the system checks for:
 * - Existing apps with similar names or functions
 * - Prevents duplicate/overlapping applications
 * - Enforces budget efficiency per regulation
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
// Input Schemas
// ============================================

const appTypeEnum = z.enum(["UMUM", "KHUSUS"]);
const platformEnum = z.enum(["WEB", "MOBILE", "DESKTOP", "API"]);
const statusEnum = z.enum(["PLANNING", "DEVELOPMENT", "ACTIVE", "ARCHIVED"]);

const createAppSchema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(30, "Code must be at most 30 characters")
    .regex(/^APP-[A-Z0-9-]+$/, "Code must follow format: APP-XXXX"),
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  type: appTypeEnum.default("KHUSUS"),
  platform: platformEnum.default("WEB"),
  status: statusEnum.default("PLANNING"),
  programmingLang: z.string().optional(),
  framework: z.string().optional(),
  databaseType: z.string().optional(),
  repositoryUrl: z.string().url().optional(),
  opdId: z.cuid(),
});

const updateAppSchema = z.object({
  id: z.cuid(),
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  type: appTypeEnum.optional(),
  platform: platformEnum.optional(),
  status: statusEnum.optional(),
  programmingLang: z.string().optional(),
  framework: z.string().optional(),
  databaseType: z.string().optional(),
  repositoryUrl: z.string().url().optional(),
});

// ============================================
// Application Router
// ============================================

export const appRouter = router({
  /**
   * List applications with filtering
   */
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          opdId: z.cuid().optional(),
          type: appTypeEnum.optional(),
          status: statusEnum.optional(),
          platform: platformEnum.optional(),
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const {
        search,
        opdId,
        type,
        status,
        platform,
        limit = 50,
        cursor,
      } = input ?? {};

      // Operators can only see their own OPD's apps by default
      let filterOpdId = opdId;
      if (ctx.user.role === "OPERATOR" && !opdId) {
        filterOpdId = ctx.user.opdId || undefined;
      }

      const apps = await prisma.application.findMany({
        where: {
          ...(search && {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { code: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }),
          ...(filterOpdId && { opdId: filterOpdId }),
          ...(type && { type }),
          ...(status && { status }),
          ...(platform && { platform }),
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { name: "asc" },
        include: {
          opd: {
            select: { id: true, code: true, name: true, acronym: true },
          },
          _count: {
            select: {
              usedData: true,
              infrastructure: true,
              services: true,
              securityAudits: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (apps.length > limit) {
        const nextItem = apps.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: apps,
        nextCursor,
      };
    }),

  /**
   * Get single application with full details
   * Includes all relations for traceability
   */
  getById: protectedProcedure
    .input(z.object({ id: z.cuid() }))
    .query(async ({ input }) => {
      const app = await prisma.application.findUnique({
        where: { id: input.id },
        include: {
          opd: true,
          usedData: {
            include: {
              data: {
                select: {
                  id: true,
                  dataCode: true,
                  dataName: true,
                  classification: true,
                },
              },
            },
          },
          infrastructure: {
            include: {
              infra: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  type: true,
                  location: true,
                },
              },
            },
          },
          services: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
            },
          },
          securityAudits: {
            orderBy: { auditDate: "desc" },
            take: 5,
          },
        },
      });

      if (!app) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Application not found",
        });
      }

      return app;
    }),

  /**
   * MORATORIUM CHECK - Critical Feature
   * Ref: Perpres 95/2018 - Moratorium Pembangunan Aplikasi
   *
   * Before registering a new app, check for duplicates:
   * - Name similarity > 70% = potential duplicate
   * - Returns list of similar existing apps
   * - If isDuplicate, the app should use existing UMUM app instead
   */
  checkDuplication: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3),
        description: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { name, description } = input;

      // Search for similar applications using case-insensitive matching
      const searchTerms = name
        .toLowerCase()
        .split(" ")
        .filter((t) => t.length > 2);

      const similarApps = await prisma.application.findMany({
        where: {
          OR: [
            // Direct name contains
            { name: { contains: name, mode: "insensitive" } },
            // Word-by-word matching for keywords
            ...searchTerms.map((term) => ({
              name: { contains: term, mode: "insensitive" as const },
            })),
            // Search in description if provided
            ...(description
              ? [
                  {
                    description: {
                      contains: description,
                      mode: "insensitive" as const,
                    },
                  },
                ]
              : []),
          ],
        },
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          status: true,
          description: true,
          opd: {
            select: { code: true, name: true },
          },
        },
        orderBy: [{ type: "asc" }, { name: "asc" }], // UMUM apps first
      });

      // Calculate similarity scores
      const scoredApps = similarApps.map((app) => {
        const nameLower = app.name.toLowerCase();
        const inputLower = name.toLowerCase();

        // Simple similarity: check word overlap
        const appWords = new Set(nameLower.split(" "));
        const inputWords = new Set(inputLower.split(" "));
        const intersection = new Set(
          [...appWords].filter((w) => inputWords.has(w))
        );
        const union = new Set([...appWords, ...inputWords]);

        const similarity = (intersection.size / union.size) * 100;

        return {
          ...app,
          similarity: Math.round(similarity),
        };
      });

      // Filter and sort by similarity
      const relevantApps = scoredApps
        .filter((app) => app.similarity >= 30)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10);

      // Check if any high-similarity UMUM (general) app exists
      const hasUmumDuplicate = relevantApps.some(
        (app) => app.type === "UMUM" && app.similarity >= 70
      );

      return {
        isDuplicate: hasUmumDuplicate,
        similarApps: relevantApps,
        recommendation: hasUmumDuplicate
          ? "A similar general application (Aplikasi Umum) already exists. Per Perpres 95/2018, consider using the existing application instead of creating a new one."
          : relevantApps.length > 0
            ? "Some similar applications found. Please review before proceeding."
            : "No similar applications found. You may proceed with registration.",
      };
    }),

  /**
   * Register new application
   * Access: SUPER_ADMIN, OPERATOR (own OPD)
   */
  register: operatorProcedure
    .input(createAppSchema)
    .mutation(async ({ input, ctx }) => {
      // Check code uniqueness
      const existing = await prisma.application.findUnique({
        where: { code: input.code },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Application with code "${input.code}" already exists`,
        });
      }

      // Operators can only register for their own OPD
      if (ctx.user.role === "OPERATOR" && input.opdId !== ctx.user.opdId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only register applications for your own OPD",
        });
      }

      // Validate OPD exists
      const opd = await prisma.opd.findUnique({
        where: { id: input.opdId },
      });

      if (!opd) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "OPD not found",
        });
      }

      const app = await prisma.application.create({
        data: {
          ...input,
          developmentStartDate:
            input.status === "DEVELOPMENT" ? new Date() : null,
          productionDate: input.status === "ACTIVE" ? new Date() : null,
        },
        include: {
          opd: true,
        },
      });

      return app;
    }),

  /**
   * Update application
   * Access: SUPER_ADMIN, OPERATOR (own OPD)
   */
  update: operatorProcedure
    .input(updateAppSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      const existing = await prisma.application.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Application not found",
        });
      }

      // Operators can only update their own OPD's apps
      if (ctx.user.role === "OPERATOR" && existing.opdId !== ctx.user.opdId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update applications from your own OPD",
        });
      }

      // Track SDLC transitions
      const updateData: Record<string, unknown> = { ...data };

      if (data.status) {
        if (data.status === "DEVELOPMENT" && existing.status === "PLANNING") {
          updateData.developmentStartDate = new Date();
        }
        if (data.status === "ACTIVE" && existing.status !== "ACTIVE") {
          updateData.productionDate = new Date();
        }
      }

      const app = await prisma.application.update({
        where: { id },
        data: updateData,
        include: {
          opd: true,
        },
      });

      return app;
    }),

  /**
   * Delete application
   * Access: SUPER_ADMIN only
   */
  delete: adminProcedure
    .input(z.object({ id: z.cuid() }))
    .mutation(async ({ input }) => {
      const { id } = input;

      const existing = await prisma.application.findUnique({
        where: { id },
        include: {
          _count: {
            select: { services: true, usedData: true, infrastructure: true },
          },
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Application not found",
        });
      }

      // Check for dependencies
      const totalDeps =
        existing._count.services +
        existing._count.usedData +
        existing._count.infrastructure;

      if (totalDeps > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot delete application with ${totalDeps} related records. Remove all services, data links, and infrastructure first.`,
        });
      }

      await prisma.application.delete({
        where: { id },
      });

      return { success: true, deletedId: id };
    }),

  /**
   * Link application to data standard
   */
  linkData: operatorProcedure
    .input(
      z.object({
        appId: z.cuid(),
        dataId: z.cuid(),
        relationType: z.enum(["PRODUCER", "CONSUMER"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { appId, dataId, relationType } = input;

      // Verify app exists and user has access
      const app = await prisma.application.findUnique({
        where: { id: appId },
      });

      if (!app) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Application not found",
        });
      }

      if (ctx.user.role === "OPERATOR" && app.opdId !== ctx.user.opdId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only modify applications from your own OPD",
        });
      }

      // Verify data exists
      const data = await prisma.dataStandard.findUnique({
        where: { id: dataId },
      });

      if (!data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Data standard not found",
        });
      }

      // Create or update link
      const link = await prisma.applicationData.upsert({
        where: { appId_dataId: { appId, dataId } },
        update: { relationType },
        create: { appId, dataId, relationType },
        include: {
          app: { select: { id: true, name: true, code: true } },
          data: { select: { id: true, dataName: true, dataCode: true } },
        },
      });

      return link;
    }),

  /**
   * Link application to infrastructure
   */
  linkInfrastructure: operatorProcedure
    .input(
      z.object({
        appId: z.cuid(),
        infraId: z.cuid(),
        purpose: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { appId, infraId, purpose } = input;

      // Verify app exists
      const app = await prisma.application.findUnique({
        where: { id: appId },
      });

      if (!app) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Application not found",
        });
      }

      if (ctx.user.role === "OPERATOR" && app.opdId !== ctx.user.opdId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only modify applications from your own OPD",
        });
      }

      // Verify infrastructure exists
      const infra = await prisma.infrastructure.findUnique({
        where: { id: infraId },
      });

      if (!infra) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Infrastructure not found",
        });
      }

      // Create or update link
      const link = await prisma.applicationInfrastructure.upsert({
        where: { appId_infraId: { appId, infraId } },
        update: { purpose },
        create: { appId, infraId, purpose },
        include: {
          app: { select: { id: true, name: true, code: true } },
          infra: { select: { id: true, name: true, code: true, type: true } },
        },
      });

      return link;
    }),

  /**
   * Get application statistics by OPD
   */
  getStats: protectedProcedure.query(async () => {
    const byType = await prisma.application.groupBy({
      by: ["type"],
      _count: { id: true },
    });

    const byStatus = await prisma.application.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const byPlatform = await prisma.application.groupBy({
      by: ["platform"],
      _count: { id: true },
    });

    const total = await prisma.application.count();

    return {
      total,
      byType: byType.map((t) => ({ type: t.type, count: t._count.id })),
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
      byPlatform: byPlatform.map((p) => ({
        platform: p.platform,
        count: p._count.id,
      })),
    };
  }),
});
