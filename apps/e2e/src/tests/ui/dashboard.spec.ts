import { expect, test } from "../../fixtures/auth.fixture";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3001";

test.describe("Dashboard", () => {
  test.describe("As SUPER_ADMIN", () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAs("SUPER_ADMIN");
    });

    test("can access main dashboard", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await expect(page).toHaveURL(/.*dashboard.*/);
      await expect(page.getByText(/selamat datang/i).first()).toBeVisible();
    });

    test("displays navigation sidebar", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      const sidebar = page.locator("[data-sidebar='sidebar']").first();
      await expect(sidebar).toBeVisible();
    });

    test("can navigate to OPD management", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.click('a[href="/dashboard/opd"]');
      await expect(page).toHaveURL(/.*opd.*/);
      await expect(page.getByText(/manajemen opd/i).first()).toBeVisible();
    });

    test("can navigate to User management", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.click('a[href="/dashboard/users"]');
      await expect(page).toHaveURL(/.*users.*/);
      await expect(page.getByText(/manajemen pengguna/i).first()).toBeVisible();
    });

    test("can access all 6 SPBE domains", async ({ page }) => {
      const domains = [
        "probis",
        "data",
        "aplikasi",
        "infrastruktur",
        "layanan",
        "keamanan",
      ];

      for (const domain of domains) {
        await page.goto(`${BASE_URL}/dashboard/${domain}`);
        await expect(page).toHaveURL(new RegExp(`.*${domain}.*`));
      }
    });
  });

  test.describe("As OPERATOR", () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAs("OPERATOR");
    });

    test("can access dashboard", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await expect(page).toHaveURL(/.*dashboard.*/);
    });

    test("can see relevant links in sidebar", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      // Use more specific locators to avoid strict mode violations (multiple links)
      const probisLink = page.locator(
        '[data-sidebar="sidebar"] a[href="/dashboard/probis"]'
      );
      const appLink = page.locator(
        '[data-sidebar="sidebar"] a[href="/dashboard/aplikasi"]'
      );
      await expect(probisLink).toBeVisible();
      await expect(appLink).toBeVisible();
    });
  });

  test.describe("As AUDITOR", () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAs("AUDITOR");
    });

    test("can access dashboard", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await expect(page).toHaveURL(/.*dashboard.*/);
    });

    test("can access security/audit pages", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/keamanan`);
      await expect(page).toHaveURL(/.*keamanan.*/);
    });
  });

  test.describe("As LEADER", () => {
    test.beforeEach(async ({ auth }) => {
      await auth.loginAs("LEADER");
    });

    test("can access dashboard", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await expect(page).toHaveURL(/.*dashboard.*/);
    });

    test("can view planning/roadmap", async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/planning`);
      await expect(page).toHaveURL(/.*planning.*/);
    });
  });
});
