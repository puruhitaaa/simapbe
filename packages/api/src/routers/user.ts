/**
 * User Router - User Management via better-auth Admin Plugin
 * Ref: Perpres 132/2022 - Domain Keamanan SPBE
 *
 * Provides user management endpoints that wrap better-auth's admin API
 * with additional business logic specific to SIMAPBE.
 *
 * Access:
 * - SUPER_ADMIN: Full CRUD on all users
 * - Others: Can only view their own profile
 *
 * Roles:
 * - SUPER_ADMIN: Diskominfo - Full access
 * - OPERATOR: OPD Staff - Limited to own OPD
 * - AUDITOR: Inspektorat - Read-only audit access
 * - LEADER: Executive - Dashboard view
 */

import type { UserRole } from "@simapbe/auth";
import prisma from "@simapbe/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../index";

// ============================================
// Schema Definitions
// ============================================

const userRoleSchema = z.enum(["SUPER_ADMIN", "OPERATOR", "AUDITOR", "LEADER"]);

const listUsersSchema = z.object({
  search: z.string().optional(),
  role: userRoleSchema.optional(),
  opdId: z.cuid().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

const updateUserRoleSchema = z.object({
  userId: z.string(),
  role: userRoleSchema,
});

const assignUserOpdSchema = z.object({
  userId: z.string(),
  opdId: z.cuid().nullable(),
});

const createUserSchema = z.object({
  email: z.email("Invalid email format"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: userRoleSchema.default("OPERATOR"),
  opdId: z.cuid().optional(),
});

const updateUserSchema = z.object({
  userId: z.string(),
  name: z.string().min(2).optional(),
  email: z.email().optional(),
  opdId: z.cuid().nullable().optional(),
});

// ============================================
// User Router
// ============================================

export const userRouter = router({
  /**
   * List all users with filtering and pagination
   * Access: SUPER_ADMIN only
   */
  list: adminProcedure.input(listUsersSchema).query(async ({ input }) => {
    const { search, role, opdId, limit, offset } = input;

    // Build where clause
    const where: {
      role?: UserRole;
      opdId?: string;
      OR?: Array<{
        name?: { contains: string; mode: "insensitive" };
        email?: { contains: string; mode: "insensitive" };
      }>;
    } = {};

    if (role) {
      where.role = role;
    }

    if (opdId) {
      where.opdId = opdId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Query users with related OPD
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          role: true,
          opdId: true,
          createdAt: true,
          updatedAt: true,
          opd: {
            select: {
              id: true,
              code: true,
              name: true,
              acronym: true,
            },
          },
          _count: {
            select: {
              sessions: true,
              auditLogs: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items: users,
      total,
      limit,
      offset,
      hasMore: offset + users.length < total,
    };
  }),

  /**
   * Get a single user by ID
   * Access: SUPER_ADMIN or self
   */
  getById: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      const { userId } = input;

      // Non-admins can only view their own profile
      if (ctx.user.role !== "SUPER_ADMIN" && ctx.user.id !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only view your own profile",
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          role: true,
          opdId: true,
          createdAt: true,
          updatedAt: true,
          opd: {
            select: {
              id: true,
              code: true,
              name: true,
              acronym: true,
            },
          },
          sessions: {
            select: {
              id: true,
              createdAt: true,
              expiresAt: true,
              ipAddress: true,
              userAgent: true,
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          _count: {
            select: {
              sessions: true,
              auditLogs: true,
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return user;
    }),

  /**
   * Get current user's profile
   * Access: Any authenticated user
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        opdId: true,
        createdAt: true,
        updatedAt: true,
        opd: {
          select: {
            id: true,
            code: true,
            name: true,
            acronym: true,
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  }),

  /**
   * Update user's role
   * Access: SUPER_ADMIN only
   * Note: This updates the role directly in the database.
   *       Consider using better-auth's admin.setRole for full integration.
   */
  setRole: adminProcedure
    .input(updateUserRoleSchema)
    .mutation(async ({ input, ctx }) => {
      const { userId, role } = input;

      // Prevent self role change to non-admin
      if (ctx.user.id === userId && role !== "SUPER_ADMIN") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot demote yourself from SUPER_ADMIN",
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          opdId: true,
        },
      });

      return updatedUser;
    }),

  /**
   * Assign user to OPD
   * Access: SUPER_ADMIN only
   */
  assignOpd: adminProcedure
    .input(assignUserOpdSchema)
    .mutation(async ({ input }) => {
      const { userId, opdId } = input;

      // Verify OPD exists if provided
      if (opdId) {
        const opd = await prisma.opd.findUnique({
          where: { id: opdId },
        });

        if (!opd) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "OPD not found",
          });
        }
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: { opdId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          opdId: true,
          opd: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      });

      return user;
    }),

  /**
   * Create new user
   * Access: SUPER_ADMIN only
   * Note: This creates a user directly. For better-auth integration,
   *       consider using the authClient.admin.createUser endpoint.
   */
  create: adminProcedure.input(createUserSchema).mutation(async ({ input }) => {
    const {
      email,
      name: _name,
      password: _password,
      role: _role,
      opdId,
    } = input;

    // Check for existing email
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "A user with this email already exists",
      });
    }

    // Verify OPD exists if provided
    if (opdId) {
      const opd = await prisma.opd.findUnique({
        where: { id: opdId },
      });

      if (!opd) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "OPD not found",
        });
      }
    }

    // Note: For proper password hashing and account creation,
    // use better-auth's admin.createUser API on the client side.
    // This endpoint is for reference/fallback.
    throw new TRPCError({
      code: "NOT_IMPLEMENTED",
      message:
        "Use authClient.admin.createUser for proper user creation with password hashing",
    });
  }),

  /**
   * Update user information
   * Access: SUPER_ADMIN only
   */
  update: adminProcedure.input(updateUserSchema).mutation(async ({ input }) => {
    const { userId, ...data } = input;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Check email uniqueness if updating
    if (data.email && data.email !== user.email) {
      const existing = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A user with this email already exists",
        });
      }
    }

    // Verify OPD exists if updating
    if (data.opdId) {
      const opd = await prisma.opd.findUnique({
        where: { id: data.opdId },
      });

      if (!opd) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "OPD not found",
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        opdId: data.opdId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        opdId: true,
        opd: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    return updatedUser;
  }),

  /**
   * Delete user
   * Access: SUPER_ADMIN only
   */
  delete: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { userId } = input;

      // Prevent self-deletion
      if (ctx.user.id === userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot delete yourself",
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      await prisma.user.delete({
        where: { id: userId },
      });

      return { success: true, deletedId: userId };
    }),

  /**
   * Get user statistics
   * Access: SUPER_ADMIN only
   */
  getStats: adminProcedure.query(async () => {
    const [total, byRole, byOpd, recentUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ["role"],
        _count: { id: true },
      }),
      prisma.user.groupBy({
        by: ["opdId"],
        _count: { id: true },
        where: { opdId: { not: null } },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const roleStats = byRole.reduce(
      (acc, { role, _count }) => {
        acc[role] = _count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total,
      byRole: roleStats,
      opdWithUsers: byOpd.length,
      recentUsers,
    };
  }),

  /**
   * Get available roles
   * Access: Any authenticated user
   */
  getRoles: protectedProcedure.query(() => {
    return [
      {
        value: "SUPER_ADMIN",
        label: "Super Admin",
        description: "Diskominfo - Full access to all operations",
      },
      {
        value: "OPERATOR",
        label: "Operator",
        description: "OPD Staff - Limited to own OPD data",
      },
      {
        value: "AUDITOR",
        label: "Auditor",
        description: "Inspektorat - Read-only access to audit trails",
      },
      {
        value: "LEADER",
        label: "Leader",
        description: "Executive - Dashboard view only",
      },
    ];
  }),
});
