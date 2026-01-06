import {
  type ResourceType,
  rolePermissions,
  type UserRole,
} from "@simapbe/auth/definitions";

export type { UserRole, ResourceType };

export function hasPermission(
  role: UserRole | string | undefined | null,
  resource: ResourceType,
  action: string
): boolean {
  if (!role) {
    return false;
  }

  // Super Admin bypass
  if (role === "SUPER_ADMIN") {
    return true;
  }

  const roleDef = rolePermissions[role as UserRole];
  if (!roleDef) {
    return false;
  }

  // Dynamic access
  // @ts-expect-error
  const actions = roleDef[resource];
  if (!actions) {
    return false;
  }

  return actions.includes(action);
}
