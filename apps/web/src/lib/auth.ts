import "server-only";

import { headers } from "next/headers";
import { cache } from "react";

import { authClient } from "./auth-client";

/**
 * Cached getSession utility for Server Components
 *
 * Uses React's cache() to deduplicate session fetches within a single request.
 * This prevents multiple getSession calls from making redundant HTTP requests.
 *
 * Usage:
 * ```tsx
 * const session = await getSession();
 * if (!session) redirect("/login");
 * ```
 */
export const getSession = cache(async () => {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  return session?.data ?? null;
});

/**
 * Get the current user from session (convenience wrapper)
 */
export const getUser = cache(async () => {
  const session = await getSession();
  return session?.user ?? null;
});

/**
 * Type-safe session check - throws if not authenticated
 */
export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("Authentication required");
  }
  return session;
}

/**
 * Type-safe user check - throws if not authenticated
 */
export async function requireUser() {
  const user = await getUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}
