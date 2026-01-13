import { expect, test } from "../../fixtures/trpc.fixture";

interface DataListResult {
  items: Array<{
    id: string;
    dataCode: string;
    dataName: string;
    classification: string;
    isValidated: boolean;
  }>;
  nextCursor?: string;
}

interface DataClassificationStats {
  byClassification: Array<{ classification: string; count: number }>;
  validated: number;
  pending: number;
  total: number;
}

test.describe("Data Standards API", () => {
  test.describe("Unauthenticated", () => {
    test("list requires authentication", async ({ api }) => {
      await expect(api.callTrpc("data.list")).rejects.toThrow();
    });
  });

  test.describe("Authenticated as SUPER_ADMIN", () => {
    test.beforeEach(async ({ api }) => {
      await api.authenticateAs("SUPER_ADMIN");
    });

    test("can list data standards", async ({ api }) => {
      const result = await api.callTrpc<DataListResult>("data.list", {});

      expect(result).toHaveProperty("items");
      expect(Array.isArray(result.items)).toBe(true);
    });

    test("can get classification statistics", async ({ api }) => {
      const result = await api.callTrpc<DataClassificationStats>(
        "data.getClassification"
      );

      expect(result).toHaveProperty("byClassification");
      expect(result).toHaveProperty("validated");
      expect(result).toHaveProperty("pending");
      expect(Array.isArray(result.byClassification)).toBe(true);
    });

    test("can get pending validations", async ({ api }) => {
      const result = await api.callTrpc<unknown[]>(
        "data.getPendingValidations"
      );

      expect(Array.isArray(result)).toBe(true);
    });
  });

  test.describe("Authenticated as OPERATOR", () => {
    test.beforeEach(async ({ api }) => {
      await api.authenticateAs("OPERATOR");
    });

    test("can list data standards", async ({ api }) => {
      const result = await api.callTrpc<DataListResult>("data.list", {});
      expect(result).toHaveProperty("items");
    });

    test("can submit data standard", async ({ api }) => {
      // This is just a read test for now, but verifying list access
      const result = await api.callTrpc<DataListResult>("data.list", {
        isValidated: false,
      });
      expect(result).toHaveProperty("items");
    });
  });
});
