import { expect, test } from "../../fixtures/trpc.fixture";

test.describe("Business Process (Probis) API", () => {
  test.describe("Unauthenticated", () => {
    test("list requires authentication", async ({ api }) => {
      await expect(api.callTrpc("probis.list")).rejects.toThrow();
    });
  });

  test.describe("Authenticated as SUPER_ADMIN", () => {
    test.beforeEach(async ({ api }) => {
      await api.authenticateAs("SUPER_ADMIN");
    });

    test("can list business processes", async ({ api }) => {
      const result = await api.callTrpc<{ items: unknown[] }>(
        "probis.list",
        {}
      );

      expect(result).toHaveProperty("items");
      expect(Array.isArray(result.items)).toBe(true);
    });

    test("can create level 1 business process (Sektor)", async ({ api }) => {
      // Valid code format: 2-3 uppercase letters
      const result = await api.callTrpc<{ id: string; kodeProbismet: string }>(
        "probis.create",
        {
          kodeProbismet: "TX",
          name: "Test Sektor",
          level: 1,
        }
      );

      expect(result).toHaveProperty("id");
      expect(result.kodeProbismet).toBe("TX");

      // Cleanup (optional but good)
      // Since this is a test, the database is meant to be cleaned up anyway
    });

    test("can get hierarchy tree", async ({ api }) => {
      const result = await api.callTrpc<unknown[]>("probis.getHierarchy");

      expect(Array.isArray(result)).toBe(true);
    });
  });

  test.describe("Authenticated as OPERATOR", () => {
    test.beforeEach(async ({ api }) => {
      await api.authenticateAs("OPERATOR");
    });

    test("can list business processes", async ({ api }) => {
      const result = await api.callTrpc<{ items: unknown[] }>(
        "probis.list",
        {}
      );
      expect(result).toHaveProperty("items");
    });
  });
});
