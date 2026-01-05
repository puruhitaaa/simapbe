import prisma from "@simapbe/db";
import { t } from "../index";

/**
 * Audit Logging Middleware
 * Logs all mutations (create/update/delete) to the AuditLog table
 * Required for Audit TIK compliance (Domain 6)
 */
export const auditLogMiddleware = t.middleware(
  async ({ ctx, path, type, next }) => {
    // Only log mutations, not queries
    if (type !== "mutation") {
      return next({ ctx });
    }

    const result = await next({ ctx });

    // Log after successful mutation
    if (ctx.session?.user) {
      try {
        // Extract entity and action from path
        // e.g., "opd.create" -> entity: "opd", action: "create"
        const pathParts = path.split(".");
        const entity = pathParts[0] || "unknown";
        const action = pathParts.slice(1).join(".").toUpperCase() || "MUTATION";

        await prisma.auditLog.create({
          data: {
            userId: ctx.session.user.id,
            action,
            entity,
            details: JSON.stringify({
              path,
              timestamp: new Date().toISOString(),
            }),
          },
        });
      } catch (error) {
        // Don't fail the original request if audit logging fails
        console.error("Audit logging failed:", error);
      }
    }

    return result;
  }
);

/**
 * Create a procedure that includes audit logging
 * Use this for any procedure that modifies data
 */
export const auditedProcedure = t.procedure.use(auditLogMiddleware);
