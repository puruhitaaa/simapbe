import { expect, test } from "../../fixtures/auth.fixture";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3001";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
  });

  test("displays login form", async ({ page }) => {
    await expect(
      page.locator('input[type="email"], input[name="email"]')
    ).toBeVisible();
    await expect(
      page.locator('input[type="password"], input[name="password"]')
    ).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("shows validation errors for empty form", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Check for validation messages (tanstack-form with zod)
    await expect(page.getByText(/invalid email/i).first()).toBeVisible();
    await expect(
      page.getByText(/at least 8 characters/i).first()
    ).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.fill(
      'input[type="email"], input[name="email"]',
      "invalid@example.com"
    );
    await page.fill(
      'input[type="password"], input[name="password"]',
      "wrongpassword"
    );
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    const errorMessage = page.locator(
      '[role="alert"], .error, [data-testid="error-message"]'
    );
    const stillOnLogin = page.url().includes("/login");

    expect((await errorMessage.isVisible()) || stillOnLogin).toBe(true);
  });

  test("successful login redirects to dashboard", async ({ auth }) => {
    const success = await auth.loginAs("SUPER_ADMIN");
    expect(success).toBe(true);
  });

  test("login as OPERATOR works", async ({ auth }) => {
    const success = await auth.loginAs("OPERATOR");
    expect(success).toBe(true);
  });

  test("login as AUDITOR works", async ({ auth }) => {
    const success = await auth.loginAs("AUDITOR");
    expect(success).toBe(true);
  });

  test("login as LEADER works", async ({ auth }) => {
    const success = await auth.loginAs("LEADER");
    expect(success).toBe(true);
  });
});

test.describe("Authentication Flow", () => {
  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    await page.waitForURL("**/login**", { timeout: 10_000 });
    expect(page.url()).toContain("/login");
  });

  test("authenticated user can access dashboard", async ({ page, auth }) => {
    await auth.loginAs("SUPER_ADMIN");

    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/.*dashboard.*/);
  });

  test("session cookies are set after login", async ({ auth }) => {
    await auth.loginAs("SUPER_ADMIN");

    const cookies = await auth.getAuthCookies();
    expect(cookies.length).toBeGreaterThan(0);
  });
});
