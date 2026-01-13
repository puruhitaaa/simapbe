import { randomBytes, scrypt } from "node:crypto";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { config } from "dotenv";

config({ path: resolve(__dirname, "../.env.e2e") });

const scryptAsync = promisify(scrypt);

const API_URL = process.env.E2E_API_URL || "http://localhost:3000";

interface TestUserConfig {
  email: string;
  password: string;
  name: string;
  role: "SUPER_ADMIN" | "OPERATOR" | "AUDITOR" | "LEADER";
}

const TEST_USERS: TestUserConfig[] = [
  {
    email: process.env.E2E_USER_SUPER_ADMIN_EMAIL || "test_admin@simapbe.test",
    password: process.env.E2E_USER_SUPER_ADMIN_PASSWORD || "TestAdmin123!",
    name: "Test Super Admin",
    role: "SUPER_ADMIN",
  },
  {
    email: process.env.E2E_USER_OPERATOR_EMAIL || "test_operator@simapbe.test",
    password: process.env.E2E_USER_OPERATOR_PASSWORD || "TestOperator123!",
    name: "Test Operator",
    role: "OPERATOR",
  },
  {
    email: process.env.E2E_USER_AUDITOR_EMAIL || "test_auditor@simapbe.test",
    password: process.env.E2E_USER_AUDITOR_PASSWORD || "TestAuditor123!",
    name: "Test Auditor",
    role: "AUDITOR",
  },
  {
    email: process.env.E2E_USER_LEADER_EMAIL || "test_leader@simapbe.test",
    password: process.env.E2E_USER_LEADER_PASSWORD || "TestLeader123!",
    name: "Test Leader",
    role: "LEADER",
  },
];

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function seedTestUsers(): Promise<void> {
  console.log("🌱 Seeding test users...\n");

  for (const user of TEST_USERS) {
    try {
      const response = await fetch(`${API_URL}/api/auth/sign-up/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          password: user.password,
          name: user.name,
        }),
      });

      if (response.ok) {
        console.log(`✅ Created user: ${user.email} (${user.role})`);
      } else if (response.status === 409) {
        console.log(`⏭️  User already exists: ${user.email}`);
      } else {
        const error = await response.text();
        console.error(`❌ Failed to create ${user.email}: ${error}`);
      }
    } catch (error) {
      console.error(`❌ Error creating ${user.email}:`, error);
    }
  }

  console.log("\n✅ Test user seeding complete!");
  console.log("\nTest credentials:");
  for (const user of TEST_USERS) {
    console.log(`  ${user.role}: ${user.email} / ${user.password}`);
  }
}

async function main() {
  try {
    console.log("🚀 E2E Test Data Seeding\n");
    console.log(`API URL: ${API_URL}\n`);

    let retries = 10;
    while (retries > 0) {
      try {
        const response = await fetch(`${API_URL}/trpc/healthCheck`);
        if (response.ok) break;
      } catch {
        void 0;
      }
      retries--;
      console.log(`Waiting for API server... (${retries} retries left)`);
      await new Promise((r) => setTimeout(r, 2000));
    }

    if (retries === 0) {
      throw new Error("API server not available");
    }

    await seedTestUsers();
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

main();
