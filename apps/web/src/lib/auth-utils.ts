import { headers } from "next/headers";
import { cache } from "react";
import { authClient } from "./auth-client";

/**
 * Cached session getter for use in React Server Components.
 * Uses React's `cache()` to deduplicate session fetches within a single request.
 *
 * This prevents multiple db lookups when the session is accessed
 * across layout/page boundaries (e.g., DashboardLayout + DashboardPage).
 */
export const getSession = cache(async () => {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
      throw: true,
    },
  });

  return session;
});
