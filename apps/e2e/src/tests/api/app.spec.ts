import { expect, test } from "../../fixtures/trpc.fixture";

interface AppListResult {
  items: Array<{
    id: string;
    code: string;
    name: string;
    type: string;
    platform: string;
    status: string;
  }>;
  nextCursor?: string;
}

interface MoratoriumResult {
  isDuplicate: boolean;
  similarApps: unknown[];
  recommendation: string;
}

interface AppStats {
  total: number;
  byType: Array<{ type: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  byPlatform: Array<{ platform: string; count: number }>;
}

test.describe("Application API", () => {
  test.describe("Unauthenticated", () => {
    test("list requires authentication", async ({ api }) => {
      await expect(api.callTrpc("app.list")).rejects.toThrow();
    });
  });

  test.describe("Authenticated as SUPER_ADMIN", () => {
    test.beforeEach(async ({ api }) => {
      await api.authenticateAs("SUPER_ADMIN");
    });

    test("can list applications", async ({ api }) => {
      const result = await api.callTrpc<AppListResult>("app.list", {});

      expect(result).toHaveProperty("items");
      expect(Array.isArray(result.items)).toBe(true);
    });

    test("can list applications with filters", async ({ api }) => {
      const result = await api.callTrpc<AppListResult>("app.list", {
        type: "KHUSUS",
        status: "ACTIVE",
        limit: 10,
      });

      expect(result).toHaveProperty("items");
      expect(Array.isArray(result.items)).toBe(true);
    });

    test("can get application statistics", async ({ api }) => {
      const result = await api.callTrpc<AppStats>("app.getStats");

      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("byType");
      expect(result).toHaveProperty("byStatus");
      expect(result).toHaveProperty("byPlatform");
      expect(typeof result.total).toBe("number");
    });

    test("moratorium check returns result", async ({ api }) => {
      const result = await api.callTrpc<MoratoriumResult>(
        "app.checkDuplication",
        {
          name: "Test Application",
          description: "Testing purposes",
        }
      );

      expect(result).toHaveProperty("isDuplicate");
      expect(result).toHaveProperty("similarApps");
      expect(result).toHaveProperty("recommendation");
      expect(typeof result.isDuplicate).toBe("boolean");
    });

    test("moratorium check detects similar apps", async ({ api }) => {
      const result = await api.callTrpc<MoratoriumResult>(
        "app.checkDuplication",
        {
          name: "SIMPEG",
          description: "Sistem Informasi Kepegawaian",
        }
      );

      expect(result).toHaveProperty("isDuplicate");
      expect(Array.isArray(result.similarApps)).toBe(true);
    });
  });

  test.describe("Authenticated as OPERATOR", () => {
    test.beforeEach(async ({ api }) => {
      await api.authenticateAs("OPERATOR");
    });

    test("can list applications", async ({ api }) => {
      const result = await api.callTrpc<AppListResult>("app.list", {});
      expect(result).toHaveProperty("items");
    });

    test("can use moratorium check", async ({ api }) => {
      const result = await api.callTrpc<MoratoriumResult>(
        "app.checkDuplication",
        { name: "New App", description: "New functionality" }
      );
      expect(result).toHaveProperty("isDuplicate");
    });

    test("can get application statistics", async ({ api }) => {
      const result = await api.callTrpc<AppStats>("app.getStats");
      expect(result).toHaveProperty("total");
    });
  });
});
