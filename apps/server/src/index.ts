import { cors } from "@elysiajs/cors";
import { createContext } from "@simapbe/api/context";
import { appRouter } from "@simapbe/api/routers/index";
import { auth } from "@simapbe/auth";
import { env } from "@simapbe/env/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Elysia } from "elysia";
import { splpRouter } from "./splp";

const app = new Elysia()
  .use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Transaction-ID",
        "X-Bandung-Agency-ID",
      ],
      credentials: true,
    })
  )
  .all("/api/auth/*", (context) => {
    const { request, status } = context;
    if (["POST", "GET"].includes(request.method)) {
      return auth.handler(request);
    }
    return status(405);
  })
  .all("/trpc/*", async (context) => {
    const res = await fetchRequestHandler({
      endpoint: "/trpc",
      router: appRouter,
      req: context.request,
      createContext: () => createContext({ context }),
    });
    return res;
  })
  // SPLP REST API for external interoperability
  .use(splpRouter)
  .get("/", () => "OK");

if (env.NODE_ENV !== "production") {
  app.listen(env.PORT, () => {
    console.log(`Server is running on http://localhost:${env.PORT}`);
  });
}
export default app;
export type App = typeof app;
