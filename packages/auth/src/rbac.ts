/**
 * RBAC Middleware for tRPC
 * Ref: Perpres 132/2022 - Domain Keamanan SPBE
 */

import type { UserRole } from "./index";
import { rolePermissions } from "./permissions";

/**
 * Custom RBAC Error for access control violations
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
 * Validates that the user's role has the required permission for a resource
 * @param user The user context
 * @param resource The resource domain (e.g. 'opd', 'probis')
 * @param action The action (e.g. 'read', 'create')
 */
export function requirePermission(
  user: UserContext | null | undefined,
  resource: keyof typeof rolePermissions.SUPER_ADMIN,
  action: string // We could infer this strictly but string is safer for generic usage
): asserts user is UserContext {
  if (!user) {
    throw new RBACError(
      "UNAUTHORIZED",
      "You must be logged in to access this resource"
    );
  }

  // Use Better Auth Access Control check
  // Note: ac.newRole create a role checker, but here we just want to check if the user's role *definition* allows it.
  // We can manually check existing definition since we are not fully integrating the plugin runtime yet.

  const roleDef = rolePermissions[user.role as keyof typeof rolePermissions];
  if (!roleDef) {
    throw new RBACError("FORBIDDEN", `Invalid user role: ${user.role}`);
  }

  // Check if permission exists in the role definition
  // @ts-expect-error - dynamic check
  const allowedActions = roleDef[resource] as readonly string[] | undefined;

  if (!(allowedActions && allowedActions.includes(action))) {
    throw new RBACError(
      "FORBIDDEN",
      `Access denied. Required permission: ${resource}.${action}`
    );
  }
}

/**
 * Verify user has one of the allowed roles
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
      `Access denied. Required roles: ${allowedRoles.join(", ")}`
    );
  }
}

/**
 * Verify user belongs to the specified OPD or is a Super Admin
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

  // Auditors can read any OPD
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
 * Verify user is a Walidata (Data Steward)
 */
export function verifyWalidata(
  user: UserContext | null | undefined
): asserts user is UserContext {
  requirePermission(user, "data", "validate");
}

/**
 * Verify user has auditing access
 */
export function verifyAuditAccess(
  user: UserContext | null | undefined
): asserts user is UserContext {
  requirePermission(user, "audit", "read");
}

/**
 * Check if user can modify a resource (helper boolean)
 */
export function canModify(user: UserContext, resourceOpdId?: string): boolean {
  if (user.role === "SUPER_ADMIN") {
    return true;
  }

  // Check if role has general update permission on the resource?
  // It depends on the resource type, so we keep the ABAC check:
  if (user.role === "OPERATOR" && resourceOpdId) {
    return user.opdId === resourceOpdId;
  }

  return false;
}
