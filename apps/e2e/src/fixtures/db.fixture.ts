import { test as base } from "@playwright/test";

export const TEST_PREFIX = "TEST_";

const API_URL = process.env.E2E_API_URL || "http://localhost:3000";

async function cleanupViaAPI(): Promise<void> {
  console.log("🧹 Cleaning up test data via API...");
  try {
    const response = await fetch(`${API_URL}/api/test/cleanup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefix: TEST_PREFIX }),
    });
    if (!response.ok) {
      console.warn("Cleanup endpoint not available, skipping...");
    }
    console.log("✅ Test data cleaned up");
  } catch {
    console.warn("Cleanup endpoint not available, skipping...");
  }
}

export async function createTestOpd(
  overrides: Partial<{
    code: string;
    name: string;
    acronym: string;
    address: string;
  }> = {}
) {
  const suffix = Date.now().toString(36);
  return {
    code: overrides.code || `${TEST_PREFIX}OPD_${suffix}`,
    name: overrides.name || `Test OPD ${suffix}`,
    acronym: overrides.acronym || `TOPD${suffix.slice(-3)}`,
    address: overrides.address || "Test Address",
  };
}

export async function createTestProbis(
  overrides: Partial<{
    kodeProbismet: string;
    name: string;
    level: number;
    parentId: string;
  }> = {}
) {
  const suffix = Date.now().toString(36);
  return {
    kodeProbismet: overrides.kodeProbismet || `${TEST_PREFIX}PB.${suffix}`,
    name: overrides.name || `Test Process ${suffix}`,
    level: overrides.level || 1,
    parentId: overrides.parentId,
  };
}

export async function createTestDataStandard(
  opdId: string,
  overrides: Partial<{
    dataName: string;
    format: string;
    validityPeriod: string;
  }> = {}
) {
  const suffix = Date.now().toString(36);
  return {
    dataName: overrides.dataName || `${TEST_PREFIX}Data ${suffix}`,
    format: overrides.format || "JSON",
    validityPeriod: overrides.validityPeriod || "Annual",
    producerOpdId: opdId,
    classification: "PUBLIC" as const,
  };
}

export async function createTestApplication(
  opdId: string,
  overrides: Partial<{
    name: string;
    type: "UMUM" | "KHUSUS";
    platform: "WEB" | "MOBILE" | "DESKTOP" | "API";
  }> = {}
) {
  const suffix = Date.now().toString(36);
  return {
    name: overrides.name || `${TEST_PREFIX}App ${suffix}`,
    opdId,
    type: overrides.type || ("KHUSUS" as const),
    platform: overrides.platform || ("WEB" as const),
    status: "ACTIVE" as const,
  };
}

export async function createTestInfrastructure(
  opdId: string,
  overrides: Partial<{
    name: string;
    type:
      | "SERVER_PHYSICAL"
      | "VIRTUAL_MACHINE"
      | "CLOUD_SaaS"
      | "CLOUD_IaaS"
      | "NETWORK_DEVICE";
    location: "PDN" | "LOCAL";
  }> = {}
) {
  const suffix = Date.now().toString(36);
  return {
    name: overrides.name || `${TEST_PREFIX}Infra ${suffix}`,
    opdId,
    type: overrides.type || ("VIRTUAL_MACHINE" as const),
    location: overrides.location || ("LOCAL" as const),
  };
}

export interface DBFixture {
  cleanup: () => Promise<void>;
  testDataGenerators: {
    opd: typeof createTestOpd;
    probis: typeof createTestProbis;
    dataStandard: typeof createTestDataStandard;
    application: typeof createTestApplication;
    infrastructure: typeof createTestInfrastructure;
  };
}

export const test = base.extend<{ db: DBFixture }>({
  db: async ({}, use) => {
    const fixture: DBFixture = {
      cleanup: cleanupViaAPI,
      testDataGenerators: {
        opd: createTestOpd,
        probis: createTestProbis,
        dataStandard: createTestDataStandard,
        application: createTestApplication,
        infrastructure: createTestInfrastructure,
      },
    };

    await use(fixture);
  },
});

export { expect } from "@playwright/test";
