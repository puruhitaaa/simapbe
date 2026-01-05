import prisma from "@simapbe/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";

// Zod schemas for Business Process
const probisCreateSchema = z.object({
  kodeProbismet: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  level: z.number().min(1).max(3), // 1=Sektor, 2=Urusan, 3=Fungsi
  parentId: z.string().optional(),
});

const probisUpdateSchema = probisCreateSchema.partial().extend({
  id: z.string(),
});

export const probisRouter = router({
  // Get all Business Processes (hierarchical)
  list: publicProcedure.query(async () => {
    return await prisma.businessProcess.findMany({
      orderBy: [{ level: "asc" }, { kodeProbismet: "asc" }],
      include: {
        parent: true,
        _count: {
          select: { services: true, children: true },
        },
      },
    });
  }),

  // Get hierarchy tree (root nodes with nested children)
  tree: publicProcedure.query(async () => {
    return await prisma.businessProcess.findMany({
      where: { parentId: null }, // Root nodes only
      orderBy: { kodeProbismet: "asc" },
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true, // 3 levels deep
              },
            },
          },
        },
      },
    });
  }),

  // Get single by ID
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const probis = await prisma.businessProcess.findUnique({
        where: { id: input.id },
        include: {
          parent: true,
          children: true,
          services: true,
        },
      });

      if (!probis) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Business Process not found",
        });
      }

      return probis;
    }),

  // Create Business Process
  create: protectedProcedure
    .input(probisCreateSchema)
    .mutation(async ({ input }) => {
      // Validate parent exists if provided
      if (input.parentId) {
        const parent = await prisma.businessProcess.findUnique({
          where: { id: input.parentId },
        });
        if (!parent) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Parent not found",
          });
        }
        // Ensure child level is parent level + 1
        if (input.level !== parent.level + 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Child level must be ${parent.level + 1} for this parent`,
          });
        }
      }

      return await prisma.businessProcess.create({
        data: input,
      });
    }),

  // Update Business Process
  update: protectedProcedure
    .input(probisUpdateSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await prisma.businessProcess.update({
        where: { id },
        data,
      });
    }),

  // Delete Business Process
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // Check for linked services
      const count = await prisma.service.count({
        where: { probisId: input.id },
      });

      if (count > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot delete: ${count} service(s) are linked to this Business Process`,
        });
      }

      return await prisma.businessProcess.delete({
        where: { id: input.id },
      });
    }),
});
