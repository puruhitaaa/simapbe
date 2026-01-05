import { betterFetch } from "@better-fetch/fetch";
import type { Session, User } from "better-auth";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Next.js Middleware for Authentication (proxy.ts)
 *
 * This middleware handles auth redirects at the edge level.
 * For Next.js < 15.2, we use betterFetch to get session from the auth API.
 * For Next.js >= 15.2, you can use auth.api.getSession directly with Node.js runtime.
 */

type SessionData = {
  session: Session;
  user: User;
};

// Public routes that don't require authentication
const publicRoutes = ["/", "/login", "/signup", "/forgot-password"];

// Auth routes - redirect to dashboard if already logged in
const authRoutes = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // Static files
  ) {
    return NextResponse.next();
  }

  // Get session via HTTP request to auth API
  const { data: session } = await betterFetch<SessionData>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    }
  );

  const isAuthenticated = !!session?.user;
  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthRoute = authRoutes.includes(pathname);

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users to login for protected routes
  if (!(isAuthenticated || isPublicRoute)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
