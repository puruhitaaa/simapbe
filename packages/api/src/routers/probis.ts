/**
 * Business Process Router (Domain 1: Proses Bisnis)
 * Ref: Perpres 132/2022 - Arsitektur Proses Bisnis
 *
 * Manages the Probismet (Proses Bisnis Pemerintah) hierarchy:
 * Level 1: Sektor Pemerintahan (e.g., RAB, RKR, RPE)
 * Level 2: Urusan Pemerintahan (e.g., RAB.01, RAB.02)
 * Level 3: Fungsi (e.g., RAB.01.01)
 * Level 4: Sub-Fungsi (optional)
 *
 * Access:
 * - SUPER_ADMIN: Full CRUD
 * - OPERATOR: Read only
 * - AUDITOR: Read only
 * - LEADER: Read only
 */

import prisma from "@simapbe/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../index";

// ============================================
// Input Schemas
// ============================================

const createProbisSchema = z.object({
  kodeProbismet: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(20, "Code must be at most 20 characters")
    .regex(
      /^[A-Z]{2,3}(\.\d{2})*$/,
      "Code must follow format: RAB, RAB.01, RAB.01.01"
    ),
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  level: z.number().min(1).max(4),
  parentId: z.string().cuid().optional(),
});

const updateProbisSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(3).optional(),
  description: z.string().optional(),
});

// ============================================
// Business Process Router
// ============================================

export const probisRouter = router({
  /**
   * Get full hierarchy tree
   * Returns all processes organized by parent-child relationships
   * Uses single query with includes to avoid N+1
   */
  getHierarchy: protectedProcedure.query(async () => {
    // Fetch all root-level processes (Level 1) with nested children
    const hierarchy = await prisma.businessProcess.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true, // Level 4 (Sub-Fungsi)
              },
            },
          },
        },
        _count: {
          select: { services: true },
        },
      },
      orderBy: { kodeProbismet: "asc" },
    });

    return hierarchy;
  }),

  /**
   * List processes with optional filtering
   */
  list: protectedProcedure
    .input(
      z
        .object({
          level: z.number().min(1).max(4).optional(),
          parentId: z.string().cuid().optional(),
          search: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const { level, parentId, search, limit = 50, cursor } = input ?? {};

      const processes = await prisma.businessProcess.findMany({
        where: {
          ...(level !== undefined && { level }),
          ...(parentId !== undefined && { parentId }),
          ...(search && {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { kodeProbismet: { contains: search, mode: "insensitive" } },
            ],
          }),
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { kodeProbismet: "asc" },
        include: {
          parent: {
            select: { id: true, kodeProbismet: true, name: true },
          },
          _count: {
            select: { children: true, services: true },
          },
        },
      });

      let nextCursor: string | undefined;
      if (processes.length > limit) {
        const nextItem = processes.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: processes,
        nextCursor,
      };
    }),

  /**
   * Get single process by ID with full details
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input }) => {
      const process = await prisma.businessProcess.findUnique({
        where: { id: input.id },
        include: {
          parent: true,
          children: {
            orderBy: { kodeProbismet: "asc" },
          },
          services: {
            include: {
              application: {
                select: { id: true, name: true, code: true },
              },
            },
          },
        },
      });

      if (!process) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Business process not found",
        });
      }

      return process;
    }),

  /**
   * Get process by Probismet code
   */
  getByCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const process = await prisma.businessProcess.findUnique({
        where: { kodeProbismet: input.code },
        include: {
          parent: true,
          children: true,
          _count: { select: { services: true } },
        },
      });

      if (!process) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Business process not found",
        });
      }

      return process;
    }),

  /**
   * Create new business process
   * Access: SUPER_ADMIN only
   */
  create: adminProcedure
    .input(createProbisSchema)
    .mutation(async ({ input }) => {
      // Check for existing code
      const existing = await prisma.businessProcess.findUnique({
        where: { kodeProbismet: input.kodeProbismet },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Process with code "${input.kodeProbismet}" already exists`,
        });
      }

      // Validate parent exists if provided
      if (input.parentId) {
        const parent = await prisma.businessProcess.findUnique({
          where: { id: input.parentId },
        });

        if (!parent) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Parent process not found",
          });
        }

        // Validate level consistency (child should be parent level + 1)
        if (input.level !== parent.level + 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Child level must be ${parent.level + 1} (parent is level ${parent.level})`,
          });
        }
      } else if (input.level !== 1) {
        // Root level must be 1
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Root-level processes must have level 1",
        });
      }

      const process = await prisma.businessProcess.create({
        data: input,
        include: {
          parent: true,
        },
      });

      return process;
    }),

  /**
   * Update existing process
   * Access: SUPER_ADMIN only
   * Note: Cannot change code or level (creates new hierarchy issues)
   */
  update: adminProcedure
    .input(updateProbisSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      const existing = await prisma.businessProcess.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Business process not found",
        });
      }

      const process = await prisma.businessProcess.update({
        where: { id },
        data,
      });

      return process;
    }),

  /**
   * Delete process
   * Access: SUPER_ADMIN only
   * Note: Cannot delete if has children or linked services
   */
  delete: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input }) => {
      const { id } = input;

      const process = await prisma.businessProcess.findUnique({
        where: { id },
        include: {
          _count: {
            select: { children: true, services: true },
          },
        },
      });

      if (!process) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Business process not found",
        });
      }

      if (process._count.children > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot delete process with ${process._count.children} child processes`,
        });
      }

      if (process._count.services > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot delete process linked to ${process._count.services} services`,
        });
      }

      await prisma.businessProcess.delete({
        where: { id },
      });

      return { success: true, deletedId: id };
    }),

  /**
   * Link a service to this business process
   * Access: SUPER_ADMIN only
   */
  linkService: adminProcedure
    .input(
      z.object({
        processId: z.string().cuid(),
        serviceId: z.string().cuid(),
      })
    )
    .mutation(async ({ input }) => {
      const { processId, serviceId } = input;

      // Verify both exist
      const [process, service] = await Promise.all([
        prisma.businessProcess.findUnique({ where: { id: processId } }),
        prisma.service.findUnique({ where: { id: serviceId } }),
      ]);

      if (!process) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Business process not found",
        });
      }

      if (!service) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service not found",
        });
      }

      // Update service to link to process
      const updatedService = await prisma.service.update({
        where: { id: serviceId },
        data: { probisId: processId },
        include: {
          businessProcess: true,
          application: true,
        },
      });

      return updatedService;
    }),

  /**
   * Get processes without linked services (orphans)
   * Used for gap analysis
   */
  getOrphans: protectedProcedure.query(async () => {
    // Only level 3+ should have services
    const orphans = await prisma.businessProcess.findMany({
      where: {
        level: { gte: 3 },
        services: { none: {} },
      },
      orderBy: { kodeProbismet: "asc" },
    });

    return orphans;
  }),
});
