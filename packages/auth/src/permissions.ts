import type { UserRole } from "@simapbe/db";

/**
 * SPBE Role-Based Permission Matrix
 * Aligned with Perpres 132/2022 governance requirements
 */

// Permission actions
export type Permission =
  | "opd:read"
  | "opd:write"
  | "opd:delete"
  | "probis:read"
  | "probis:write"
  | "probis:delete"
  | "data:read"
  | "data:write"
  | "data:approve" // Walidata approval
  | "data:delete"
  | "app:read"
  | "app:write"
  | "app:approve" // Moratorium approval
  | "app:delete"
  | "infra:read"
  | "infra:write"
  | "infra:delete"
  | "service:read"
  | "service:write"
  | "service:delete"
  | "security:read"
  | "security:write"
  | "security:audit" // Audit TIK access
  | "planning:read"
  | "planning:write"
  | "planning:delete"
  | "user:read"
  | "user:write"
  | "user:manage"; // Assign roles

// Role-Permission mapping
const rolePermissions: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    // Diskominfo - Full access
    "opd:read",
    "opd:write",
    "opd:delete",
    "probis:read",
    "probis:write",
    "probis:delete",
    "data:read",
    "data:write",
    "data:approve",
    "data:delete",
    "app:read",
    "app:write",
    "app:approve",
    "app:delete",
    "infra:read",
    "infra:write",
    "infra:delete",
    "service:read",
    "service:write",
    "service:delete",
    "security:read",
    "security:write",
    "security:audit",
    "planning:read",
    "planning:write",
    "planning:delete",
    "user:read",
    "user:write",
    "user:manage",
  ],
  OPERATOR: [
    // OPD Staff - Limited to their OPD
    "opd:read",
    "probis:read",
    "data:read",
    "data:write",
    "app:read",
    "app:write",
    "infra:read",
    "infra:write",
    "service:read",
    "service:write",
    "security:read",
    "security:write",
    "planning:read",
    "user:read",
  ],
  AUDITOR: [
    // Inspektorat - Read-only audit access
    "opd:read",
    "probis:read",
    "data:read",
    "app:read",
    "infra:read",
    "service:read",
    "security:read",
    "security:audit",
    "planning:read",
    "user:read",
  ],
  LEADER: [
    // Executive - Dashboard access
    "opd:read",
    "probis:read",
    "data:read",
    "app:read",
    "infra:read",
    "service:read",
    "security:read",
    "planning:read",
    "user:read",
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): Permission[] {
  return rolePermissions[role] ?? [];
}

/**
 * Check if user can access OPD-scoped data
 */
export function canAccessOpd(
  userRole: UserRole,
  userOpdId: string | null,
  targetOpdId: string
): boolean {
  // Super Admin can access all OPDs
  if (userRole === "SUPER_ADMIN") return true;

  // Auditor can read any OPD
  if (userRole === "AUDITOR") return true;

  // Leader can read any OPD
  if (userRole === "LEADER") return true;

  // Operator can only access their own OPD
  return userOpdId === targetOpdId;
}
