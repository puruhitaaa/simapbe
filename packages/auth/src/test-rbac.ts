import { requirePermission, type UserContext, verifyOPD } from "./rbac";

const mockSuperAdmin: UserContext = {
  id: "1",
  email: "sa@test.com",
  name: "Super Admin",
  role: "SUPER_ADMIN",
  opdId: null,
};

const mockOperator: UserContext = {
  id: "2",
  email: "op@test.com",
  name: "Operator",
  role: "OPERATOR",
  opdId: "opd1",
};

const mockAuditor: UserContext = {
  id: "3",
  email: "aud@test.com",
  name: "Auditor",
  role: "AUDITOR",
  opdId: null,
};

function test() {
  console.log("Testing RBAC...");

  // Test 1: Super Admin Permissions
  try {
    requirePermission(mockSuperAdmin, "opd", "delete");
    console.log("✅ Super Admin can delete OPD");
  } catch (e) {
    console.error("❌ Super Admin failed delete OPD", e);
  }

  // Test 2: Operator Permissions
  try {
    requirePermission(mockOperator, "opd", "update");
    console.log("✅ Operator can update OPD (generic check)");
  } catch (e) {
    console.error("❌ Operator failed update OPD", e);
  }

  try {
    requirePermission(mockOperator, "audit", "read");
    console.error("❌ Operator SHOULD NOT read audit");
  } catch (e) {
    console.log("✅ Operator correctly denied audit read");
  }

  // Test 3: OPD Ownership
  try {
    verifyOPD(mockOperator, "opd1");
    console.log("✅ Operator can access own OPD");
  } catch (e) {
    console.error("❌ Operator failed access own OPD", e);
  }

  try {
    verifyOPD(mockOperator, "opd2");
    console.error("❌ Operator SHOULD NOT access other OPD");
  } catch (e) {
    console.log("✅ Operator correctly denied other OPD");
  }

  // Test 4: Auditor Access
  try {
    verifyOPD(mockAuditor, "opd999");
    console.log("✅ Auditor can access any OPD");
  } catch (e) {
    console.error("❌ Auditor failed access OPD", e);
  }

  console.log("Tests completed.");
}

test();
