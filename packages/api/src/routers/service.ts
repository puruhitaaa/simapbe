import prisma, { ServiceType } from "@simapbe/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";

// Zod schemas for Service
const serviceCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(ServiceType),
  probisId: z.string().optional(),
  appId: z.string().optional(),
});

const serviceUpdateSchema = serviceCreateSchema.partial().extend({
  id: z.string(),
});

export const serviceRouter = router({
  // Get all Services
  list: publicProcedure.query(async () => {
    return await prisma.service.findMany({
      orderBy: { name: "asc" },
      include: {
        businessProcess: true,
        application: { include: { opd: true } },
      },
    });
  }),

  // Get by type (G2C, G2B, G2G, G2E)
  byType: publicProcedure
    .input(z.object({ type: z.enum(ServiceType) }))
    .query(async ({ input }) => {
      return await prisma.service.findMany({
        where: { type: input.type },
        include: {
          businessProcess: true,
          application: true,
        },
      });
    }),

  // Get by ID
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const service = await prisma.service.findUnique({
        where: { id: input.id },
        include: {
          businessProcess: true,
          application: { include: { opd: true } },
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

  // Get orphaned services (no Business Process or no Application)
  orphaned: publicProcedure.query(async () => {
    return await prisma.service.findMany({
      where: {
        OR: [{ probisId: null }, { appId: null }],
      },
      include: {
        businessProcess: true,
        application: true,
      },
    });
  }),

  // Create Service
  create: protectedProcedure
    .input(serviceCreateSchema)
    .mutation(async ({ input }) => {
      return await prisma.service.create({
        data: input,
      });
    }),

  // Update Service
  update: protectedProcedure
    .input(serviceUpdateSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await prisma.service.update({
        where: { id },
        data,
      });
    }),

  // Delete Service
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.service.delete({
        where: { id: input.id },
      });
    }),

  // Link service to Business Process
  linkProbis: protectedProcedure
    .input(z.object({ serviceId: z.string(), probisId: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.service.update({
        where: { id: input.serviceId },
        data: { probisId: input.probisId },
      });
    }),

  // Link service to Application
  linkApp: protectedProcedure
    .input(z.object({ serviceId: z.string(), appId: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.service.update({
        where: { id: input.serviceId },
        data: { appId: input.appId },
      });
    }),
});
