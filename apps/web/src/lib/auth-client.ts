import type { auth } from "@simapbe/auth";
import { env } from "@simapbe/env/web";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_SERVER_URL,
  plugins: [
    // Infer additional fields (role, opdId) from server auth config
    inferAdditionalFields<typeof auth>(),
    // Admin client for user management
    adminClient(),
  ],
});

// Export types for use in components
export type Session = typeof authClient.$Infer.Session;
