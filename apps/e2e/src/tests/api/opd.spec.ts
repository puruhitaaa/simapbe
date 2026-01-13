import { expect, test } from "../../fixtures/trpc.fixture";

test.describe("OPD API", () => {
  test.describe("Unauthenticated", () => {
    test("list requires authentication", async ({ api }) => {
      await expect(api.callTrpc("opd.list")).rejects.toThrow();
    });

    test("getById requires authentication", async ({ api }) => {
      await expect(
        api.callTrpc("opd.getById", { id: "test-id" })
      ).rejects.toThrow();
    });
  });

  test.describe("Authenticated as SUPER_ADMIN", () => {
    test.beforeEach(async ({ api }) => {
      await api.authenticateAs("SUPER_ADMIN");
    });

    test("can list OPDs", async ({ api }) => {
      const result = await api.callTrpc<{
        items: unknown[];
        nextCursor?: string;
      }>("opd.list");

      expect(result).toHaveProperty("items");
      expect(Array.isArray(result.items)).toBe(true);
    });

    test("can create OPD", async ({ api }) => {
      const suffix = Date.now().toString(36).toUpperCase();
      const opdData = {
        code: `TEST_OPD_${suffix}`,
        name: `Test OPD ${suffix}`,
        acronym: `T${suffix.slice(-3)}`,
        address: "Test Address",
      };

      const result = await api.callTrpc<{ id: string; code: string }>(
        "opd.create",
        opdData
      );

      expect(result).toHaveProperty("id");
      expect(result.code).toBe(opdData.code);
    });

    test("cannot create duplicate OPD code", async ({ api }) => {
      const suffix = Date.now().toString(36).toUpperCase();
      const opdData = {
        code: `TEST_DUP_${suffix}`,
        name: "Test Duplicate OPD",
      };

      await api.callTrpc("opd.create", opdData);

      await expect(api.callTrpc("opd.create", opdData)).rejects.toThrow();
    });

    test("can get OPD statistics", async ({ api }) => {
      const result = await api.callTrpc<{ opdCount: number }>("opd.getStats");

      expect(result).toHaveProperty("opdCount");
      expect(typeof result.opdCount).toBe("number");
    });
  });

  test.describe("Authenticated as OPERATOR", () => {
    test.beforeEach(async ({ api }) => {
      await api.authenticateAs("OPERATOR");
    });

    test("can list OPDs (read access)", async ({ api }) => {
      const result = await api.callTrpc<{ items: unknown[] }>("opd.list");
      expect(result).toHaveProperty("items");
    });

    test("cannot create OPD (admin only)", async ({ api }) => {
      const opdData = {
        code: "TEST_FORBIDDEN",
        name: "Forbidden OPD",
      };

      await expect(api.callTrpc("opd.create", opdData)).rejects.toThrow();
    });
  });
});
