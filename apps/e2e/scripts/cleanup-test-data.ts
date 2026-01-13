import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(__dirname, "../.env.e2e") });

const API_URL = process.env.E2E_API_URL || "http://localhost:3000";
const TEST_PREFIX = "TEST_";

async function cleanup(): Promise<void> {
  console.log("🧹 Cleaning up E2E test data...\n");
  console.log(`API URL: ${API_URL}`);
  console.log(`Test prefix: ${TEST_PREFIX}\n`);

  try {
    const response = await fetch(`${API_URL}/api/test/cleanup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefix: TEST_PREFIX }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Cleanup complete:", result);
    } else {
      console.log(
        "⚠️  Cleanup endpoint not available (this is expected if not implemented)"
      );
      console.log(
        "   Test data with TEST_ prefix should be cleaned manually if needed."
      );
    }
  } catch {
    console.log("⚠️  Could not connect to cleanup endpoint");
    console.log(
      "   This is expected if the server is not running or endpoint not implemented."
    );
  }
}

cleanup();
