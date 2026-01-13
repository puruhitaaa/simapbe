import { expect, test } from "../../fixtures/trpc.fixture";

test.describe("User API", () => {
  test.describe("Unauthenticated", () => {
    test("list requires authentication", async ({ api }) => {
      await expect(api.callTrpc("user.list")).rejects.toThrow();
    });

    test("me requires authentication", async ({ api }) => {
      await expect(api.callTrpc("user.me")).rejects.toThrow();
    });
  });

  test.describe("Authenticated as SUPER_ADMIN", () => {
    test.beforeEach(async ({ api }) => {
      await api.authenticateAs("SUPER_ADMIN");
    });

    test("can list users", async ({ api }) => {
      const result = await api.callTrpc<{ items: unknown[]; total: number }>(
        "user.list",
        {}
      );

      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.items)).toBe(true);
    });

    test("can get own profile via me", async ({ api }) => {
      const result = await api.callTrpc<{
        id: string;
        email: string;
        role: string;
      }>("user.me");

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("email");
      expect(result.role).toBe("SUPER_ADMIN");
    });

    test("can get user statistics", async ({ api }) => {
      const result = await api.callTrpc<{
        total: number;
        byRole: Record<string, number>;
      }>("user.getStats");

      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("byRole");
    });

    test("can get available roles", async ({ api }) => {
      const result =
        await api.callTrpc<Array<{ value: string; label: string }>>(
          "user.getRoles"
        );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(4);

      const roleValues = result.map((r) => r.value);
      expect(roleValues).toContain("SUPER_ADMIN");
      expect(roleValues).toContain("OPERATOR");
      expect(roleValues).toContain("AUDITOR");
      expect(roleValues).toContain("LEADER");
    });
  });

  test.describe("Authenticated as OPERATOR", () => {
    test.beforeEach(async ({ api }) => {
      await api.authenticateAs("OPERATOR");
    });

    test("can get own profile", async ({ api }) => {
      const result = await api.callTrpc<{ role: string }>("user.me");
      expect(result.role).toBe("OPERATOR");
    });

    test("cannot list all users (admin only)", async ({ api }) => {
      await expect(api.callTrpc("user.list", {})).rejects.toThrow();
    });

    test("cannot get user statistics (admin only)", async ({ api }) => {
      await expect(api.callTrpc("user.getStats")).rejects.toThrow();
    });
  });

  test.describe("Authenticated as AUDITOR", () => {
    test.beforeEach(async ({ api }) => {
      await api.authenticateAs("AUDITOR");
    });

    test("can get own profile", async ({ api }) => {
      const result = await api.callTrpc<{ role: string }>("user.me");
      expect(result.role).toBe("AUDITOR");
    });

    test("can get available roles", async ({ api }) => {
      const result = await api.callTrpc<unknown[]>("user.getRoles");
      expect(Array.isArray(result)).toBe(true);
    });
  });

  test.describe("Authenticated as LEADER", () => {
    test.beforeEach(async ({ api }) => {
      await api.authenticateAs("LEADER");
    });

    test("can get own profile", async ({ api }) => {
      const result = await api.callTrpc<{ role: string }>("user.me");
      expect(result.role).toBe("LEADER");
    });
  });
});
