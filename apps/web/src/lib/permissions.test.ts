import { hasPermission } from "./permissions.js";

describe("Frontend Permissions", () => {
  test("Super Admin has all access", () => {
    expect(hasPermission("SUPER_ADMIN", "opd", "delete")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "audit", "read")).toBe(true);
  });

  test("Operator has limited access", () => {
    expect(hasPermission("OPERATOR", "opd", "read")).toBe(true);
    // Operator doesn't have 'delete' on 'opd' generally (in definition)
    // Wait, OPERATOR definition: opd: ["read", "list", "update"]
    expect(hasPermission("OPERATOR", "opd", "delete")).toBe(false);

    // Operator has no audit access
    expect(hasPermission("OPERATOR", "audit", "read")).toBe(false);
  });

  test("Auditor has read only", () => {
    expect(hasPermission("AUDITOR", "opd", "read")).toBe(true);
    expect(hasPermission("AUDITOR", "opd", "update")).toBe(false);
    expect(hasPermission("AUDITOR", "audit", "read")).toBe(true);
  });

  test("Invalid role returns false", () => {
    expect(hasPermission("HACKER", "opd", "read")).toBe(false);
    expect(hasPermission(null, "opd", "read")).toBe(false);
  });
});
