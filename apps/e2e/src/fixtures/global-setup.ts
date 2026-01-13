import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, "../../.env.e2e") });

export default async function globalSetup() {
  console.log("\n🚀 E2E Tests: Global Setup Started");

  const apiUrl = process.env.E2E_API_URL || "http://localhost:3000";
  const webUrl = process.env.E2E_BASE_URL || "http://localhost:3001";

  let retries = 30;
  const delay = 1000;

  while (retries > 0) {
    try {
      const [apiResponse, webResponse] = await Promise.all([
        fetch(`${apiUrl}/trpc/healthCheck`).catch(() => null),
        fetch(webUrl).catch(() => null),
      ]);

      if (apiResponse?.ok && webResponse?.ok) {
        console.log("✅ API Server is ready");
        console.log("✅ Web Server is ready");
        break;
      }
    } catch {
      void 0;
    }

    retries--;
    if (retries === 0) {
      throw new Error("Servers did not start in time");
    }

    await new Promise((r) => setTimeout(r, delay));
  }

  console.log("🎯 E2E Tests: Global Setup Complete\n");
}
