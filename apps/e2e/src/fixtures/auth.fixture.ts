import { type BrowserContext, test as base, type Page } from "@playwright/test";

export interface TestUser {
  email: string;
  password: string;
  role: "SUPER_ADMIN" | "OPERATOR" | "AUDITOR" | "LEADER";
  name: string;
}

export const TEST_USERS: Record<string, TestUser> = {
  SUPER_ADMIN: {
    email: process.env.E2E_USER_SUPER_ADMIN_EMAIL || "admin@bandung.go.id",
    password: process.env.E2E_USER_SUPER_ADMIN_PASSWORD || "password123",
    role: "SUPER_ADMIN",
    name: "Super Admin Diskominfo",
  },
  OPERATOR: {
    email:
      process.env.E2E_USER_OPERATOR_EMAIL ||
      "operator.diskominfo@bandung.go.id",
    password: process.env.E2E_USER_OPERATOR_PASSWORD || "password123",
    role: "OPERATOR",
    name: "Operator Diskominfo",
  },
  AUDITOR: {
    email: process.env.E2E_USER_AUDITOR_EMAIL || "auditor@bandung.go.id",
    password: process.env.E2E_USER_AUDITOR_PASSWORD || "password123",
    role: "AUDITOR",
    name: "Auditor Inspektorat",
  },
  LEADER: {
    email: process.env.E2E_USER_LEADER_EMAIL || "pimpinan@bandung.go.id",
    password: process.env.E2E_USER_LEADER_PASSWORD || "password123",
    role: "LEADER",
    name: "Kepala Bappelitbang",
  },
};

const API_URL = process.env.E2E_API_URL || "http://localhost:3000";

export async function loginViaAPI(
  email: string,
  password: string
): Promise<{ token: string; user: Record<string, unknown> } | null> {
  try {
    const response = await fetch(`${API_URL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      console.error(`Login failed: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Login error:", error);
    return null;
  }
}

export async function loginViaUI(
  page: Page,
  email: string,
  password: string
): Promise<boolean> {
  const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3001";

  try {
    await page.goto(`${baseUrl}/login`);
    await page.waitForSelector('input[type="email"], input[name="email"]', {
      timeout: 10_000,
    });
    await page.fill('input[type="email"], input[name="email"]', email);
    await page.fill('input[type="password"], input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard**", { timeout: 15_000 });
    return true;
  } catch (error) {
    console.error("UI Login error:", error);
    return false;
  }
}

export async function logoutViaUI(page: Page): Promise<void> {
  try {
    const userMenu = page.locator(
      '[data-testid="user-menu"], button:has-text("Logout")'
    );
    if (await userMenu.isVisible()) {
      await userMenu.click();
      const logoutBtn = page.locator(
        'button:has-text("Logout"), [data-testid="logout-button"]'
      );
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
      }
    }
  } catch {
    void 0;
  }
}

export async function getAuthCookies(
  context: BrowserContext
): Promise<Array<{ name: string; value: string }>> {
  const cookies = await context.cookies();
  return cookies.filter(
    (c) =>
      c.name.includes("session") ||
      c.name.includes("auth") ||
      c.name.includes("better-auth")
  );
}

export interface AuthFixture {
  testUsers: typeof TEST_USERS;
  loginAs: (role: keyof typeof TEST_USERS) => Promise<boolean>;
  logout: () => Promise<void>;
  getAuthCookies: () => Promise<Array<{ name: string; value: string }>>;
}

export const test = base.extend<{ auth: AuthFixture }>({
  auth: async ({ page, context }, use) => {
    const fixture: AuthFixture = {
      testUsers: TEST_USERS,

      loginAs: async (role) => {
        const user = TEST_USERS[role];
        if (!user) throw new Error(`Unknown role: ${role}`);
        return loginViaUI(page, user.email, user.password);
      },

      logout: async () => {
        await logoutViaUI(page);
      },

      getAuthCookies: async () => {
        return getAuthCookies(context);
      },
    };

    await use(fixture);
  },
});

export { expect } from "@playwright/test";
