import { auth } from "@simapbe/auth";
import type { UserContext } from "@simapbe/auth/rbac";
import type { Context as ElysiaContext } from "elysia";

export type CreateContextOptions = {
  context: ElysiaContext;
};

export async function createContext({ context }: CreateContextOptions) {
  const session = await auth.api.getSession({
    headers: context.request.headers,
  });

  // Extract user with RBAC fields from session
  const user: UserContext | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: (session.user.role as UserContext["role"]) || "OPERATOR",
        opdId: session.user.opdId || null,
      }
    : null;

  return {
    session,
    user,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
