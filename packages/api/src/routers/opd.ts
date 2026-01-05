import prisma from "@simapbe/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";

// Zod schemas for OPD
const opdCreateSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  acronym: z.string().optional(),
  address: z.string().optional(),
});

const opdUpdateSchema = opdCreateSchema.partial().extend({
  id: z.string(),
});

export const opdRouter = router({
  // Get all OPDs
  list: publicProcedure.query(async () => {
    return await prisma.opd.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            users: true,
            applications: true,
            infraAssets: true,
          },
        },
      },
    });
  }),

  // Get single OPD by ID
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const opd = await prisma.opd.findUnique({
        where: { id: input.id },
        include: {
          users: true,
          applications: true,
          infraAssets: true,
          dataStandards: true,
          risks: true,
        },
      });

      if (!opd) {
        throw new TRPCError({ code: "NOT_FOUND", message: "OPD not found" });
      }

      return opd;
    }),

  // Create OPD (protected - admin only)
  create: protectedProcedure
    .input(opdCreateSchema)
    .mutation(async ({ input }) => {
      return await prisma.opd.create({
        data: input,
      });
    }),

  // Update OPD
  update: protectedProcedure
    .input(opdUpdateSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await prisma.opd.update({
        where: { id },
        data,
      });
    }),

  // Delete OPD
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.opd.delete({
        where: { id: input.id },
      });
    }),
});
