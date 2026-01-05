/**
 * OPD Router - Organisasi Perangkat Daerah Management
 * Ref: Perpres 132/2022 - Multi-tenancy for SPBE
 *
 * Manages OPD (government agency) entities which serve as
 * the primary tenant for all domain data.
 *
 * Access:
 * - SUPER_ADMIN: Full CRUD
 * - OPERATOR: Read own OPD only
 * - AUDITOR: Read all OPDs
 * - LEADER: Read all OPDs
 */

import prisma from "@simapbe/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../index";

// ============================================
// Input Schemas (Zod Validation)
// ============================================

const createOpdSchema = z.object({
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(20, "Code must be at most 20 characters")
    .regex(
      /^[A-Z0-9_]+$/,
      "Code must be uppercase alphanumeric with underscores"
    ),
  name: z.string().min(3, "Name must be at least 3 characters"),
  acronym: z.string().max(20).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
});

const updateOpdSchema = z.object({
  id: z.string().cuid(),
  code: z
    .string()
    .min(2)
    .max(20)
    .regex(/^[A-Z0-9_]+$/)
    .optional(),
  name: z.string().min(3).optional(),
  acronym: z.string().max(20).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

// ============================================
// OPD Router
// ============================================

export const opdRouter = router({
  /**
   * List all OPDs with counts
   * Access: All authenticated users
   */
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const { search, limit = 50, cursor } = input ?? {};

      // Single query with counts to avoid N+1
      const opds = await prisma.opd.findMany({
        where: search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { code: { contains: search, mode: "insensitive" } },
                { acronym: { contains: search, mode: "insensitive" } },
              ],
            }
          : undefined,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: {
              users: true,
              applications: true,
              infrastructure: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (opds.length > limit) {
        const nextItem = opds.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: opds,
        nextCursor,
      };
    }),

  /**
   * Get single OPD by ID with full details
   * Access: All authenticated users (Operators see only their own)
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      const { id } = input;

      // Operators can only view their own OPD
      if (ctx.user.role === "OPERATOR" && ctx.user.opdId !== id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only view your own OPD",
        });
      }

      const opd = await prisma.opd.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              users: true,
              applications: true,
              infrastructure: true,
              risks: true,
              dataStandards: true,
            },
          },
        },
      });

      if (!opd) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "OPD not found",
        });
      }

      return opd;
    }),

  /**
   * Get OPD by code
   * Access: All authenticated users
   */
  getByCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const opd = await prisma.opd.findUnique({
        where: { code: input.code },
      });

      if (!opd) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "OPD not found",
        });
      }

      return opd;
    }),

  /**
   * Create new OPD
   * Access: SUPER_ADMIN only
   */
  create: adminProcedure.input(createOpdSchema).mutation(async ({ input }) => {
    // Check for existing code
    const existing = await prisma.opd.findUnique({
      where: { code: input.code },
    });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `OPD with code "${input.code}" already exists`,
      });
    }

    const opd = await prisma.opd.create({
      data: input,
    });

    return opd;
  }),

  /**
   * Update existing OPD
   * Access: SUPER_ADMIN only
   */
  update: adminProcedure.input(updateOpdSchema).mutation(async ({ input }) => {
    const { id, ...data } = input;

    // Check if OPD exists
    const existing = await prisma.opd.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "OPD not found",
      });
    }

    // Check for code conflict if updating code
    if (data.code && data.code !== existing.code) {
      const codeConflict = await prisma.opd.findUnique({
        where: { code: data.code },
      });

      if (codeConflict) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `OPD with code "${data.code}" already exists`,
        });
      }
    }

    const opd = await prisma.opd.update({
      where: { id },
      data,
    });

    return opd;
  }),

  /**
   * Delete OPD
   * Access: SUPER_ADMIN only
   * Note: Will fail if OPD has related data (users, apps, etc.)
   */
  delete: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input }) => {
      const { id } = input;

      // Check if OPD exists and has dependencies
      const opd = await prisma.opd.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              users: true,
              applications: true,
              infrastructure: true,
            },
          },
        },
      });

      if (!opd) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "OPD not found",
        });
      }

      // Prevent deletion if OPD has dependencies
      const totalDeps =
        opd._count.users + opd._count.applications + opd._count.infrastructure;

      if (totalDeps > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot delete OPD with ${totalDeps} related records. Remove all users, applications, and infrastructure first.`,
        });
      }

      await prisma.opd.delete({
        where: { id },
      });

      return { success: true, deletedId: id };
    }),

  /**
   * Get statistics for all OPDs
   * Access: SUPER_ADMIN, LEADER
   */
  getStats: protectedProcedure.query(async () => {
    // Single aggregation query
    const stats = await prisma.opd.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        acronym: true,
        _count: {
          select: {
            users: true,
            applications: true,
            infrastructure: true,
            risks: true,
            dataStandards: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const totals = stats.reduce(
      (acc, opd) => ({
        totalUsers: acc.totalUsers + opd._count.users,
        totalApps: acc.totalApps + opd._count.applications,
        totalInfra: acc.totalInfra + opd._count.infrastructure,
        totalRisks: acc.totalRisks + opd._count.risks,
        totalDataStandards: acc.totalDataStandards + opd._count.dataStandards,
      }),
      {
        totalUsers: 0,
        totalApps: 0,
        totalInfra: 0,
        totalRisks: 0,
        totalDataStandards: 0,
      }
    );

    return {
      opdCount: stats.length,
      ...totals,
      perOpd: stats,
    };
  }),
});
