import prisma, { DataClass, DataRelation } from "@simapbe/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";

// Zod schemas for Data Standard
const dataStandardCreateSchema = z.object({
  dataName: z.string().min(1),
  description: z.string().optional(),
  format: z.string().min(1), // JSON, CSV, XML, etc.
  validityPeriod: z.string().min(1), // Tahunan, Bulanan, etc.
  classification: z.enum(DataClass).default(DataClass.PUBLIC),
  producerOpdId: z.string().optional(),
});

const dataStandardUpdateSchema = dataStandardCreateSchema.partial().extend({
  id: z.string(),
});

const linkDataToAppSchema = z.object({
  appId: z.string(),
  dataId: z.string(),
  relationType: z.enum(DataRelation),
});

export const dataRouter = router({
  // Get all Data Standards
  list: publicProcedure.query(async () => {
    return await prisma.dataStandard.findMany({
      orderBy: { dataName: "asc" },
      include: {
        producerOpd: true,
        _count: {
          select: { applications: true },
        },
      },
    });
  }),

  // Get by ID with full relations
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const data = await prisma.dataStandard.findUnique({
        where: { id: input.id },
        include: {
          producerOpd: true,
          applications: {
            include: {
              application: true,
            },
          },
        },
      });

      if (!data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Data Standard not found",
        });
      }

      return data;
    }),

  // Get by classification (for Satu Data filtering)
  byClassification: publicProcedure
    .input(z.object({ classification: z.enum(DataClass) }))
    .query(async ({ input }) => {
      return await prisma.dataStandard.findMany({
        where: { classification: input.classification },
        include: { producerOpd: true },
      });
    }),

  // Create Data Standard
  create: protectedProcedure
    .input(dataStandardCreateSchema)
    .mutation(async ({ input }) => {
      return await prisma.dataStandard.create({
        data: input,
      });
    }),

  // Update Data Standard
  update: protectedProcedure
    .input(dataStandardUpdateSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await prisma.dataStandard.update({
        where: { id },
        data,
      });
    }),

  // Delete Data Standard
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.dataStandard.delete({
        where: { id: input.id },
      });
    }),

  // Link data to application (Producer/Consumer relationship)
  linkToApp: protectedProcedure
    .input(linkDataToAppSchema)
    .mutation(async ({ input }) => {
      return await prisma.applicationData.create({
        data: input,
      });
    }),

  // Unlink data from application
  unlinkFromApp: protectedProcedure
    .input(z.object({ appId: z.string(), dataId: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.applicationData.delete({
        where: {
          appId_dataId: {
            appId: input.appId,
            dataId: input.dataId,
          },
        },
      });
    }),
});
