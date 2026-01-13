import { expect, test } from "../../fixtures/trpc.fixture";

interface RiskListResult {
  items: Array<{
    id: string;
    riskCode: string;
    riskDescription: string;
    impactLevel: string;
    calculatedScore: { score: number; category: string };
  }>;
  nextCursor?: string;
}

interface AuditListResult {
  items: Array<{
    id: string;
    appId: string;
    auditDate: string;
    status: string;
    score: number;
  }>;
}

test.describe("Security API", () => {
  test.describe("Risk Management", () => {
    test.describe("Unauthenticated", () => {
      test("listRisks requires authentication", async ({ api }) => {
        await expect(api.callTrpc("security.listRisks")).rejects.toThrow();
      });
    });

    test.describe("Authenticated as SUPER_ADMIN", () => {
      test.beforeEach(async ({ api }) => {
        await api.authenticateAs("SUPER_ADMIN");
      });

      test("can list risk registers", async ({ api }) => {
        const result = await api.callTrpc<RiskListResult>(
          "security.listRisks",
          {}
        );

        expect(result).toHaveProperty("items");
        expect(Array.isArray(result.items)).toBe(true);
      });

      test("can get security statistics", async ({ api }) => {
        const result = await api.callTrpc<{
          risks: { total: number; critical: number };
          audits: { total: number; passRate: number };
        }>("security.getStats");

        expect(result).toHaveProperty("risks");
        expect(result).toHaveProperty("audits");
      });

      test("can get risk heatmap", async ({ api }) => {
        const result = await api.callTrpc<{ matrix: Record<string, number> }>(
          "security.getRiskHeatmap"
        );

        expect(result).toHaveProperty("matrix");
      });
    });

    test.describe("Authenticated as AUDITOR", () => {
      test.beforeEach(async ({ api }) => {
        await api.authenticateAs("AUDITOR");
      });

      test("can list risk registers (read-only)", async ({ api }) => {
        const result = await api.callTrpc<RiskListResult>(
          "security.listRisks",
          {}
        );
        expect(result).toHaveProperty("items");
      });
    });
  });

  test.describe("Security Audits", () => {
    test.describe("Authenticated as SUPER_ADMIN", () => {
      test.beforeEach(async ({ api }) => {
        await api.authenticateAs("SUPER_ADMIN");
      });

      test("can list security audits", async ({ api }) => {
        const result = await api.callTrpc<AuditListResult>(
          "security.listAudits",
          {}
        );

        expect(result).toHaveProperty("items");
        expect(Array.isArray(result.items)).toBe(true);
      });

      test("can get apps requiring audit", async ({ api }) => {
        const result = await api.callTrpc<unknown[]>(
          "security.getAppsRequiringAudit"
        );

        expect(Array.isArray(result)).toBe(true);
      });
    });

    test.describe("Authenticated as AUDITOR", () => {
      test.beforeEach(async ({ api }) => {
        await api.authenticateAs("AUDITOR");
      });

      test("can list security audits", async ({ api }) => {
        const result = await api.callTrpc<AuditListResult>(
          "security.listAudits",
          {}
        );
        expect(result).toHaveProperty("items");
      });
    });
  });

  test.describe("Audit Logs", () => {
    test.describe("Authenticated as AUDITOR", () => {
      test.beforeEach(async ({ api }) => {
        await api.authenticateAs("AUDITOR");
      });

      test("can view audit logs", async ({ api }) => {
        const result = await api.callTrpc<{ items: unknown[] }>(
          "security.queryAuditLogs",
          {}
        );
        expect(result).toHaveProperty("items");
      });

      test("can get audit log statistics", async ({ api }) => {
        const result = await api.callTrpc<{ total: number }>(
          "security.getAuditLogStats"
        );
        expect(result).toHaveProperty("total");
      });
    });

    test.describe("Authenticated as OPERATOR", () => {
      test.beforeEach(async ({ api }) => {
        await api.authenticateAs("OPERATOR");
      });

      test("cannot view audit logs (auditor only)", async ({ api }) => {
        await expect(
          api.callTrpc("security.queryAuditLogs", {})
        ).rejects.toThrow();
      });
    });
  });
});
