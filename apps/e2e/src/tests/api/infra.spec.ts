import { expect, test } from "../../fixtures/trpc.fixture";

interface InfraListResult {
  items: Array<{
    id: string;
    code: string;
    name: string;
    type: string;
    location: string;
  }>;
  nextCursor?: string;
}

interface InfraStats {
  total: number;
  active: number;
  inactive: number;
  byType: Array<{ type: string; count: number }>;
  byLocation: Array<{ location: string; count: number }>;
}

test.describe("Infrastructure API", () => {
  test.describe("Unauthenticated", () => {
    test("list requires authentication", async ({ api }) => {
      await expect(api.callTrpc("infra.list")).rejects.toThrow();
    });
  });

  test.describe("Authenticated as SUPER_ADMIN", () => {
    test.beforeEach(async ({ api }) => {
      await api.authenticateAs("SUPER_ADMIN");
    });

    test("can list infrastructure", async ({ api }) => {
      const result = await api.callTrpc<InfraListResult>("infra.list", {});

      expect(result).toHaveProperty("items");
      expect(Array.isArray(result.items)).toBe(true);
    });

    test("can get infrastructure statistics", async ({ api }) => {
      const result = await api.callTrpc<InfraStats>("infra.getStats");

      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("byType");
      expect(result).toHaveProperty("byLocation");
      expect(typeof result.total).toBe("number");
    });

    test("can get infrastructure by location", async ({ api }) => {
      const result = await api.callTrpc<{
        totals: {
          pdn: { count: number };
          local: { count: number };
        };
      }>("infra.getByLocation");

      expect(result).toHaveProperty("totals");
      expect(result.totals).toHaveProperty("pdn");
      expect(result.totals).toHaveProperty("local");
    });

    test("can get PDN migration candidates", async ({ api }) => {
      const result = await api.callTrpc<unknown[]>(
        "infra.getMigrationCandidates"
      );

      expect(Array.isArray(result)).toBe(true);
    });
  });

  test.describe("Authenticated as OPERATOR", () => {
    test.beforeEach(async ({ api }) => {
      await api.authenticateAs("OPERATOR");
    });

    test("can list infrastructure", async ({ api }) => {
      const result = await api.callTrpc<InfraListResult>("infra.list", {});
      expect(result).toHaveProperty("items");
    });
  });
});
