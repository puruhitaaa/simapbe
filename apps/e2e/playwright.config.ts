import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, ".env.e2e") });

export default defineConfig({
  testDir: "./src/tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "api",
      testDir: "./src/tests/api",
      use: {},
    },
    {
      name: "chromium",
      testDir: "./src/tests/ui",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      testDir: "./src/tests/ui",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      testDir: "./src/tests/ui",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "integration",
      testDir: "./src/tests/integration",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      testDir: "./src/tests/ui",
      use: { ...devices["Pixel 5"] },
    },
  ],

  globalSetup: resolve(__dirname, "./src/fixtures/global-setup.ts"),
  globalTeardown: resolve(__dirname, "./src/fixtures/global-teardown.ts"),

  webServer: process.env.CI
    ? undefined
    : [
        {
          command: "bun run dev:server",
          url: process.env.E2E_API_URL || "http://localhost:3000",
          reuseExistingServer: true,
          cwd: resolve(__dirname, "../.."),
          timeout: 60_000,
        },
        {
          command: "bun run dev:web",
          url: process.env.E2E_BASE_URL || "http://localhost:3001",
          reuseExistingServer: true,
          cwd: resolve(__dirname, "../.."),
          timeout: 60_000,
        },
      ],
});
