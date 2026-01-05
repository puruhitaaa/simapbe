import {
  canAccessOpd,
  hasPermission,
  type Permission,
} from "@simapbe/auth/permissions";
import { UserRole } from "@simapbe/db";
import { TRPCError } from "@trpc/server";
import { t } from "../index";

/**
 * Middleware to require a specific permission
 */
export function requirePermission(permission: Permission) {
  return t.middleware(({ ctx, next }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    const role =
      (ctx.session.user as { role?: UserRole }).role ?? UserRole.OPERATOR;

    if (!hasPermission(role, permission)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Permission denied: ${permission}`,
      });
    }

    return next({ ctx: { ...ctx, session: ctx.session, role } });
  });
}

/**
 * Middleware to require Super Admin role
 */
export const requireAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  const role =
    (ctx.session.user as { role?: UserRole }).role ?? UserRole.OPERATOR;

  if (role !== UserRole.SUPER_ADMIN) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Super Admin access required",
    });
  }

  return next({ ctx: { ...ctx, session: ctx.session, role } });
});

/**
 * Middleware to verify OPD access (for Operator role)
 * Ensures Operators can only access data from their own OPD
 */
export function verifyOpdAccess(
  getOpdId: (input: unknown) => string | undefined
) {
  return t.middleware(({ ctx, input, next }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    const user = ctx.session.user as { role?: UserRole; opdId?: string };
    const role = user.role ?? UserRole.OPERATOR;
    const userOpdId = user.opdId ?? null;
    const targetOpdId = getOpdId(input);

    // If no target OPD specified, allow (list operations)
    if (!targetOpdId) {
      return next({ ctx: { ...ctx, session: ctx.session, role, userOpdId } });
    }

    if (!canAccessOpd(role, userOpdId, targetOpdId)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Access denied: You can only access data from your assigned OPD",
      });
    }

    return next({ ctx: { ...ctx, session: ctx.session, role, userOpdId } });
  });
}

/**
 * Middleware for Walidata approval (Satu Data)
 * Only Super Admin can approve data standards
 */
export const requireWalidata = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  const role =
    (ctx.session.user as { role?: UserRole }).role ?? UserRole.OPERATOR;

  if (!hasPermission(role, "data:approve")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Walidata approval required (Super Admin only)",
    });
  }

  return next({ ctx: { ...ctx, session: ctx.session, role } });
});
