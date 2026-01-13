import { test as base } from "@playwright/test";

const API_URL = process.env.E2E_API_URL || "http://localhost:3000";
const WEB_URL = process.env.E2E_WEB_URL || "http://localhost:3001";

let sessionCookies: string | null = null;

export async function authenticateForAPI(
  email: string,
  password: string
): Promise<string | null> {
  try {
    // Must use WEB_URL as Origin because Better Auth's trustedOrigins is set to CORS_ORIGIN (web app)
    const response = await fetch(`${API_URL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: WEB_URL,
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      console.error(`Auth failed: ${response.status}`);
      return null;
    }

    const setCookies = response.headers.getSetCookie?.() || [];
    for (const cookie of setCookies) {
      if (cookie.startsWith("better-auth.session_token=")) {
        const cookieValue = cookie.split(";")[0];
        sessionCookies = cookieValue;
        return cookieValue;
      }
    }

    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader?.includes("better-auth.session_token=")) {
      const cookieValue = setCookieHeader.split(";")[0];
      sessionCookies = cookieValue;
      return cookieValue;
    }

    const data = await response.json();
    if (data.token) {
      const cookie = `better-auth.session_token=${data.token}`;
      sessionCookies = cookie;
      return cookie;
    }

    return null;
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}

export function clearSession(): void {
  sessionCookies = null;
}

export const API_TEST_USERS = {
  SUPER_ADMIN: {
    email: process.env.E2E_USER_SUPER_ADMIN_EMAIL || "admin@bandung.go.id",
    password: process.env.E2E_USER_SUPER_ADMIN_PASSWORD || "password123",
  },
  OPERATOR: {
    email:
      process.env.E2E_USER_OPERATOR_EMAIL ||
      "operator.diskominfo@bandung.go.id",
    password: process.env.E2E_USER_OPERATOR_PASSWORD || "password123",
  },
  AUDITOR: {
    email: process.env.E2E_USER_AUDITOR_EMAIL || "auditor@bandung.go.id",
    password: process.env.E2E_USER_AUDITOR_PASSWORD || "password123",
  },
  LEADER: {
    email: process.env.E2E_USER_LEADER_EMAIL || "pimpinan@bandung.go.id",
    password: process.env.E2E_USER_LEADER_PASSWORD || "password123",
  },
};

export interface TRPCFixture {
  callTrpc: <T>(
    procedure: string,
    input?: unknown,
    authenticated?: boolean
  ) => Promise<T>;
  authenticateAs: (role: keyof typeof API_TEST_USERS) => Promise<void>;
  rawFetch: (path: string, options?: RequestInit) => Promise<Response>;
}

export const test = base.extend<{ api: TRPCFixture }>({
  api: async ({}, use) => {
    const fixture: TRPCFixture = {
      callTrpc: async <T>(
        procedure: string,
        input?: unknown,
        _authenticated = false
      ): Promise<T> => {
        const isMutation =
          procedure.includes("create") ||
          procedure.includes("update") ||
          procedure.includes("delete") ||
          procedure.includes("register") ||
          procedure.includes("link") ||
          procedure.includes("submit") ||
          procedure.includes("validate") ||
          procedure.includes("import") ||
          procedure.includes("export") ||
          procedure.includes("download");

        const url = new URL(`${API_URL}/trpc/${procedure}`);
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (sessionCookies) {
          headers["Cookie"] = sessionCookies;
        }

        let response: Response;

        if (isMutation) {
          response = await fetch(url.toString(), {
            method: "POST",
            headers,
            body: JSON.stringify(input || {}),
          });
        } else {
          if (input !== undefined) {
            url.searchParams.set("input", JSON.stringify(input));
          }
          response = await fetch(url.toString(), { headers });
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message || "tRPC error");
        }

        return data.result?.data as T;
      },

      authenticateAs: async (role) => {
        const user = API_TEST_USERS[role];
        if (!user) throw new Error(`Unknown role: ${role}`);
        const cookies = await authenticateForAPI(user.email, user.password);
        if (!cookies) throw new Error(`Failed to authenticate as ${role}`);
      },

      rawFetch: async (path, options = {}) => {
        return fetch(`${API_URL}${path}`, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...(sessionCookies ? { Cookie: sessionCookies } : {}),
            ...options.headers,
          },
        });
      },
    };

    await use(fixture);
    clearSession();
  },
});

export { expect } from "@playwright/test";
