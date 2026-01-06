import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for:
  // - API routes, tRPC, Next.js internals, Vercel
  // - Static files (containing a dot)
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
