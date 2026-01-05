import prisma, { InfraType } from "@simapbe/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";

// Zod schemas for Infrastructure
const infraCreateSchema = z.object({
  name: z.string().min(1),
  type: z.enum(InfraType),
  location: z.string().optional(), // PDN, Local Server Room
  opdId: z.string(),
  vcpu: z.number().int().positive().optional(),
  ramGb: z.number().int().positive().optional(),
  storageGb: z.number().int().positive().optional(),
});

const infraUpdateSchema = infraCreateSchema.partial().extend({
  id: z.string(),
});

export const infraRouter = router({
  // Get all Infrastructure
  list: publicProcedure.query(async () => {
    return await prisma.infrastructure.findMany({
      orderBy: { name: "asc" },
      include: {
        opd: true,
        _count: { select: { applications: true } },
      },
    });
  }),

  // Get by OPD
  byOpd: publicProcedure
    .input(z.object({ opdId: z.string() }))
    .query(async ({ input }) => {
      return await prisma.infrastructure.findMany({
        where: { opdId: input.opdId },
        include: { applications: true },
      });
    }),

  // Get by ID
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const infra = await prisma.infrastructure.findUnique({
        where: { id: input.id },
        include: {
          opd: true,
          applications: true,
        },
      });

      if (!infra) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Infrastructure not found",
        });
      }

      return infra;
    }),

  // PDN vs Local split summary (for planning)
  locationSummary: publicProcedure.query(async () => {
    const all = await prisma.infrastructure.findMany({
      select: { location: true, vcpu: true, ramGb: true, storageGb: true },
    });

    const pdn = all.filter((i) => i.location?.toLowerCase().includes("pdn"));
    const local = all.filter((i) => !i.location?.toLowerCase().includes("pdn"));

    const sumMetrics = (items: typeof all) => ({
      count: items.length,
      totalVcpu: items.reduce((sum, i) => sum + (i.vcpu || 0), 0),
      totalRamGb: items.reduce((sum, i) => sum + (i.ramGb || 0), 0),
      totalStorageGb: items.reduce((sum, i) => sum + (i.storageGb || 0), 0),
    });

    return {
      pdn: sumMetrics(pdn),
      local: sumMetrics(local),
    };
  }),

  // Create Infrastructure
  create: protectedProcedure
    .input(infraCreateSchema)
    .mutation(async ({ input }) => {
      return await prisma.infrastructure.create({
        data: input,
      });
    }),

  // Update Infrastructure
  update: protectedProcedure
    .input(infraUpdateSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await prisma.infrastructure.update({
        where: { id },
        data,
      });
    }),

  // Delete Infrastructure
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.infrastructure.delete({
        where: { id: input.id },
      });
    }),

  // Link app to infrastructure
  linkApp: protectedProcedure
    .input(z.object({ infraId: z.string(), appId: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.infrastructure.update({
        where: { id: input.infraId },
        data: {
          applications: { connect: { id: input.appId } },
        },
      });
    }),
});
