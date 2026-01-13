import { expect, test } from "../../fixtures/trpc.fixture";

interface ServiceListResult {
  items: Array<{
    id: string;
    code: string;
    name: string;
    type: string;
    isActive: boolean;
  }>;
  nextCursor?: string;
}

interface ServiceStats {
  total: number;
  active: number;
  inactive: number;
  byType: Array<{ type: string; count: number }>;
}

test.describe("Service API", () => {
  test.describe("Unauthenticated", () => {
    test("list requires authentication", async ({ api }) => {
      await expect(api.callTrpc("service.list")).rejects.toThrow();
    });
  });

  test.describe("Authenticated as SUPER_ADMIN", () => {
    test.beforeEach(async ({ api }) => {
      await api.authenticateAs("SUPER_ADMIN");
    });

    test("can list services", async ({ api }) => {
      const result = await api.callTrpc<ServiceListResult>("service.list", {});

      expect(result).toHaveProperty("items");
      expect(Array.isArray(result.items)).toBe(true);
    });

    test("can get service statistics", async ({ api }) => {
      const result = await api.callTrpc<ServiceStats>("service.getStats");

      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("byType");
      expect(typeof result.total).toBe("number");
    });

    test("can get integration status", async ({ api }) => {
      const result = await api.callTrpc<{
        total: number;
        fullyLinked: number;
        orphans: number;
        integrationRate: number;
      }>("service.getIntegrationStatus");

      expect(result).toHaveProperty("integrationRate");
      expect(typeof result.integrationRate).toBe("number");
    });
  });

  test.describe("Authenticated as OPERATOR", () => {
    test.beforeEach(async ({ api }) => {
      await api.authenticateAs("OPERATOR");
    });

    test("can view services", async ({ api }) => {
      const result = await api.callTrpc<ServiceListResult>("service.list", {});
      expect(result).toHaveProperty("items");
    });
  });

  test.describe("Authenticated as AUDITOR", () => {
    test.beforeEach(async ({ api }) => {
      await api.authenticateAs("AUDITOR");
    });

    test("can view services (read-only)", async ({ api }) => {
      const result = await api.callTrpc<ServiceListResult>("service.list", {});
      expect(result).toHaveProperty("items");
    });
  });
});
