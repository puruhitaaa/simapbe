import { expect, test } from "@playwright/test";

const API_URL = process.env.E2E_API_URL || "http://localhost:3000";

test.describe("Health Check API", () => {
  test("GET /trpc/healthCheck returns OK", async ({ request }) => {
    const response = await request.get(`${API_URL}/trpc/healthCheck`);

    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data.result?.data).toBe("OK");
  });

  test("API server responds to root endpoint", async ({ request }) => {
    const response = await request.get(`${API_URL}/`);
    expect(response.status()).toBeLessThan(500);
  });

  test("tRPC batch endpoint is available", async ({ request }) => {
    const response = await request.get(`${API_URL}/trpc/healthCheck?batch=1`);
    expect(response.ok()).toBe(true);
  });
});
