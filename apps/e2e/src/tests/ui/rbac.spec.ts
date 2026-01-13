import { expect, test } from "../../fixtures/auth.fixture";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3001";

test.describe("Role-Based Access Control (RBAC)", () => {
  test.describe("SUPER_ADMIN Permissions", () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAs("SUPER_ADMIN");
    });

    test("can access user management", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/users`);

      const pageContent = await page.content();
      const hasAccess = !(
        pageContent.toLowerCase().includes("forbidden") ||
        pageContent.toLowerCase().includes("unauthorized")
      );
      expect(hasAccess).toBe(true);
    });

    test("can access OPD management", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/opd`);

      const pageContent = await page.content();
      const hasAccess = !pageContent.toLowerCase().includes("forbidden");
      expect(hasAccess).toBe(true);
    });

    test("can access all domain pages", async ({ page }) => {
      const domainPages = [
        "/dashboard/probis",
        "/dashboard/data",
        "/dashboard/aplikasi",
        "/dashboard/infrastruktur",
        "/dashboard/layanan",
        "/dashboard/keamanan",
        "/dashboard/planning",
      ];

      for (const path of domainPages) {
        await page.goto(`${BASE_URL}${path}`);
        const pageContent = await page.content();
        const hasAccess = !pageContent.toLowerCase().includes("forbidden");
        expect(hasAccess).toBe(true);
      }
    });
  });

  test.describe("OPERATOR Permissions", () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAs("OPERATOR");
    });

    test("can see relevant links in sidebar", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);

      // Use specific locators to avoid multiple matches (sidebar vs dashboard cards/breadcrumbs)
      const probisLink = page.locator(
        '[data-sidebar="sidebar"] a[href="/dashboard/probis"]'
      );
      const appLink = page.locator(
        '[data-sidebar="sidebar"] a[href="/dashboard/aplikasi"]'
      );

      await expect(probisLink).toBeVisible();
      await expect(appLink).toBeVisible();
    });

    test("can access allowed domain pages", async ({ page }) => {
      const allowedPages = [
        "/dashboard",
        "/dashboard/probis",
        "/dashboard/data",
        "/dashboard/aplikasi",
        "/dashboard/infrastruktur",
        "/dashboard/layanan",
      ];

      for (const path of allowedPages) {
        await page.goto(`${BASE_URL}${path}`);
        await expect(page).not.toHaveURL(/.*login.*/);
      }
    });
  });

  test.describe("AUDITOR Permissions", () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAs("AUDITOR");
    });

    test("has access to security/audit", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/keamanan`);

      const pageContent = await page.content();
      const hasAccess = !pageContent.toLowerCase().includes("forbidden");
      expect(hasAccess).toBe(true);
    });

    test("can see audit logs link if permitted", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      // Auditor has read access to audit logs in definitions.ts
      const keamananLink = page.locator(
        '[data-sidebar="sidebar"] a[href="/dashboard/keamanan"]'
      );
      await expect(keamananLink).toBeVisible();
    });
  });

  test.describe("LEADER Permissions", () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAs("LEADER");
    });

    test("can view dashboard overview", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await expect(page).toHaveURL(/.*dashboard.*/);
    });

    test("can view planning/roadmap", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/planning`);

      const pageContent = await page.content();
      const hasAccess = !pageContent.toLowerCase().includes("forbidden");
      expect(hasAccess).toBe(true);
    });
  });
});
