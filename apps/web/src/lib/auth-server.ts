import type { Session } from "@simapbe/auth";
import { env } from "@simapbe/env/web";
import { headers } from "next/headers";

/**
 * Server-side session fetcher for RSC (React Server Components)
 *
 * This function properly fetches the session from the backend server
 * by forwarding cookies from the incoming request. This is necessary
 * because the frontend and backend are on different origins in production.
 *
 * Use this in:
 * - Server Components (pages, layouts)
 * - Server Actions
 *
 * Do NOT use authClient.getSession() on the server as it doesn't
 * properly handle cross-origin cookie forwarding.
 *
 * @see https://www.better-auth.com/docs/integrations/next#rsc-and-server-actions
 */
export async function getServerSession(): Promise<Session | null> {
  try {
    const requestHeaders = await headers();
    const cookie = requestHeaders.get("cookie") ?? "";

    // If no cookies, user is definitely not authenticated
    if (!cookie) {
      return null;
    }

    const host = requestHeaders.get("host");
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const origin =
      requestHeaders.get("origin") ||
      (host ? `${protocol}://${host}` : env.NEXT_PUBLIC_SERVER_URL);

    const response = await fetch(
      `${env.NEXT_PUBLIC_SERVER_URL}/api/auth/get-session`,
      {
        method: "GET",
        headers: {
          cookie,
          // Forward other relevant headers
          "user-agent": requestHeaders.get("user-agent") ?? "",
          "x-forwarded-for": requestHeaders.get("x-forwarded-for") ?? "",
          origin,
        },
        // Disable caching to always get fresh session data
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        "[auth-server] Failed to fetch session:",
        response.status,
        response.statusText
      );
      return null;
    }

    const data = (await response.json()) as Session | null;
    return data;
  } catch (error) {
    console.error("[auth-server] Error fetching session:", error);
    return null;
  }
}
