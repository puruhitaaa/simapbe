import prisma, { AppStatus, AppType, PlatformType } from "@simapbe/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";

// Zod schemas for Application
const appCreateSchema = z.object({
  name: z.string().min(1),
  opdId: z.string(),
  type: z.enum(AppType).default(AppType.KHUSUS),
  platform: z.enum(PlatformType),
  status: z.enum(AppStatus).default(AppStatus.ACTIVE),
  programmingLang: z.string().optional(),
  databaseType: z.string().optional(),
  repositoryUrl: z.url().optional(),
});

const appUpdateSchema = appCreateSchema.partial().extend({
  id: z.string(),
});

export const appRouter = router({
  // Get all Applications
  list: publicProcedure.query(async () => {
    return await prisma.application.findMany({
      orderBy: { name: "asc" },
      include: {
        opd: true,
        _count: {
          select: { services: true, usedData: true, securityAudits: true },
        },
      },
    });
  }),

  // Get by OPD
  byOpd: publicProcedure
    .input(z.object({ opdId: z.string() }))
    .query(async ({ input }) => {
      return await prisma.application.findMany({
        where: { opdId: input.opdId },
        include: { opd: true },
      });
    }),

  // Get by ID with full relations
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const app = await prisma.application.findUnique({
        where: { id: input.id },
        include: {
          opd: true,
          services: true,
          usedData: {
            include: { dataStandard: true },
          },
          infrastructure: true,
          securityAudits: { orderBy: { auditDate: "desc" }, take: 5 },
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

  // Moratorium Check - check for duplicate applications
  checkDuplication: protectedProcedure
    .input(
      z.object({ name: z.string(), functionDescription: z.string().optional() })
    )
    .query(async ({ input }) => {
      // Simple name similarity check using ILIKE
      const similar = await prisma.application.findMany({
        where: {
          OR: [
            { name: { contains: input.name, mode: "insensitive" } },
            {
              name: {
                startsWith: input.name.substring(0, 5),
                mode: "insensitive",
              },
            },
          ],
          type: AppType.UMUM, // Check against general apps only
        },
        include: { opd: true },
        take: 5,
      });

      return {
        hasDuplicates: similar.length > 0,
        similarApps: similar,
        canProceed: similar.length === 0,
      };
    }),

  // Create Application
  create: protectedProcedure
    .input(appCreateSchema)
    .mutation(async ({ input }) => {
      return await prisma.application.create({
        data: input,
      });
    }),

  // Update Application
  update: protectedProcedure
    .input(appUpdateSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await prisma.application.update({
        where: { id },
        data,
      });
    }),

  // Delete Application
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // Check for linked services
      const serviceCount = await prisma.service.count({
        where: { appId: input.id },
      });

      if (serviceCount > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot delete: ${serviceCount} service(s) depend on this application`,
        });
      }

      return await prisma.application.delete({
        where: { id: input.id },
      });
    }),
});
