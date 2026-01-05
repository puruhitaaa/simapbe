import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Unified proxy handler for Next.js 16 (replaces middleware.ts).
 * Uses getSessionCookie for fast edge-runtime auth checks without database lookup.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Fast cookie-only session check (no DB call)
  const sessionCookie = getSessionCookie(request);

  // Redirect unauthenticated users away from protected routes
  if (!sessionCookie && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from auth pages to dashboard
  if (sessionCookie && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Handle i18n routing for all other routes
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for:
  // - API routes, tRPC, Next.js internals, Vercel
  // - Static files (containing a dot)
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
