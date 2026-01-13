import { createMiddleware } from "@tanstack/react-start";

import { authClient } from "@/lib/auth-client";

export const authMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    const headers = new Headers();
    const cookie = request.headers.get("cookie");
    if (cookie) {
      headers.set("cookie", cookie);
    }
    const session = await authClient.getSession({
      fetchOptions: {
        headers,
        throw: true,
      },
    });
    return next({
      context: { session },
    });
  }
);
