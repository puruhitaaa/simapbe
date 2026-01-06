/**
 * SPBE Role-Based Access Control Definitions
 * Ref: Perpres 132/2022 - Domain Keamanan SPBE
 *
 * This file is isomorphic and can be used in both server and client.
 */

export const statement = {
  // Domain Management (Tenancy)
  opd: ["create", "read", "update", "delete", "list"],

  // Domain 1: Business Process
  probis: ["create", "read", "update", "delete", "list", "verify"],

  // Domain 2: Data Architecture
  data: ["create", "read", "update", "delete", "list", "validate"],

  // Domain 3: Application
  app: ["create", "read", "update", "delete", "list", "check_moratorium"],

  // Domain 4: Infrastructure
  infra: ["create", "read", "update", "delete", "list"],

  // Domain 5: Service
  service: ["create", "read", "update", "delete", "list"],

  // Domain 6: Security
  security: ["create", "read", "update", "delete", "list", "assess_risk"],

  // Planning (Peta Rencana)
  planning: ["create", "read", "update", "delete", "list", "gap_analysis"],

  // User Management
  user: [
    "create",
    "read",
    "update",
    "delete",
    "list",
    "change_role",
    "assign_opd",
  ],

  // Audit Logs
  audit: ["read", "list"],

  // System Settings
  settings: ["read", "update"],
} as const;

export type ResourceType = keyof typeof statement;
export type UserRole = "SUPER_ADMIN" | "OPERATOR" | "AUDITOR" | "LEADER";

export const rolePermissions = {
  SUPER_ADMIN: {
    opd: ["create", "read", "update", "delete", "list"],
    probis: ["create", "read", "update", "delete", "list", "verify"],
    data: ["create", "read", "update", "delete", "list", "validate"],
    app: ["create", "read", "update", "delete", "list", "check_moratorium"],
    infra: ["create", "read", "update", "delete", "list"],
    service: ["create", "read", "update", "delete", "list"],
    security: ["create", "read", "update", "delete", "list", "assess_risk"],
    planning: ["create", "read", "update", "delete", "list", "gap_analysis"],
    user: [
      "create",
      "read",
      "update",
      "delete",
      "list",
      "change_role",
      "assign_opd",
    ],
    audit: ["read", "list"],
    settings: ["read", "update"],
  },
  OPERATOR: {
    opd: ["read", "list", "update"],
    probis: ["create", "read", "update", "delete", "list"],
    data: ["create", "read", "update", "delete", "list"],
    app: ["create", "read", "update", "delete", "list"],
    infra: ["create", "read", "update", "delete", "list"],
    service: ["create", "read", "update", "delete", "list"],
    security: ["create", "read", "update", "delete", "list"],
    planning: ["create", "read", "update", "delete", "list"],
    user: ["read", "list"],
  },
  AUDITOR: {
    opd: ["read", "list"],
    probis: ["read", "list"],
    data: ["read", "list"],
    app: ["read", "list"],
    infra: ["read", "list"],
    service: ["read", "list"],
    security: ["read", "list"],
    planning: ["read", "list"],
    user: ["read", "list"],
    audit: ["read", "list"],
  },
  LEADER: {
    opd: ["read", "list"],
    probis: ["read", "list"],
    data: ["read", "list"],
    app: ["read", "list"],
    infra: ["read", "list"],
    service: ["read", "list"],
    security: ["read", "list"],
    planning: ["read", "list"],
  },
} as const;
