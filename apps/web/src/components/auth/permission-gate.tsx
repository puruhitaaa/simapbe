"use client";

// We should use the session passed from props or context?
// `authClient.useSession()` is the hook from better-auth/react.
// Assuming we are utilizing `better-auth` client.
import { authClient } from "@/lib/auth-client";
import { hasPermission, type ResourceType } from "@/lib/permissions";

interface PermissionGateProps {
  children: React.ReactNode;
  permission: ResourceType;
  action?: string; // default "read"
  fallback?: React.ReactNode;
}

export function PermissionGate({
  children,
  permission,
  action = "read",
  fallback = null,
}: PermissionGateProps) {
  const { data: session } = authClient.useSession();

  if (!session?.user) {
    return <>{fallback}</>;
  }

  // Need to ensure user type has 'role'
  const userRole = session.user.role; // 'role' inferred from additionalFields

  if (hasPermission(userRole, permission, action)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
