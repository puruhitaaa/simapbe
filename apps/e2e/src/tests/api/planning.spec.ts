import { expect, test } from "../../fixtures/trpc.fixture";

interface PlanListResult {
  items: Array<{
    id: string;
    planCode: string;
    year: number;
    initiativeName: string;
    domain: string;
    status: string;
  }>;
  nextCursor?: string;
}

interface GapAnalysisResult {
  currentState: Record<string, number>;
  planned: Record<string, number>;
  gaps: {
    appsWithoutService: number;
    servicesWithoutProbis: number;
    appsWithoutRecentAudit: number;
  };
  recommendations: string[];
}

test.describe("Planning API (Peta Rencana)", () => {
  test.describe("Unauthenticated", () => {
    test("list requires authentication", async ({ api }) => {
      await expect(api.callTrpc("planning.list")).rejects.toThrow();
    });
  });

  test.describe("Authenticated as SUPER_ADMIN", () => {
    test.beforeEach(async ({ api }) => {
      await api.authenticateAs("SUPER_ADMIN");
    });

    test("can list SPBE plans", async ({ api }) => {
      const result = await api.callTrpc<PlanListResult>("planning.list", {});

      expect(result).toHaveProperty("items");
      expect(Array.isArray(result.items)).toBe(true);
    });

    test("can get planning statistics", async ({ api }) => {
      const result = await api.callTrpc<{
        byStatus: Record<string, number>;
        totalBudget: number;
      }>("planning.getStats");

      expect(result).toHaveProperty("byStatus");
      expect(result).toHaveProperty("totalBudget");
    });

    test("can run gap analysis", async ({ api }) => {
      const result = await api.callTrpc<GapAnalysisResult>(
        "planning.getGapAnalysis"
      );

      expect(result).toHaveProperty("gaps");
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    test("can get roadmap timeline", async ({ api }) => {
      const result = await api.callTrpc<{ years: number[]; byYear: any }>(
        "planning.getRoadmap",
        { startYear: 2025, endYear: 2029 }
      );

      expect(result).toHaveProperty("years");
      expect(result).toHaveProperty("byYear");
    });
  });

  test.describe("Authenticated as LEADER", () => {
    test.beforeEach(async ({ api }) => {
      await api.authenticateAs("LEADER");
    });

    test("can view SPBE plans", async ({ api }) => {
      const result = await api.callTrpc<PlanListResult>("planning.list", {});
      expect(result).toHaveProperty("items");
    });

    test("can view roadmap", async ({ api }) => {
      const result = await api.callTrpc<{ years: number[] }>(
        "planning.getRoadmap",
        { startYear: 2025, endYear: 2029 }
      );
      expect(result).toHaveProperty("years");
    });
  });

  test.describe("Authenticated as OPERATOR", () => {
    test.beforeEach(async ({ api }) => {
      await api.authenticateAs("OPERATOR");
    });

    test("can view SPBE plans", async ({ api }) => {
      const result = await api.callTrpc<PlanListResult>("planning.list", {});
      expect(result).toHaveProperty("items");
    });
  });
});
