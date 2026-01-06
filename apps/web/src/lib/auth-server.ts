import { auth } from "@simapbe/auth";
import { headers } from "next/headers";

/**
 * Server-side session fetcher for RSC (React Server Components)
 *
 * This function directly uses the shared auth library to validate the session
 * against the database, bypassing the need for an internal HTTP request to the API.
 * This is more robust and performant for the monorepo setup.
 */
export async function getServerSession() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  return session;
}
