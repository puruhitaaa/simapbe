/**
 * RBAC Middleware for tRPC
 * Ref: Perpres 132/2022 - Domain Keamanan SPBE
 *
 * Provides role-based access control for API procedures:
 * - SUPER_ADMIN: Diskominfo - Full access to all operations
 * - OPERATOR: OPD Staff - Limited to own OPD data
 * - AUDITOR: Inspektorat - Read-only access to audit trails
 * - LEADER: Executive - Dashboard view only
 */

import type { UserRole } from "./index";

/**
 * Custom RBAC Error for access control violations
 * This can be caught and converted to TRPCError in the API layer
 */
export class RBACError extends Error {
  code: "UNAUTHORIZED" | "FORBIDDEN";

  constructor(code: "UNAUTHORIZED" | "FORBIDDEN", message: string) {
    super(message);
    this.code = code;
    this.name = "RBACError";
  }
}

/**
 * User context from session with RBAC fields
 */
export interface UserContext {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  opdId: string | null;
}

/**
 * Verify user has one of the allowed roles
 * @throws RBACError if user role is not in allowedRoles
 */
export function verifyRole(
  user: UserContext | null | undefined,
  allowedRoles: UserRole[]
): asserts user is UserContext {
  if (!user) {
    throw new RBACError(
      "UNAUTHORIZED",
      "You must be logged in to access this resource"
    );
  }

  if (!allowedRoles.includes(user.role)) {
    throw new RBACError(
      "FORBIDDEN",
      `Access denied. Required roles: ${allowedRoles.join(", ")}. Your role: ${user.role}`
    );
  }
}

/**
 * Verify user belongs to the specified OPD or is a Super Admin
 * Operators can only access data from their own OPD
 * @throws RBACError if user is not authorized for the OPD
 */
export function verifyOPD(
  user: UserContext | null | undefined,
  targetOpdId: string
): asserts user is UserContext {
  if (!user) {
    throw new RBACError(
      "UNAUTHORIZED",
      "You must be logged in to access this resource"
    );
  }

  // Super Admins can access any OPD
  if (user.role === "SUPER_ADMIN") {
    return;
  }

  // Auditors can read any OPD (for audit purposes)
  if (user.role === "AUDITOR") {
    return;
  }

  // Operators must belong to the target OPD
  if (user.opdId !== targetOpdId) {
    throw new RBACError(
      "FORBIDDEN",
      "You can only access data from your own OPD"
    );
  }
}

/**
 * Verify user is a Walidata (Data Steward) - only Super Admins from Diskominfo
 * Used for validating data standards per Satu Data Indonesia
 * @throws RBACError if user is not authorized as Walidata
 */
export function verifyWalidata(
  user: UserContext | null | undefined
): asserts user is UserContext {
  if (!user) {
    throw new RBACError(
      "UNAUTHORIZED",
      "You must be logged in to access this resource"
    );
  }

  // Only Super Admins can act as Walidata
  if (user.role !== "SUPER_ADMIN") {
    throw new RBACError(
      "FORBIDDEN",
      "Only Walidata (Super Admin) can validate data standards"
    );
  }
}

/**
 * Verify user has read-only access (for Auditors viewing audit trails)
 * @throws RBACError if user is not authorized
 */
export function verifyAuditAccess(
  user: UserContext | null | undefined
): asserts user is UserContext {
  if (!user) {
    throw new RBACError(
      "UNAUTHORIZED",
      "You must be logged in to access this resource"
    );
  }

  const allowedRoles: UserRole[] = ["SUPER_ADMIN", "AUDITOR"];

  if (!allowedRoles.includes(user.role)) {
    throw new RBACError(
      "FORBIDDEN",
      "Only auditors and administrators can access audit logs"
    );
  }
}

/**
 * Check if user can modify the resource
 * - SUPER_ADMIN: Can modify anything
 * - OPERATOR: Can only modify resources in their OPD
 * - AUDITOR: Cannot modify (read-only)
 * - LEADER: Cannot modify (view-only)
 */
export function canModify(user: UserContext, resourceOpdId?: string): boolean {
  if (user.role === "SUPER_ADMIN") {
    return true;
  }

  if (user.role === "OPERATOR" && resourceOpdId) {
    return user.opdId === resourceOpdId;
  }

  return false;
}

/**
 * Role hierarchy for permission checks
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 4,
  LEADER: 3,
  AUDITOR: 2,
  OPERATOR: 1,
};

/**
 * Check if user has at least the minimum role level
 */
export function hasMinimumRole(
  user: UserContext,
  minimumRole: UserRole
): boolean {
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minimumRole];
}
