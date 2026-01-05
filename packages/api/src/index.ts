import { type UserContext, verifyRole } from "@simapbe/auth/rbac";
import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!(ctx.session && ctx.user)) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: "No session",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.user as UserContext,
    },
  });
});

/**
 * Admin procedure - requires SUPER_ADMIN role
 * Used for: User management, OPD management, Walidata operations
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  verifyRole(ctx.user, ["SUPER_ADMIN"]);
  return next({ ctx });
});

/**
 * Operator procedure - requires SUPER_ADMIN or OPERATOR role
 * Used for: CRUD operations on domain entities
 */
export const operatorProcedure = protectedProcedure.use(({ ctx, next }) => {
  verifyRole(ctx.user, ["SUPER_ADMIN", "OPERATOR"]);
  return next({ ctx });
});

/**
 * Auditor procedure - requires SUPER_ADMIN or AUDITOR role
 * Used for: Read-only access to audit logs and reports
 */
export const auditorProcedure = protectedProcedure.use(({ ctx, next }) => {
  verifyRole(ctx.user, ["SUPER_ADMIN", "AUDITOR"]);
  return next({ ctx });
});

/**
 * Leader procedure - all authenticated users with read access
 * Used for: Dashboard views and reports
 */
export const leaderProcedure = protectedProcedure;
